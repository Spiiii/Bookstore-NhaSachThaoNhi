import { FooterNavigation } from '@/components/navigation/footer-navigation';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-800 bg-stone-950 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:px-6 lg:grid-cols-[1.2fr_1fr_auto]">
        <div><p className="font-semibold text-white">{siteConfig.name}</p><p className="mt-2 max-w-xl">Sách và sản phẩm chọn lọc dành cho gia đình tại Long Giao. Quý khách có thể đến cửa hàng hoặc liên hệ trực tiếp để được hỗ trợ.</p></div>
        <address className="not-italic"><p className="font-semibold text-white">Liên hệ</p><a href={siteConfig.contact.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-stone-300 hover:text-white">{siteConfig.contact.locationName}</a>{siteConfig.contact.phones.map((phone) => <a key={phone.name} href={phone.href} className="mt-1 block text-stone-300 hover:text-white">{phone.name}: {phone.display}</a>)}<a href={`mailto:${siteConfig.contact.email}`} className="mt-1 block text-stone-300 hover:text-white">{siteConfig.contact.email}</a></address>
        <FooterNavigation />
      </div>
    </footer>
  );
}
