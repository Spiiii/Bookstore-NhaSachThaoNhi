export const siteConfig = {
  name: 'Nhà sách',
  description: 'Website giới thiệu sản phẩm của nhà sách.',
  locale: 'vi_VN',
  language: 'vi',
  navigation: [
    { href: '/', label: 'Trang chủ' },
    { href: '/products', label: 'Sản phẩm' },
    { href: '/news', label: 'Tin tức' },
  ],
} as const;
