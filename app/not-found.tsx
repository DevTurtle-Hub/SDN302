import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-[2px] shadow-xl shadow-indigo-500/20">
        <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-white text-indigo-600 shadow-inner">
          <span className="text-2xl font-black">404</span>
        </div>
      </div>

      <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 shadow-xs">
        Page Not Found
      </span>

      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
        Trang không{' '}
        <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
          tồn tại
        </span>
      </h1>

      <p className="mt-3 max-w-md text-sm sm:text-base text-slate-600 leading-relaxed">
        Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được chuyển sang địa chỉ khác.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại Trang Chủ
        </Link>
      </div>
    </div>
  );
}
