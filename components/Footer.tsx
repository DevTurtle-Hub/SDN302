export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6">
        <p>&copy; {new Date().getFullYear()} Task &amp; Team Management. All rights reserved.</p>
        <p className="mt-1 text-xs text-gray-400">
          Assignment 1 &bull; Technical Foundation with Next.js, Prisma &amp; PostgreSQL
        </p>
      </div>
    </footer>
  );
}
