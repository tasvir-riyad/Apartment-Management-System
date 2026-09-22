'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, Lock, User, Home, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function LoginPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError('সার্ভারে সংযোগ করা যাচ্ছে না');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-14">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1E3A8A] p-6 text-center text-white relative">
            <Link
              href="/"
              className="absolute left-4 top-4 text-xs bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>মূল সাইট</span>
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 border border-white/20">
              <ShieldCheck className="w-7 h-7 text-amber-300" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black">অ্যাডমিন লগইন পোর্টাল</h2>
            <p className="text-xs text-blue-200 mt-0.5 font-mono">Sayedi Tower • Admin Only</p>
            <p className="text-xs text-blue-100/80 mt-1">শুধুমাত্র ভবনের অ্যাডমিন ও ব্যবস্থাপকের জন্য</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} autoComplete="off" className="p-6 sm:p-8 space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                অ্যাডমিন ইউজারনেম (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="অ্যাডমিন ইউজারনেম লিখুন"
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">পাসওয়ার্ড (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[44px] bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>যাচাই হচ্ছে...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>লগইন করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                <span>← মূল ওয়েবসাইটে ফিরে যান</span>
              </Link>
            </div>
          </form>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2 flex-wrap">
            <span>সহায়তার জন্য যোগাযোগ:</span>
            <a
              href="tel:01632443446"
              className="inline-flex items-center gap-1 font-bold text-blue-900 hover:underline font-mono"
            >
              <Phone className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>01632-443446</span>
            </a>
            <span className="text-slate-400">•</span>
            <a
              href="https://wa.me/8801815826053"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-bold"
              title="WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
