import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Sparkles, Zap, ArrowRight } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold">{APP_TITLE}</span>
          </div>
          <div>
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  الدردشة
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>تسجيل الدخول</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="container py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Hero Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative p-6 rounded-2xl bg-primary/10 border border-primary/20">
                  <Bot className="w-20 h-20 text-primary" />
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                مرحباً بك في{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  AI Agent
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                وكيل ذكاء اصطناعي متطور يعمل بتقنية Google Gemini لمساعدتك في جميع استفساراتك
                ومهامك اليومية
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/chat">
                    ابدأ الدردشة الآن
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="text-lg px-8">
                  <a href={getLoginUrl()}>
                    ابدأ الآن مجاناً
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </a>
                </Button>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-20">
              <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">ذكاء متقدم</h3>
                <p className="text-muted-foreground">
                  يستخدم أحدث تقنيات Google Gemini لفهم أسئلتك وتقديم إجابات دقيقة
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">سجل محادثات</h3>
                <p className="text-muted-foreground">
                  يحفظ جميع محادثاتك بشكل آمن لتتمكن من العودة إليها في أي وقت
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">سريع وفعّال</h3>
                <p className="text-muted-foreground">
                  استجابة فورية وواجهة سهلة الاستخدام لتجربة مستخدم ممتازة
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Powered by Google Gemini AI · Built with React & tRPC</p>
        </div>
      </footer>
    </div>
  );
}
