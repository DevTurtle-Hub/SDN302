export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-8">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></div>
          <span className="text-sm font-bold tracking-wide text-slate-700">
            Task<span className="text-indigo-600">Flow</span> Platform
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Task &amp; Team Management. Powered by Next.js App Router, Prisma &amp; Supabase.
        </p>
      </div>
    </footer>
  );
}
