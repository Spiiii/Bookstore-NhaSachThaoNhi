import { AdminNewsForm } from '@/features/news/client';

export const metadata = { title: 'Thêm bài viết' };

export default function NewNewsPage() {
  return <section className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Nội dung</p><h1 className="mt-1 text-3xl font-black">Thêm bài viết</h1><p className="mt-2 text-stone-600">Nội dung được lưu dưới dạng Markdown và tạo ở trạng thái bản nháp.</p></div><AdminNewsForm /></section>;
}
