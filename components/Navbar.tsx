'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Globe, LogOut, ShieldCheck, Home, MapPin, Grid } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user?: {
    username: string;
    role: string;
    flatCode?: string | null;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { lang, toggleLang, t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1528] text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition shrink-0">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white truncate">
                  {t.appName}
                </h1>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-blue-950/60 text-blue-200 border border-blue-400/30 hidden sm:inline-block font-mono">
                  Sayedi Tower
                </span>
              </div>
              <p className="text-[11px] text-blue-200 hidden md:block truncate mt-0.5">
                {t.address}
              </p>
            </div>
          </Link>

          {/* Center Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-blue-100">
            <a
              href="#flats"
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              ফ্ল্যাটসমূহ (Flats)
            </a>
            <a
              href="#features"
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              সুযোগ-সুবিধা (Amenities)
            </a>
            <a
              href="#location"
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
            >
              যোগাযোগ (Contact)
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs sm:text-sm font-semibold transition cursor-pointer text-white"
              title="ভাষা পরিবর্তন / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* User Session status */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-bold text-white transition"
                  title="Go to Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>অ্যাডমিন</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-xs font-semibold text-white transition cursor-pointer"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline sm:ml-1">{t.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow transition inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>অ্যাডমিন লগইন</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
