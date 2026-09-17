import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import Navbar from '@/components/Navbar';
import { getCurrentSession } from '@/lib/auth';
import {
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  ArrowRight,
  Shield,
  Car,
  Wind,
  Layers,
  KeyRound,
  Wifi,
  Droplets,
  Flame,
  Sparkles,
  Cctv,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { formatCurrency, toBanglaDigits } from '@/lib/numbers';

export const revalidate = 0; // Fresh database data

export default async function HomePage() {
  const session = await getCurrentSession();

  // Fetch all floors and their flats ordered by floor level and flat code
  const floors = await prisma.floor.findMany({
    where: {
      isRooftop: false,
    },
    include: {
      flats: {
        orderBy: { code: 'asc' },
      },
    },
    orderBy: {
      level: 'asc',
    },
  });

  // Fetch total counts
  const totalRentable = await prisma.flat.count({
    where: { type: { not: 'OWNER' } },
  });
  const occupiedCount = await prisma.flat.count({
    where: { status: 'OCCUPIED' },
  });
  const vacantCount = await prisma.flat.count({
    where: { status: 'VACANT', type: { not: 'OWNER' } },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-0 font-sans">
      {/* Top Navigation */}
      <Navbar user={session} />

      {/* Hero Section: Executive Deep Midnight Navy Brand Identity */}
      <section className="relative bg-gradient-to-b from-[#0B1528] via-[#11203D] to-[#0B1528] text-white py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 shadow-lg min-h-[calc(100vh-4.5rem)] flex items-center">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
          {/* Left Text Column - Enlarged & Polished */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-900/90 border border-blue-300/40 text-xs sm:text-sm font-bold text-amber-300 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>আধুনিক ও নিরাপদ আবাসিক ভবন • Modern Residential Living</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                সাঈদী টাওয়ার
              </h1>
              <p className="text-2xl sm:text-4xl font-extrabold text-blue-200 font-mono tracking-wide">
                Sayedi Tower
              </p>
            </div>

            {/* Address */}
            <p className="text-base sm:text-lg lg:text-xl text-blue-100/95 leading-relaxed max-w-2xl font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-300 shrink-0" />
              <span>চৌধুরী সড়ক, বোয়ালিয়ারকুল, লোহাগাড়া, চট্টগ্রাম</span>
            </p>

            {/* Quick Feature Cards - Larger & More Refined */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              <div className="bg-white/12 hover:bg-white/18 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white/20 text-center transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                <Wind className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 mx-auto mb-2" />
                <span className="text-sm sm:text-base font-black block text-white">আধুনিক লিফট</span>
                <span className="text-xs text-blue-200 font-medium">High-speed Lift</span>
              </div>

              <div className="bg-white/12 hover:bg-white/18 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white/20 text-center transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                <Car className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300 mx-auto mb-2" />
                <span className="text-sm sm:text-base font-black block text-white">ফ্রি পার্কিং</span>
                <span className="text-xs text-blue-200 font-medium">Dedicated Garage</span>
              </div>

              <div className="bg-white/12 hover:bg-white/18 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white/20 text-center transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 mx-auto mb-2" />
                <span className="text-sm sm:text-base font-black block text-white">নিরাপত্তা প্রহরী</span>
                <span className="text-xs text-blue-200 font-medium">24/7 Security</span>
              </div>

              <div className="bg-white/12 hover:bg-white/18 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-white/20 text-center transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300 mx-auto mb-2" />
                <span className="text-sm sm:text-base font-black block text-white">ছাদ ব্যবহারের সুবিধা</span>
                <span className="text-xs text-blue-200 font-medium">Rooftop Access</span>
              </div>
            </div>

            {/* Action Buttons - Larger & Prominent */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
              <a
                href="#flats"
                className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base sm:text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2.5"
              >
                <span>ভবনের সকল ফ্ল্যাটসমূহ দেখুন (View All Flats)</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href={session ? '/admin' : '/login'}
                className="px-7 py-4 rounded-2xl bg-white/15 hover:bg-white/25 border-2 border-white/30 text-white font-bold text-base sm:text-lg transition text-center inline-flex items-center justify-center gap-2.5"
              >
                <KeyRound className="w-5 h-5 text-amber-300" />
                <span>{session ? 'অ্যাডমিন ড্যাশবোর্ড (Admin Dashboard)' : 'অ্যাডমিন লগইন (Admin Login)'}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Beautiful & Larger Physical Signboard Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-7 sm:p-8 border-4 border-[#1E3A8A] transition-all">
              {/* TO LET Header Banner */}
              <div className="bg-[#1E3A8A] text-white py-3.5 px-6 rounded-2xl text-center shadow-md mb-6 border-b-2 border-amber-400">
                <h2 className="text-3xl sm:text-4xl font-black tracking-widest uppercase">TO LET</h2>
                <span className="text-xs font-bold text-amber-300 tracking-wider block mt-0.5 uppercase">
                  ভাড়া দেওয়া হবে • বুকিং চলছে
                </span>
              </div>

              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Sayedi Tower
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wide mt-1">
                    সাঈদী টাওয়ার • লোহাগাড়া, চট্টগ্রাম
                  </p>
                </div>

                {/* Contact Box with High Contrast */}
                <div className="bg-blue-50/80 rounded-2xl p-4 sm:p-5 border border-blue-200 space-y-3">
                  <span className="inline-block bg-[#1E3A8A] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
                    Contact / যোগাযোগের নম্বর:
                  </span>

                  <div className="space-y-2.5 flex flex-col items-center">
                    <a
                      href="tel:01632443446"
                      className="text-2xl sm:text-3xl font-black text-[#1E3A8A] inline-flex items-center justify-center gap-2.5 hover:text-blue-700 tracking-tight font-mono transition"
                    >
                      <Phone className="w-6 h-6 text-[#1E3A8A] shrink-0" />
                      <span>01632-443446</span>
                    </a>

                    <div className="inline-flex items-center justify-center gap-2 pt-1">
                      <a
                        href="tel:01815826053"
                        className="text-lg sm:text-xl font-bold text-slate-800 inline-flex items-center gap-2 hover:text-[#1E3A8A] font-mono transition"
                      >
                        <Phone className="w-5 h-5 text-slate-600 shrink-0" />
                        <span>01815-826053</span>
                      </a>
                      <a
                        href="https://wa.me/8801815826053?text=Hello%20Sayedi%20Tower%2C%20I%20am%20interested%20in%20flat%20rent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition"
                        title="WhatsApp"
                      >
                        <WhatsAppIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="pt-2 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Chowdhury Road, Boaliarkul, Lohagara, Chattogram</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    (চৌধুরী সড়ক, বোয়ালিয়ারকুল, লোহাগাড়া, চট্টগ্রাম)
                  </p>
                </div>

                {/* WhatsApp button - Large & Beautiful */}
                <div className="pt-2">
                  <a
                    href="https://wa.me/8801815826053?text=Hello%20Sayedi%20Tower%2C%20I%20am%20interested%20in%20flat%20rent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-2xl text-sm sm:text-base transition shadow-md hover:shadow-lg"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span>হোয়াটসঅ্যাপে যোগাযোগ করুন</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Building Facts Overview Strip */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-900 block">৭ তলা</span>
            <span className="text-xs text-slate-600">ছাদ ও নিচতলা পার্কিং</span>
          </div>
          <div className="p-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-900 block">২০ ইউনিট</span>
            <span className="text-xs text-slate-600">স্ট্যান্ডার্ড, ব্যাচেলর ও কমপ্যাক্ট</span>
          </div>
          <div className="p-2">
            <span className="text-2xl sm:text-3xl font-black text-[#1E3A8A] block">
              ১৯ টি ফ্ল্যাট
            </span>
            <span className="text-xs text-slate-600">আবাসিক পারিবারিক ফ্ল্যাট</span>
          </div>
          <div className="p-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 block">সচল লিফট</span>
            <span className="text-xs text-slate-600">সব তলায় লিফট সুবিধা সংযুক্ত</span>
          </div>
        </div>
      </section>

      {/* Building Flats Directory - Floor by Floor Sequence */}
      <section id="flats" className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="inline-block px-3.5 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
            Building Apartment Directory • ২০ টি ফ্ল্যাট
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            সাঈদী টাওয়ারের সকল ফ্ল্যাটসমূহ
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-2">
            নিচতলা থেকে ৭ম তলা পর্যন্ত ভবনের সকল ২০টি ফ্ল্যাটের ফ্লোরভিত্তিক ক্রম ও বিস্তারিত বিবরণ।
          </p>

          {/* Quick Floor Navigation Jump Links */}
          <div className="flex overflow-x-auto sm:flex-wrap items-center sm:justify-center gap-2.5 mt-6 pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {floors.map((floor) => (
              <a
                key={floor.id}
                href={`#floor-${floor.level}`}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-[#1E3A8A] text-sm font-bold text-slate-800 hover:text-[#1E3A8A] shadow-xs transition inline-flex items-center gap-2 shrink-0"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></span>
                <span>{floor.labelBn}</span>
                <span className="text-xs text-slate-500 font-mono">({toBanglaDigits(floor.flats.length)})</span>
              </a>
            ))}
          </div>
        </div>

        {/* Floors Sequential Layout - Each floor covers 1 window */}
        <div className="space-y-16 sm:space-y-24">
          {floors.map((floor) => {
            const flatCount = floor.flats.length;
            const gridClass =
              flatCount === 2
                ? 'grid grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto gap-8 w-full'
                : flatCount === 3
                ? 'grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full';

            return (
              <div
                key={floor.id}
                id={`floor-${floor.level}`}
                className="min-h-[calc(100vh-5.5rem)] flex flex-col justify-center py-8 sm:py-12 scroll-mt-20 border-b-2 border-slate-200/90 last:border-b-0"
              >
                {/* Floor Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b-2 border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1E3A8A] text-white font-black flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0">
                      {floor.level === 1 ? 'G' : `${floor.level}F`}
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
                        <span>{floor.labelBn}</span>
                        <span className="text-sm sm:text-base font-semibold text-slate-500 font-mono">
                          ({floor.labelEn})
                        </span>
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 font-medium mt-0.5">
                        মোট ইউনিট: {toBanglaDigits(floor.flats.length)} টি
                        {floor.hasParking && ' • নিচতলা সুপরিসর গ্যারেজ ও সংরক্ষিত পার্কিং'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 rounded-full bg-blue-50 text-blue-900 font-black text-sm border border-blue-200 shadow-xs">
                      {toBanglaDigits(floor.flats.length)} টি ফ্ল্যাট
                    </span>
                  </div>
                </div>

                {/* Flats Grid on this Floor - Universal Flat Details View */}
                <div className={gridClass}>
                  {floor.flats.map((flat) => {
                    const isOwner = flat.type === 'OWNER';

                    return (
                      <div
                        key={flat.id}
                        className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-[#1E3A8A] transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-xl"
                      >
                        <div>
                          {/* Top: Flat Code & Layout Type */}
                          <div className="flex items-center justify-between mb-5">
                            <span className="px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] text-white font-black text-lg sm:text-xl font-mono shadow-sm">
                              ফ্ল্যাট {flat.code}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs sm:text-sm font-bold border border-blue-200">
                              {flat.type === 'STANDARD'
                                ? '৩ বেড • স্ট্যান্ডার্ড'
                                : flat.type === 'COMPACT'
                                ? '২ বেড • কমপ্যাক্ট'
                                : flat.type === 'BACHELOR'
                                ? '১ বেড • ব্যাচেলর'
                                : flat.type === 'OWNER'
                                ? '৪ বেড • মালিকের ফ্ল্যাট'
                                : `${toBanglaDigits(flat.bedrooms)} বেডরুম`}
                            </span>
                          </div>

                          {/* Flat Details Table with Larger Fonts */}
                          <div className="space-y-3 text-sm sm:text-base text-slate-700">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">ফ্লোর / তলা:</span>
                              <span className="font-bold text-slate-900">{floor.labelBn}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">লেআউট টাইপ:</span>
                              <span className="font-bold text-slate-900 font-mono">{flat.type}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">রুম সংখ্যা:</span>
                              <span className="font-bold text-slate-900">
                                {flat.type === 'STANDARD'
                                  ? '৩ বেড, ৩ বাথ'
                                  : flat.type === 'COMPACT'
                                  ? '২ বেড, ২ বাথ'
                                  : flat.type === 'OWNER'
                                  ? '৪ বেড, ৪ বাথ'
                                  : `${toBanglaDigits(flat.bedrooms)} বেড, ${toBanglaDigits(flat.bathrooms)} বাথ`}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500 font-medium">লিফট সুবিধা:</span>
                              <span className="font-bold text-blue-900">বিদ্যমান (সচল)</span>
                            </div>
                          </div>

                          {/* Base Rent Box - Only for rentable flats (hidden for E2-E3 owner unit) */}
                          {!isOwner && (
                            <div className="mt-6 p-4 sm:p-5 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-bold text-slate-700">মাসিক নির্ধারিত ভাড়া:</span>
                              <span className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
                                {formatCurrency(flat.baseRent, true)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Action Section with Universal Contact Actions */}
                        <div className="mt-6 pt-1">
                          <div className="flex items-center gap-2.5">
                            <a
                              href="tel:01632443446"
                              className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-sm sm:text-base text-center transition flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Phone className="w-4 h-4" />
                              <span>কল করুন (01632)</span>
                            </a>
                            <a
                              href={`https://wa.me/8801815826053?text=Hello%20Sayedi%20Tower%2C%20I%20am%20interested%20in%20flat%20${flat.code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center shadow-sm"
                              title="WhatsApp"
                            >
                              <WhatsAppIcon className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Building Features & Amenities Spotlight */}
      <section id="features" className="bg-white py-14 sm:py-18 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Modern Amenities & Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5">
              ভবনের সুযোগ-সুবিধাসমূহ
            </h2>
            <p className="text-slate-600 text-sm mt-1.5">
              নিরাপদ, পরিচ্ছন্ন ও পারিবারিক পরিবেশ নিশ্চিত করার লক্ষ্যে প্রতিটি ফ্ল্যাটের সাথে সংযুক্ত প্রয়োজনীয় সুযোগ-সুবিধা।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Wind className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">সর্বাধুনিক লিফট সুবিধা</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                নিচতলা থেকে সর্বোচ্চ তলা পর্যন্ত সার্বক্ষণিক সচল প্যাসেঞ্জার লিফট, যা সব বয়সের বাসিন্দার স্বাচ্ছন্দ্য নিশ্চিত করে।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">ফ্রি পার্কিং ও গ্যারেজ</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ভবনের নিচতলায় বাসিন্দাদের মোটরসাইকেল ও যানবাহন নিরাপদে পার্কিংয়ের জন্য সংরক্ষিত নিচতলা গ্যারেজ স্পেস।
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">২৪/৭ নিরাপত্তা</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  সার্বক্ষণিক সিসিটিভি ক্যামেরা (CCTV Camera) পর্যবেক্ষণ ও নিরাপত্তা প্রহরীর তত্ত্বাবধানে ২৪ ঘণ্টা নিরাপদ ও সুরক্ষিত পরিবেশ।
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-lg w-fit">
                <Cctv className="w-3.5 h-3.5 text-blue-700" />
                <span>CCTV Camera Coverage</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">উন্মুক্ত ছাদ সুবিধা</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ভবনের কমন ছাদ, যেখানে কাপড় শুকানো, নির্মল বাতাস উপভোগ ও হাঁটার মনোরম উন্মুক্ত পরিবেশ রয়েছে।
              </p>
            </div>

            {/* Move-in Ready Unit Features Topic */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-slate-50 border-2 border-blue-200/80 md:col-span-2 lg:col-span-2 shadow-xs">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    রেডি ফ্ল্যাট সুযোগ-সুবিধা (Move-in Ready Units)
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-blue-900">
                    প্রতিটি ফ্ল্যাট বসবাস উপযোগী ও রয়েছে প্রয়োজনীয় সুবিধা (Every unit is move-in ready and features):
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                  <Wifi className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      ওয়াই-ফাই সংযোগ লাইন
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Wi-Fi Connectivity line
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                  <Wind className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      এয়ার কন্ডিশনার (এসি) লাইন
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Air Conditioning line
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      ওয়াশিং মেশিন সংযোগ লাইন
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Washing Machine line
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                  <Droplets className="w-4 h-4 text-cyan-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      খাবার পানির নির্ধারিত লাইন
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Dedicated Drinking Water line
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      গরম পানি ও গিজার লাইন
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Hot Water line
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-xs">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      আধুনিক ফিটিংস ও সুযোগ-সুবিধা
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Modern Fixtures & Facilities
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Google Maps Section - Enlarged to cover 1 full window */}
      <section
        id="location"
        className="bg-slate-100 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 min-h-[calc(100vh-4.5rem)] flex items-center"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Details & Contacts */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1E3A8A] bg-blue-100/70 px-4 py-1.5 rounded-full border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Location & Connectivity
            </span>

            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                ভবনের অবস্থান ও যোগাযোগ
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2 font-medium">
                লোহাগাড়া বাজার, শিক্ষা প্রতিষ্ঠান ও মহাসড়কের সাথে চমৎকার যাতায়াত ব্যবস্থা সম্বলিত শান্ত ও নিরাপদ এলাকা।
              </p>
            </div>

            {/* Address Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <strong className="block text-base sm:text-lg font-black text-slate-900">
                  চৌধুরী সড়ক, বোয়ালিয়ারকুল, লোহাগাড়া, চট্টগ্রাম
                </strong>
                <span className="block text-xs sm:text-sm text-slate-500 font-mono mt-0.5">
                  Chowdhury Road, Boaliarkul, Lohagara, Chattogram
                </span>
              </div>
            </div>

            {/* Contact Numbers Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 border border-blue-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href="tel:01815826053"
                    className="text-lg sm:text-xl font-black text-slate-900 font-mono hover:text-[#1E3A8A] transition"
                  >
                    01815826053
                  </a>
                  <a
                    href="https://wa.me/8801815826053"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full font-bold hover:bg-emerald-100 transition shadow-xs"
                    title="Chat on WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
                    <span>হোয়াটসঅ্যাপ (WhatsApp)</span>
                  </a>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0 border border-blue-100">
                  <Phone className="w-5 h-5" />
                </div>
                <a
                  href="tel:01632443446"
                  className="text-lg sm:text-xl font-black text-slate-900 font-mono hover:text-[#1E3A8A] transition"
                >
                  01632-443446
                </a>
              </div>
            </div>

            {/* Google Maps Button */}
            <div>
              <a
                href="https://maps.app.goo.gl/e58HCKi4UTQQ5Je78?g_st=iw"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-[#1E3A8A] hover:bg-blue-800 text-white text-sm sm:text-base font-bold shadow-md hover:shadow-xl transition transform hover:-translate-y-0.5"
              >
                <MapPin className="w-5 h-5 text-amber-300" />
                <span>গুগল ম্যাপে লোকেশন দেখুন (Open Google Maps)</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </a>
            </div>
          </div>

          {/* Right Column: Larger Interactive Map Embed */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[460px] sm:h-[520px] lg:h-[560px] relative bg-slate-200">
            <iframe
              title="Sayedi Tower Google Map Location"
              src="https://maps.google.com/maps?q=22.000694,92.096389&z=15&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-center sm:text-left">
            <p className="font-bold text-white text-sm">সাঈদী টাওয়ার (Sayedi Tower)</p>
            <p className="text-slate-500 mt-0.5">চৌধুরী সড়ক, বোয়ালিয়ারকুল, লোহাগাড়া, চট্টগ্রাম</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition">
              বাসিন্দা লগইন
            </Link>
            <Link href="/login" className="hover:text-white transition">
              অ্যাডমিন পোর্টাল
            </Link>
            <a
              href="https://maps.app.goo.gl/e58HCKi4UTQQ5Je78?g_st=iw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              গুগল ম্যাপ
            </a>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Quick-Action Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2 z-40 shadow-2xl flex items-center gap-2">
        <a
          href="tel:01632443446"
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E3A8A] active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>01632-443446</span>
        </a>
        <a
          href="https://wa.me/8801815826053?text=Hello%20Sayedi%20Tower%2C%20I%20am%20interested%20in%20flat%20rent"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" />
          <span>হোয়াটসঅ্যাপ</span>
        </a>
        <a
          href="#flats"
          className="p-2.5 rounded-xl bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition shrink-0"
          title="সকল ফ্ল্যাট দেখুন"
        >
          <Building className="w-4 h-4 text-blue-900" />
        </a>
      </div>
    </div>
  );
}
