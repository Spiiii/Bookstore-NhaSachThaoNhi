'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section>
      <p>Không thể tải nội dung.</p>
      <button onClick={reset}>Thử lại</button>
    </section>
  );
}
