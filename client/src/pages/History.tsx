import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { data: history, isLoading, refetch } = trpc.agent.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteConversation = trpc.agent.deleteConversation.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
        <Card className="p-8 max-w-md w-full bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">تسجيل الدخول مطلوب</h2>
          <p className="text-gray-300 mb-6">يجب تسجيل الدخول لعرض سجل المحادثات</p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              ABEER AI
            </a>
          </Link>
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/chat">
                <a className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  الدردشة
                </a>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">سجل المحادثات</h1>

        {!history || history.length === 0 ? (
          <Card className="p-8 bg-gray-800/50 border-gray-700 text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">لا توجد محادثات سابقة</p>
            <Button asChild className="mt-4">
              <Link href="/chat">
                <a>ابدأ محادثة جديدة</a>
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((conversation) => (
              <Card
                key={conversation.id}
                className="p-6 bg-gray-800/50 border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-gray-400">
                        {new Date(conversation.createdAt).toLocaleString("ar-SA", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteConversation.mutate({ id: conversation.id })}
                    disabled={deleteConversation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50">
                    <p className="text-sm text-gray-400 mb-1">أنت:</p>
                    <p className="text-white">{conversation.message}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">الوكيل:</p>
                    <div className="text-gray-200 prose prose-invert max-w-none">
                      <Streamdown>{conversation.response}</Streamdown>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
