import { AdminBannerForm } from '@/features/banners/client';

export const metadata = { title: 'Thêm banner' };

export default function NewBannerPage() {
  return <section className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Nội dung</p><h1 className="mt-1 text-3xl font-black">Thêm banner</h1><p className="mt-2 text-stone-600">Banner mới mặc định ở trạng thái tắt.</p></div><AdminBannerForm /></section>;
}
