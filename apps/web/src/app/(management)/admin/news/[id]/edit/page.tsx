import { AdminNewsForm } from '@/features/news/client';

export const metadata = { title: 'Chỉnh sửa bài viết' };

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  return <section className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Nội dung</p><h1 className="mt-1 text-3xl font-black">Chỉnh sửa bài viết</h1></div><AdminNewsForm newsId={(await params).id} /></section>;
}
