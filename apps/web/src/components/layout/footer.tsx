import { FooterNavigation } from '@/components/navigation/footer-navigation';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-800 bg-stone-950 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-[1fr_auto]">
        <div><p className="font-semibold text-white">{siteConfig.name}</p><p className="mt-2 max-w-xl">Website giới thiệu sản phẩm. Quý khách vui lòng đến cửa hàng hoặc sử dụng liên kết marketplace để mua hàng.</p></div>
        <FooterNavigation />
      </div>
    </footer>
  );
}
