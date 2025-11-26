import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  HardDrive,
  Loader2,
  MessageSquare,
  Play,
  Server,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function ServerControl() {
  const { user, loading: authLoading } = useAuth();
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<
    Array<{ command: string; output: string; timestamp: string }>
  >([]);

  const { data: serverStatus, isLoading: statusLoading } =
    trpc.server.getStatus.useQuery(undefined, {
      enabled: !!user,
      refetchInterval: 10000, // كل 10 ثواني
    });

  const executeCommand = trpc.server.executeCommand.useMutation({
    onSuccess: (data) => {
      setCommandHistory((prev) => [
        ...prev,
        {
          command,
          output: data.stdout || data.stderr,
          timestamp: new Date().toISOString(),
        },
      ]);
      setCommand("");
    },
    onError: (error) => {
      setCommandHistory((prev) => [
        ...prev,
        {
          command,
          output: `خطأ: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setCommand("");
    },
  });

  const handleExecuteCommand = () => {
    if (!command.trim() || executeCommand.isPending) return;
    executeCommand.mutate({ command: command.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleExecuteCommand();
    }
  };

  if (authLoading) {
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
          <p className="text-gray-300 mb-6">يجب تسجيل الدخول للوصول للوحة التحكم</p>
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
        <div className="flex items-center gap-3 mb-8">
          <Server className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">لوحة تحكم السيرفر</h1>
        </div>

        {/* Server Status */}
        {statusLoading ? (
          <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          </Card>
        ) : serverStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-medium text-gray-400">CPU</h3>
              </div>
              <p className="text-2xl font-bold text-white">{serverStatus.cpu}</p>
            </Card>

            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-medium text-gray-400">الذاكرة</h3>
              </div>
              <p className="text-2xl font-bold text-white">{serverStatus.memory}</p>
            </Card>

            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-medium text-gray-400">القرص</h3>
              </div>
              <p className="text-2xl font-bold text-white">{serverStatus.disk}</p>
            </Card>

            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-medium text-gray-400">وقت التشغيل</h3>
              </div>
              <p className="text-lg font-bold text-white">{serverStatus.uptime}</p>
            </Card>
          </div>
        ) : (
          <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
            <p className="text-gray-400 text-center">
              لم يتم إعداد بيانات السيرفر. يرجى إضافة بيانات الاتصال في الإعدادات.
            </p>
          </Card>
        )}

        {/* Terminal */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Terminal</h2>
          </div>

          {/* Command History */}
          <div className="bg-black/50 rounded-lg p-4 mb-4 font-mono text-sm h-96 overflow-y-auto">
            {commandHistory.length === 0 ? (
              <p className="text-gray-500">اكتب أمراً للبدء...</p>
            ) : (
              commandHistory.map((entry, idx) => (
                <div key={idx} className="mb-4">
                  <div className="text-green-400">
                    $ {entry.command}
                  </div>
                  <pre className="text-gray-300 whitespace-pre-wrap mt-1">
                    {entry.output}
                  </pre>
                  <div className="text-gray-600 text-xs mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString("ar-SA")}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Command Input */}
          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="أدخل أمر SSH (مثل: ls, ps, df -h)"
              disabled={executeCommand.isPending || !serverStatus}
              className="flex-1 bg-black/30 border-gray-600 text-white font-mono"
              dir="ltr"
            />
            <Button
              onClick={handleExecuteCommand}
              disabled={!command.trim() || executeCommand.isPending || !serverStatus}
              size="icon"
            >
              {executeCommand.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            الأوامر المسموحة: ls, cat, tail, ps, top, df, free, uptime, git, npm, node
          </p>
        </Card>
      </main>
    </div>
  );
}
