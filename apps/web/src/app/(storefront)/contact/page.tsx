import { pageMetadata } from '@/config/seo.server';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function generateMetadata() {
  return pageMetadata({
    title: 'Liên hệ',
    description: `Thông tin liên hệ và chỉ đường đến ${siteConfig.name}.`,
    path: '/contact',
  });
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-700">Kết nối với chúng tôi</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Liên hệ {siteConfig.name}</h1><p className="mt-5 text-lg text-stone-600">Hãy ghé cửa hàng hoặc liên hệ trực tiếp để được tư vấn sách và sản phẩm phù hợp.</p></div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] bg-gradient-to-br from-orange-100 via-amber-50 to-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-bold uppercase tracking-widest text-orange-700">Địa chỉ cửa hàng</p><h2 className="mt-3 text-2xl font-black">{siteConfig.contact.locationName}</h2><p className="mt-3 text-stone-600">Mở vị trí chính xác và nhận chỉ đường trên Google Maps.</p><a href={siteConfig.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-full bg-stone-900 px-6 py-3 font-bold text-white no-underline transition hover:bg-orange-700">Xem đường đi trên Google Maps ↗</a>
        </section>
        <section className="rounded-[2rem] bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-bold uppercase tracking-widest text-stone-500">Thông tin liên hệ</p><div className="mt-5 space-y-5">{siteConfig.contact.phones.map((phone) => <div key={phone.name} className="border-b border-stone-100 pb-5"><p className="text-sm text-stone-500">Số điện thoại {phone.name}</p><a href={phone.href} className="mt-1 block text-2xl font-black text-stone-900 no-underline hover:text-orange-700">{phone.display}</a></div>)}<div><p className="text-sm text-stone-500">Email</p><a href={`mailto:${siteConfig.contact.email}`} className="mt-1 block break-all text-lg font-bold text-stone-900 no-underline hover:text-orange-700">{siteConfig.contact.email}</a></div></div>
        </section>
      </div>
    </div>
  );
}
