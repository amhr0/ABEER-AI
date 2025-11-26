import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle, Loader2, MessageSquare, Server, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ErrorLogs() {
  const { user, loading: authLoading } = useAuth();

  const { data: errorLogs, isLoading, refetch } = trpc.errorLogs.getAll.useQuery(
    undefined,
    { enabled: !!user }
  );

  const updateStatus = trpc.errorLogs.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الخطأ");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في تحديث الحالة: ${error.message}`);
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500";
      case "low":
        return "bg-blue-500/20 text-blue-300 border-blue-500";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "ignored":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case "analyzing":
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
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
          <p className="text-gray-300 mb-6">
            يجب تسجيل الدخول للوصول لسجلات الأخطاء
          </p>
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
            <Button asChild variant="outline" size="sm">
              <Link href="/chat">
                <a className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  الدردشة
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <h1 className="text-3xl font-bold text-white">سجلات الأخطاء</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : errorLogs && errorLogs.length > 0 ? (
          <div className="grid gap-4">
            {errorLogs.map((error) => (
              <Card
                key={error.id}
                className={`p-6 bg-gray-800/50 border-2 transition-colors ${getSeverityColor(
                  error.severity
                )}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(error.status)}
                    <div>
                      <h3 className="text-xl font-bold text-white">{error.errorType}</h3>
                      <span className="text-sm text-gray-400">
                        {new Date(error.createdAt).toLocaleString("ar-SA")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={error.status}
                      onValueChange={(value) =>
                        updateStatus.mutate({
                          id: error.id,
                          status: value as any,
                        })
                      }
                    >
                      <SelectTrigger className="w-32 bg-gray-900/50 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">جديد</SelectItem>
                        <SelectItem value="analyzing">قيد التحليل</SelectItem>
                        <SelectItem value="resolved">تم الحل</SelectItem>
                        <SelectItem value="ignored">تم التجاهل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-1">رسالة الخطأ:</h4>
                    <p className="text-white font-mono text-sm bg-gray-900/50 p-3 rounded">
                      {error.errorMessage}
                    </p>
                  </div>

                  {error.filePath && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">الملف:</h4>
                      <p className="text-blue-300 font-mono text-sm">
                        {error.filePath}
                        {error.lineNumber && `:${error.lineNumber}`}
                      </p>
                    </div>
                  )}

                  {error.stackTrace && (
                    <details className="cursor-pointer">
                      <summary className="text-sm font-semibold text-gray-400 mb-1">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-gray-300 bg-gray-900/50 p-3 rounded overflow-x-auto mt-2">
                        {error.stackTrace}
                      </pre>
                    </details>
                  )}

                  {error.solution && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-1">الحل:</h4>
                      <p className="text-white bg-green-900/20 p-3 rounded">{error.solution}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد أخطاء مسجلة. كل شيء يعمل بشكل جيد!</p>
          </Card>
        )}
      </main>
    </div>
  );
}
