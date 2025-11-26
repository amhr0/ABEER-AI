/**
 * Knowledge Base & Long-term Memory System
 * يوفر للذكاء الاصطناعي القدرة على تذكر المعلومات المهمة عبر المحادثات
 */

import { getKnowledgeByUser, getMemoriesByUser, addMemory } from "../db";

/**
 * استرجاع السياق الكامل للمستخدم من قاعدة المعرفة والذاكرة
 */
export async function getContextForUser(userId: number): Promise<string> {
  const [knowledge, memories] = await Promise.all([
    getKnowledgeByUser(userId),
    getMemoriesByUser(userId),
  ]);

  let context = "";

  // إضافة المعرفة المحفوظة
  if (knowledge && knowledge.length > 0) {
    context += "## قاعدة المعرفة:\n\n";
    for (const item of knowledge.slice(0, 10)) {
      // أخذ أحدث 10 عناصر
      context += `### ${item.title} (${item.category})\n${item.content}\n\n`;
    }
  }

  // إضافة الذاكرة طويلة الأمد
  if (memories && memories.length > 0) {
    context += "## الذاكرة طويلة الأمد:\n\n";
    for (const memory of memories.slice(0, 20)) {
      // أخذ أهم 20 ذاكرة
      context += `- **${memory.key}** (${memory.memoryType}): ${memory.value}\n`;
    }
  }

  return context;
}

/**
 * استخلاص المعلومات المهمة من المحادثة وحفظها في الذاكرة
 */
export async function extractAndSaveMemory(
  userId: number,
  conversationId: number,
  message: string,
  response: string
): Promise<void> {
  // استخلاص المعلومات التقنية المهمة
  const technicalPatterns = [
    /(?:استخدم|أستخدم|نستخدم)\s+([A-Za-z0-9\s\-\.]+)/gi,
    /(?:المشروع|البروجكت)\s+(?:اسمه|يسمى|هو)\s+([A-Za-z0-9\s\-]+)/gi,
    /(?:قاعدة البيانات|database)\s+(?:هي|نوعها)\s+([A-Za-z0-9\s]+)/gi,
  ];

  for (const pattern of technicalPatterns) {
    let match;
    while ((match = pattern.exec(message)) !== null) {
      if (match[1]) {
        await addMemory({
          userId,
          conversationId,
          memoryType: "technical_context",
          key: `extracted_tech_${Date.now()}`,
          value: match[1].trim(),
          importance: 5,
        });
      }
    }
  }

  // حفظ الحلول المقدمة
  if (
    response.includes("الحل") ||
    response.includes("يمكنك") ||
    response.includes("جرب")
  ) {
    await addMemory({
      userId,
      conversationId,
      memoryType: "solution_history",
      key: `solution_${Date.now()}`,
      value: response.substring(0, 500), // حفظ أول 500 حرف
      importance: 7,
    });
  }
}

/**
 * تحليل الأخطاء واستخلاص المعلومات المفيدة
 */
export function analyzeError(errorMessage: string): {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestions: string[];
} {
  const errorAnalysis = {
    type: "unknown",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    suggestions: [] as string[],
  };

  // تحليل نوع الخطأ
  if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("connection")) {
    errorAnalysis.type = "connection_error";
    errorAnalysis.severity = "high";
    errorAnalysis.suggestions = [
      "تحقق من أن الخادم يعمل",
      "تأكد من صحة عنوان الاتصال والمنفذ",
      "تحقق من إعدادات الجدار الناري",
    ];
  } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
    errorAnalysis.type = "not_found";
    errorAnalysis.severity = "medium";
    errorAnalysis.suggestions = [
      "تحقق من صحة المسار (URL/Path)",
      "تأكد من وجود الملف أو المورد المطلوب",
    ];
  } else if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
    errorAnalysis.type = "server_error";
    errorAnalysis.severity = "critical";
    errorAnalysis.suggestions = [
      "راجع سجلات الخادم (Server Logs)",
      "تحقق من أخطاء قاعدة البيانات",
      "تأكد من صحة إعدادات البيئة",
    ];
  } else if (
    errorMessage.includes("Unauthorized") ||
    errorMessage.includes("401") ||
    errorMessage.includes("403")
  ) {
    errorAnalysis.type = "auth_error";
    errorAnalysis.severity = "high";
    errorAnalysis.suggestions = [
      "تحقق من صحة مفاتيح API",
      "تأكد من صلاحيات الوصول",
      "راجع إعدادات المصادقة",
    ];
  } else if (errorMessage.includes("Syntax") || errorMessage.includes("Parse")) {
    errorAnalysis.type = "syntax_error";
    errorAnalysis.severity = "medium";
    errorAnalysis.suggestions = [
      "راجع الكود المذكور في رسالة الخطأ",
      "تحقق من الأقواس والفواصل",
      "استخدم أداة linting للتحقق من الكود",
    ];
  }

  return errorAnalysis;
}

/**
 * إنشاء ملخص للسياق التقني
 */
export function generateTechnicalSummary(
  knowledge: any[],
  memories: any[]
): string {
  const summary: string[] = [];

  // تحليل التقنيات المستخدمة
  const technologies = new Set<string>();
  memories.forEach((mem) => {
    if (mem.memoryType === "technical_context") {
      technologies.add(mem.value);
    }
  });

  if (technologies.size > 0) {
    summary.push(`التقنيات المستخدمة: ${Array.from(technologies).join(", ")}`);
  }

  // عدد الوثائق المحفوظة
  if (knowledge.length > 0) {
    summary.push(`عدد الوثائق المحفوظة: ${knowledge.length}`);
  }

  // عدد الحلول السابقة
  const solutions = memories.filter((m) => m.memoryType === "solution_history");
  if (solutions.length > 0) {
    summary.push(`عدد الحلول المحفوظة: ${solutions.length}`);
  }

  return summary.join(" | ");
}
