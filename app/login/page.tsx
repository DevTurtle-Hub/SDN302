import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-6 shadow-sm">
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-3">
        Assignment 2/3 Preview
      </span>

      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
        Login
      </h1>

      <p className="mt-4 text-2xl font-semibold text-indigo-600">
        Coming Soon
      </p>

      <p className="mt-4 max-w-md text-base text-gray-600">
        Authentication will be available in a future assignment. Secure sign-in, sign-up, and member role access control will be supported.
      </p>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Back to Tasks
        </Link>
      </div>
    </div>
  );
}
