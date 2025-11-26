import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, Send, User, LogOut, Search, Settings, History, Server, BookOpen, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { Link } from "wouter";

export default function Chat() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [enableSearch, setEnableSearch] = useState(false);
  const [localMessages, setLocalMessages] = useState<
    Array<{ role: "user" | "ai"; content: string; timestamp: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // جلب سجل المحادثات
  const { data: history, isLoading: historyLoading } = trpc.agent.getHistory.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  // إرسال رسالة
  const sendMessageMutation = trpc.agent.sendMessage.useMutation({
    onSuccess: (data) => {
      setLocalMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.reply,
          timestamp: data.timestamp,
        },
      ]);
    },
  });

  // جلب إعدادات API
  const { data: settings } = trpc.agent.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // فحص الصحة
  const { data: healthData } = trpc.agent.health.useQuery(undefined, {
    refetchInterval: 30000, // كل 30 ثانية
  });

  // تحميل السجل عند بدء التشغيل
  useEffect(() => {
    if (history) {
      const formattedHistory = history.map((conv) => [
        {
          role: "user" as const,
          content: conv.message,
          timestamp: conv.createdAt.toISOString(),
        },
        {
          role: "ai" as const,
          content: conv.response,
          timestamp: conv.createdAt.toISOString(),
        },
      ]).flat();
      setLocalMessages(formattedHistory);
    }
  }, [history]);

  // التمرير التلقائي للأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    const userMessage = message.trim();
    setMessage("");

    // إضافة رسالة المستخدم مباشرة
    setLocalMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    // إرسال للخادم
    sendMessageMutation.mutate({ 
      message: userMessage,
      enableSearch: enableSearch 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <Bot className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">مرحباً بك في AI Agent</h1>
          <p className="text-muted-foreground">
            يرجى تسجيل الدخول للبدء في المحادثة مع الذكاء الاصطناعي
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>تسجيل الدخول</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Agent</h1>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthData?.status === "healthy"
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-muted-foreground">
                  {healthData?.status === "healthy" ? "متصل" : "غير متصل"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/history">
                <a className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  السجل
                </a>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/server">
                <a className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  السيرفر
                </a>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/knowledge">
                <a className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  المعرفة
                </a>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/errors">
                <a className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  الأخطاء
                </a>
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-6 space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                ابدأ محادثة جديدة
              </h2>
              <p className="text-muted-foreground max-w-md">
                اكتب رسالتك في الأسفل وسأكون سعيداً بمساعدتك
              </p>
            </div>
          ) : (
            localMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "ai" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  {msg.role === "ai" ? (
                    <Streamdown className="prose prose-sm dark:prose-invert max-w-none">
                      {msg.content}
                    </Streamdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span
                    className={`text-xs mt-2 block ${
                      msg.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {sendMessageMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card">
        <div className="container py-4">
          <div className="space-y-3">
            {settings?.enableWebSearch && (
              <div className="flex items-center gap-2">
                <Switch
                  id="search-mode"
                  checked={enableSearch}
                  onCheckedChange={setEnableSearch}
                />
                <Label htmlFor="search-mode" className="flex items-center gap-2 cursor-pointer">
                  <Search className="w-4 h-4" />
                  البحث في الإنترنت
                </Label>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                dir="auto"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
