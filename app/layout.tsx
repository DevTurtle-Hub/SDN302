import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'TaskFlow - Modern Task & Team Management',
  description: 'Manage tasks efficiently, track progress, and collaborate with your team with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
        {/* Ambient Gradient Background Glow */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-indigo-200/40 via-sky-200/40 to-cyan-100/50 blur-[130px] rounded-full" />
          <div className="absolute top-1/2 -left-48 w-96 h-96 bg-indigo-100/50 blur-[120px] rounded-full" />
          <div className="absolute top-2/3 -right-48 w-96 h-96 bg-cyan-100/60 blur-[120px] rounded-full" />
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e120_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e120_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
