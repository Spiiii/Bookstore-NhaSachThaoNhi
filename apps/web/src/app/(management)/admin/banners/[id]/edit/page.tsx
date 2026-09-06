import { AdminBannerForm } from '@/features/banners/client';

export const metadata = { title: 'Chỉnh sửa banner' };

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  return <section className="space-y-6"><div><p className="text-sm font-bold uppercase tracking-widest text-orange-700">Nội dung</p><h1 className="mt-1 text-3xl font-black">Chỉnh sửa banner</h1></div><AdminBannerForm bannerId={(await params).id} /></section>;
}
