export function formatVnd(value: string | null): string {
  if (value === null) return 'Liên hệ để biết giá';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(BigInt(value));
}
