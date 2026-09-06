'use client';
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="vi">
      <body>
        <p>Không thể tải trang.</p>
        <button onClick={reset}>Thử lại</button>
      </body>
    </html>
  );
}
