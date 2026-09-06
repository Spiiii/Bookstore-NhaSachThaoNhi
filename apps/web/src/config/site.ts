export const siteConfig = {
  name: 'Nhà Sách Thảo Nhi Long Giao',
  description: 'Website chính thức của Nhà Sách Thảo Nhi Long Giao - giới thiệu sách, sản phẩm và thông tin cửa hàng.',
  locale: 'vi_VN',
  language: 'vi',
  navigation: [
    { href: '/', label: 'Trang chủ' },
    { href: '/products', label: 'Sản phẩm' },
    { href: '/news', label: 'Tin tức' },
    { href: '/contact', label: 'Liên hệ' },
  ],
  contact: {
    locationName: 'Nhà Sách Thảo Nhi, Long Giao',
    mapUrl: 'https://maps.app.goo.gl/kynsmaGsFGKUaHKS7',
    phones: [
      { name: 'Cô Nhi', display: '123456', href: 'tel:123456' },
      { name: 'Chú Tuân', display: '234567', href: 'tel:234567' },
    ],
    email: 'nhasachthaonhi@gmail.com',
  },
} as const;
