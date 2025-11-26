import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { saveConversation, getUserConversations, getApiSettings, upsertApiSettings, deleteConversation, getServerSettings, upsertServerSettings, addKnowledge, getKnowledgeByUser, searchKnowledge, deleteKnowledge, addMemory, getMemoriesByUser, getMemoryByKey, addErrorLog, getErrorLogsByUser, updateErrorLogStatus } from "./db";
import { invokeLLM } from "./_core/llm";
import { callOpenAIWithSearch } from "./_core/openai";
import { searchWeb, formatSearchResults } from "./_core/search";
import { searchGitHubRepos, searchGitHubCode, getUserRepos, formatGitHubResults } from "./_core/github";
import { executeSSHCommand, getServerStatus, listServerFiles, readServerFile } from "./_core/ssh";
import { getContextForUser, extractAndSaveMemory, analyzeError } from "./_core/knowledge";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // AI Agent conversation router
  agent: router({
    // إرسال رسالة للوكيل التقني الذكي
    sendMessage: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1),
          enableSearch: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // جلب إعدادات API للمستخدم
          const settings = await getApiSettings(ctx.user.id);
          
          // جلب السياق من قاعدة المعرفة والذاكرة
          const userContext = await getContextForUser(ctx.user.id);
          
          let reply = "";
          let searchResults = "";
          
          // البحث في الإنترنت إذا كان مفعلاً
          if (input.enableSearch && settings?.enableWebSearch) {
            const webResults = await searchWeb(input.message);
            searchResults = formatSearchResults(webResults);
          }

          // محاولة استخدام OpenAI أولاً إذا كان متوفراً
          let useGemini = !settings?.openaiApiKey;
          
          if (settings?.openaiApiKey && !useGemini) {
            try {
              reply = await callOpenAIWithSearch({
                query: input.message,
                apiKey: settings.openaiApiKey,
                searchResults: searchResults || undefined,
              });
            } catch (error) {
              console.warn("[AI Agent] OpenAI failed, falling back to Gemini:", error);
              useGemini = true;
            }
          }
          
          // استخدام Gemini إذا لم يكن OpenAI متوفراً أو فشل
          if (useGemini) {
            // استخدام Gemini API المدمج كبديل
            let systemContent = "أنت وكيل تقني ذكي متكامل متخصص في البرمجة والتقنية والدعم الفني.\n\n";
            
            if (userContext) {
              systemContent += userContext + "\n\n";
            }
            
            if (searchResults) {
              systemContent += `لديك معلومات من البحث:\n\n${searchResults}\n\n`;
            }
            
            systemContent += "قدم إجابة دقيقة ومفيدة.";

            const response = await invokeLLM({
              messages: [
                { role: "system", content: systemContent },
                { role: "user", content: input.message },
              ],
            });

            const messageContent = response.choices[0]?.message?.content;
            reply = typeof messageContent === 'string' ? messageContent : "عذراً، لم أتمكن من الرد.";
          }

          // حفظ المحادثة
          await saveConversation({
            userId: ctx.user.id,
            message: input.message,
            response: reply,
          });
          
          // استخلاص وحفظ المعلومات المهمة في الذاكرة
          try {
            await extractAndSaveMemory(ctx.user.id, 0, input.message, reply);
          } catch (memError) {
            console.warn("[Memory] Failed to extract memory:", memError);
          }

          return {
            reply,
            timestamp: new Date().toISOString(),
            hasSearchResults: !!searchResults,
          };
        } catch (error) {
          console.error("[AI Agent] Error:", error);
          throw new Error("حدث خطأ في الاتصال بالوكيل التقني");
        }
      }),

    // جلب سجل المحادثات
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const conversations = await getUserConversations(ctx.user.id, 50);
      return conversations.reverse(); // عرض الأقدم أولاً
    }),

    // حذف محادثة
    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteConversation(ctx.user.id, input.id);
        return { success: true };
      }),

    // فحص الصحة
    health: publicProcedure.query(() => {
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    }),

    // حفظ إعدادات API
    saveSettings: protectedProcedure
      .input(
        z.object({
          openaiApiKey: z.string().optional(),
          githubToken: z.string().optional(),
          githubUsername: z.string().optional(),
          preferredModel: z.string().optional(),
          enableWebSearch: z.boolean().optional(),
          enableGithubSearch: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertApiSettings({
          userId: ctx.user.id,
          ...input,
          enableWebSearch: input.enableWebSearch ? 1 : 0,
          enableGithubSearch: input.enableGithubSearch ? 1 : 0,
        });
        return { success: true };
      }),

    // جلب إعدادات API
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getApiSettings(ctx.user.id);
      return settings ? {
        ...settings,
        enableWebSearch: settings.enableWebSearch === 1,
        enableGithubSearch: settings.enableGithubSearch === 1,
      } : null;
    }),

    // البحث في GitHub
    searchGithub: protectedProcedure
      .input(
        z.object({
          query: z.string().min(1),
          type: z.enum(["repos", "code", "user"]),
        })
      )
      .query(async ({ ctx, input }) => {
        const settings = await getApiSettings(ctx.user.id);
        
        if (input.type === "repos") {
          const repos = await searchGitHubRepos({
            query: input.query,
            token: settings?.githubToken || undefined,
          });
          return { results: repos, formatted: formatGitHubResults(repos) };
        } else if (input.type === "code") {
          const code = await searchGitHubCode({
            query: input.query,
            token: settings?.githubToken || undefined,
          });
          return { results: code };
        } else if (input.type === "user" && settings?.githubUsername) {
          const repos = await getUserRepos({
            username: settings.githubUsername,
            token: settings?.githubToken || undefined,
          });
          return { results: repos, formatted: formatGitHubResults(repos) };
        }
        
        return { results: [] };
      }),
  }),

  // مسارات السيرفر
  server: router({
    // حفظ إعدادات السيرفر
    saveSettings: protectedProcedure
      .input(
        z.object({
          sshHost: z.string().optional(),
          sshPort: z.number().optional(),
          sshUser: z.string().optional(),
          sshPrivateKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertServerSettings({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    // جلب إعدادات السيرفر
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return await getServerSettings(ctx.user.id);
    }),

    // تنفيذ أمر SSH
    executeCommand: protectedProcedure
      .input(
        z.object({
          command: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const settings = await getServerSettings(ctx.user.id);
        if (!settings || !settings.sshHost || !settings.sshUser) {
          throw new Error("يجب إعداد بيانات السيرفر أولاً");
        }

        const result = await executeSSHCommand({
          host: settings.sshHost,
          port: settings.sshPort || 22,
          user: settings.sshUser,
          command: input.command,
          privateKey: settings.sshPrivateKey || undefined,
        });

        return result;
      }),

    // حالة السيرفر
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getServerSettings(ctx.user.id);
      if (!settings || !settings.sshHost || !settings.sshUser) {
        return null;
      }

      const status = await getServerStatus({
        host: settings.sshHost,
        port: settings.sshPort || 22,
        user: settings.sshUser,
        privateKey: settings.sshPrivateKey || undefined,
      });

      return status;
    }),

    // قائمة الملفات
    listFiles: protectedProcedure
      .input(
        z.object({
          directory: z.string().default("/home"),
        })
      )
      .query(async ({ ctx, input }) => {
        const settings = await getServerSettings(ctx.user.id);
        if (!settings || !settings.sshHost || !settings.sshUser) {
          throw new Error("يجب إعداد بيانات السيرفر أولاً");
        }

        const files = await listServerFiles({
          host: settings.sshHost,
          port: settings.sshPort || 22,
          user: settings.sshUser,
          directory: input.directory,
          privateKey: settings.sshPrivateKey || undefined,
        });

        return files;
      }),

    // قراءة ملف
    readFile: protectedProcedure
      .input(
        z.object({
          filePath: z.string().min(1),
        })
      )
      .query(async ({ ctx, input }) => {
        const settings = await getServerSettings(ctx.user.id);
        if (!settings || !settings.sshHost || !settings.sshUser) {
          throw new Error("يجب إعداد بيانات السيرفر أولاً");
        }

        const content = await readServerFile({
          host: settings.sshHost,
          port: settings.sshPort || 22,
          user: settings.sshUser,
          filePath: input.filePath,
          privateKey: settings.sshPrivateKey || undefined,
        });

        return { content };
      }),
  }),

  // مسارات قاعدة المعرفة
  knowledge: router({
    // إضافة معرفة جديدة
    add: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          category: z.enum(["documentation", "code", "config", "error", "solution", "note"]),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await addKnowledge({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    // جلب جميع المعرفة
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getKnowledgeByUser(ctx.user.id);
    }),

    // البحث في المعرفة
    search: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return await searchKnowledge(ctx.user.id, input.query);
      }),

    // حذف معرفة
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteKnowledge(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // مسارات سجلات الأخطاء
  errorLogs: router({
    // إضافة خطأ جديد
    add: protectedProcedure
      .input(
        z.object({
          errorType: z.string(),
          errorMessage: z.string(),
          stackTrace: z.string().optional(),
          filePath: z.string().optional(),
          lineNumber: z.number().optional(),
          severity: z.enum(["low", "medium", "high", "critical"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // تحليل الخطأ
        const analysis = analyzeError(input.errorMessage);
        
        await addErrorLog({
          userId: ctx.user.id,
          ...input,
          status: "new",
        });
        
        return { 
          success: true,
          analysis,
        };
      }),

    // جلب جميع الأخطاء
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getErrorLogsByUser(ctx.user.id);
    }),

    // تحديث حالة الخطأ
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "analyzing", "resolved", "ignored"]),
          solution: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateErrorLogStatus(
          input.id,
          ctx.user.id,
          input.status,
          input.solution
        );
        return { success: true };
      }),

    // تحليل خطأ
    analyze: protectedProcedure
      .input(z.object({ errorMessage: z.string() }))
      .query(({ input }) => {
        return analyzeError(input.errorMessage);
      }),
  }),
});

export type AppRouter = typeof appRouter;
