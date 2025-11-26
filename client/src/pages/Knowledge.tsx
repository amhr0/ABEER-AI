import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Server,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Knowledge() {
  const { user, loading: authLoading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("documentation");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: knowledgeList, isLoading, refetch } = trpc.knowledge.getAll.useQuery(
    undefined,
    { enabled: !!user }
  );

  const addKnowledge = trpc.knowledge.add.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المعرفة بنجاح");
      setShowAddForm(false);
      setTitle("");
      setContent("");
      setCategory("documentation");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في إضافة المعرفة: ${error.message}`);
    },
  });

  const deleteKnowledge = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المعرفة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل في حذف المعرفة: ${error.message}`);
    },
  });

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    addKnowledge.mutate({
      title: title.trim(),
      content: content.trim(),
      category: category as any,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المعرفة؟")) {
      deleteKnowledge.mutate({ id });
    }
  };

  const filteredKnowledge = knowledgeList?.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            يجب تسجيل الدخول للوصول لقاعدة المعرفة
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
          <BookOpen className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">قاعدة المعرفة</h1>
        </div>

        {/* Search & Add */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في قاعدة المعرفة..."
              className="pr-10 bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-5 h-5 ml-2" />
            إضافة معرفة جديدة
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="p-6 bg-gray-800/50 border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">إضافة معرفة جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">العنوان</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان المعرفة"
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">التصنيف</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documentation">وثائق</SelectItem>
                    <SelectItem value="code">كود</SelectItem>
                    <SelectItem value="config">إعدادات</SelectItem>
                    <SelectItem value="error">خطأ</SelectItem>
                    <SelectItem value="solution">حل</SelectItem>
                    <SelectItem value="note">ملاحظة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">المحتوى</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="محتوى المعرفة..."
                  rows={6}
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={addKnowledge.isPending}>
                  {addKnowledge.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "حفظ"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Knowledge List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredKnowledge && filteredKnowledge.length > 0 ? (
          <div className="grid gap-4">
            {filteredKnowledge.map((item) => (
              <Card
                key={item.id}
                className="p-6 bg-gray-800/50 border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                      {item.category}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteKnowledge.isPending}
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </Button>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{item.content}</p>
                <div className="mt-4 text-xs text-gray-500">
                  تم التحديث: {new Date(item.updatedAt).toLocaleString("ar-SA")}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery
                ? "لم يتم العثور على نتائج"
                : "لا توجد معرفة محفوظة. ابدأ بإضافة معرفة جديدة!"}
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
