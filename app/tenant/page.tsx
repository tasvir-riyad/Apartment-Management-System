'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ReceiptModal from '@/components/ReceiptModal';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  CreditCard,
  AlertCircle,
  FileText,
  Printer,
  Calendar,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Car,
  Wrench,
  Send,
  Building2,
  Layers,
  Wind,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function TenantPortalPage() {
  const { lang, formatMoney, formatNumber } = useLanguage();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flatData, setFlatData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Maintenance form
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');

  // Payment Claim form
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimMonth, setClaimMonth] = useState('2026-09');
  const [claimMethod, setClaimMethod] = useState('BKASH');
  const [claimRef, setClaimRef] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  const fetchTenantData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meJson = await meRes.json();
      if (!meJson.authenticated) {
        router.push('/login');
        return;
      }
      setCurrentUser(meJson.user);

      if (!meJson.user.flatId) {
        setLoading(false);
        return;
      }

      // Fetch flat balance & details
      const flatRes = await fetch(`/api/dues`);
      const flatJson = await flatRes.json();
      if (flatJson.success) {
        const mySummary = flatJson.flats.find((f: any) => f.flatId === meJson.user.flatId);
        setFlatData(mySummary);
      }

      // Fetch payments for this tenant
      const payRes = await fetch('/api/payments');
      const payJson = await payRes.json();
      if (payJson.success) setPayments(payJson.payments);

      // Fetch notices
      const notRes = await fetch('/api/notices');
      const notJson = await notRes.json();
      if (notJson.success) setNotices(notJson.notices);

      // Fetch maintenance
      const maintRes = await fetch('/api/maintenance');
      const maintJson = await maintRes.json();
      if (maintJson.success) setMaintenance(maintJson.requests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, []);

  const handleViewReceipt = async (receiptNo: string) => {
    try {
      const res = await fetch(`/api/receipts/${receiptNo}`);
      const data = await res.json();
      if (data.success) {
        setSelectedReceipt(data.receipt);
      }
    } catch (e) {
      alert('রসিদ খুঁজে পাওয়া যায়নি');
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: maintTitle,
          description: maintDesc,
        }),
      });
      if (res.ok) {
        setMaintTitle('');
        setMaintDesc('');
        setMaintSuccess('অনুরোধটি সফলভাবে পাঠানো হয়েছে। মালিক শীঘ্রই ব্যবস্থা গ্রহণ করবেন।');
        fetchTenantData();
        setTimeout(() => setMaintSuccess(''), 5000);
      }
    } catch (e) {
      alert('ত্রুটি হয়েছে');
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flatId: currentUser.flatId,
          month: claimMonth,
          amount: Number(claimAmount),
          method: claimMethod,
          referenceNo: claimRef,
          notes: 'Tenant claim submission',
        }),
      });
      if (res.ok) {
        setClaimModalOpen(false);
        setClaimSuccess('পেমেন্টের তথ্য জমা হয়েছে এবং অনুমোদিত হয়েছে!');
        fetchTenantData();
        setTimeout(() => setClaimSuccess(''), 5000);
      }
    } catch (e) {
      alert('ত্রুটি হয়েছে');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-600">
        ভাড়াটিয়া পোর্টাল লোড হচ্ছে...
      </div>
    );
  }

  const flatCode = currentUser?.flat?.code || currentUser?.username || '—';
  const floorLabel = currentUser?.flat?.floor?.labelBn || '—';
  const baseRent = flatData?.baseRent ?? (currentUser?.flat?.baseRent || 0);
  const liftFee = flatData?.liftFee ?? (currentUser?.flat?.liftFee || 0);
  const totalDue = flatData?.totalDue ?? 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar user={currentUser} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-6 sm:py-8 px-4 sm:px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-amber-300 font-black text-xl sm:text-2xl shrink-0">
              {flatCode}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-700/60 text-blue-200 text-xs font-bold border border-blue-400/30">
                  ভাড়াটিয়া পোর্টাল
                </span>
                <span className="text-xs text-blue-300">
                  তলা: {floorLabel}
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black mt-1">
                ফ্ল্যাট {flatCode} — বাসিন্দা একাউন্ট
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                সাঈদী টাওয়ার • চৌধুরী সড়ক, লোহাগাড়া, চট্টগ্রাম
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setClaimAmount(String(baseRent + liftFee));
                setClaimModalOpen(true);
              }}
              className="w-full md:w-auto px-5 py-3 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition cursor-pointer text-center"
            >
              ভাড়া পরিশোধ / পেমেন্ট দাবি জমা দিন
            </button>
          </div>
        </div>
      </div>

      {claimSuccess && (
        <div className="bg-emerald-700 text-white py-2.5 px-4 text-center font-bold text-xs shadow">
          {claimSuccess}
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-8 py-6 sm:py-8 w-full space-y-6 sm:space-y-8 flex-1">
        {/* DUE CARD & RENT SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Total Due Card */}
          <div className={`p-5 sm:p-6 rounded-3xl shadow-sm border-2 ${
            totalDue > 0 ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-600 mb-1">
              বর্তমান মোট বকেয়া (Current Total Due)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 mt-1">
              {totalDue > 0 ? (
                <span className="text-red-700">{formatMoney(totalDue)}</span>
              ) : (
                <span className="text-emerald-700">পরিশোধিত (৳০)</span>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Calendar className="w-4 h-4 text-blue-900 shrink-0" />
              <span>প্রতি মাসের ৯ তারিখের মধ্যে ভাড়া পরিশোধের অনুরোধ</span>
            </div>
          </div>

          {/* Monthly Rent Breakdown */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-500">
              মাসিক নির্ধারিত বিল (Monthly Charges)
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">মূল ফ্ল্যাট ভাড়া:</span>
                <span className="font-bold text-slate-900 text-sm">{formatMoney(baseRent)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-700" />
                  <span>লিফট চার্জ (Lift Fee):</span>
                </span>
                <span className={`font-bold text-sm ${liftFee > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {formatMoney(liftFee)}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-slate-900">
                <span>সর্বমোট মাসিক পাওনা:</span>
                <span className="text-blue-950 font-black text-base">
                  {formatMoney(baseRent + liftFee)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Quick Box */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-200 block">যোগাযোগ ও সহায়তা</span>
              <h4 className="text-lg font-black mt-1">সাঈদী টাওয়ার প্রশাসন</h4>
              <p className="text-xs text-blue-200 mt-2 leading-relaxed">
                ভাড়া বা ভবনের যেকোনো বিষয়ে সরাসরি যোগাযোগ করুন:
              </p>
            </div>

            <div className="space-y-2 pt-4">
              <a
                href="tel:01815826053"
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Phone className="w-3.5 h-3.5 text-amber-300" />
                <span>01815826053</span>
              </a>
              <a
                href="https://wa.me/8801815826053"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>হোয়াটসঅ্যাপ মেসেজ</span>
              </a>
            </div>
          </div>
        </div>

        {/* PAYMENT HISTORY & OFFICIAL RECEIPTS */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                ভাড়া পরিশোধের ইতিহাস ও মানি রিসিট
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                যেকোনো রসিদের 'মানি রিসিট দেখুন' বাটনে ক্লিক করে প্রিন্ট বা সংরক্ষণ করতে পারেন
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              এখনও কোনো পেমেন্ট রেকর্ড নেই।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">রসিদ নম্বর</th>
                    <th className="py-3 px-4">ভাড়ার মাস</th>
                    <th className="py-3 px-4">পরিশোধিত টাকা</th>
                    <th className="py-3 px-4">মাধ্যম</th>
                    <th className="py-3 px-4">ট্রানজেকশন আইডি</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4 text-center">মানি রিসিট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-900">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {p.month}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {p.method}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {p.referenceNo || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(p.paidOn).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewReceipt(p.receiptNo)}
                          className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>প্রিন্ট রসিট</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NOTICES & MAINTENANCE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Building Notices */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
              <span>ভবনের জরুরি নোটিশ বোর্ড</span>
            </h3>

            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-slate-900">{n.titleBn}</h4>
                    {n.isPinned && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                        জরুরি
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed mt-1">{n.body}</p>
                  <span className="block text-[10px] text-slate-400 mt-2">
                    প্রকাশ: {new Date(n.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Request Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>রক্ষণাবেক্ষণ সেবা অনুরোধ (পানি, বিদ্যুৎ, লিফট ইত্যাদি)</span>
              </h3>

              {maintSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold mb-3">
                  {maintSuccess}
                </div>
              )}

              <form onSubmit={handleCreateMaintenance} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বিষয় / শিরোনাম</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বাথরুমের কল সমস্যা বা লিফট বাটন চেক"
                    value={maintTitle}
                    onChange={(e) => setMaintTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="সমস্যাটির বিস্তারিত বিবরণ লিখুন..."
                    value={maintDesc}
                    onChange={(e) => setMaintDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>অনুরোধ জমা দিন</span>
                </button>
              </form>
            </div>

            {/* Existing Requests */}
            {maintenance.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">আমার পূর্বের অনুরোধসমূহ:</span>
                {maintenance.slice(0, 2).map((m) => (
                  <div key={m.id} className="text-xs p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{m.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* CLAIM PAYMENT MODAL */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 my-auto max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 mb-4 sm:mb-5">
              <h3 className="font-black text-base sm:text-lg text-slate-900">ভাড়া পরিশোধ তথ্য জমা</h3>
              <button
                onClick={() => setClaimModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50 text-blue-950 rounded-xl leading-relaxed">
                বিকাশ/নগদে টাকা পাঠানোর পর ট্রানজেকশন নম্বর (TrxID) দিয়ে ফর্মটি পূরণ করুন।
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ভাড়ার মাস</label>
                <input
                  type="month"
                  required
                  value={claimMonth}
                  onChange={(e) => setClaimMonth(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl font-bold text-base sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  required
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl font-black text-base sm:text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={claimMethod}
                  onChange={(e) => setClaimMethod(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl font-medium text-base sm:text-xs"
                >
                  <option value="BKASH">bKash (বিকাশ)</option>
                  <option value="NAGAD">Nagad (নগদ)</option>
                  <option value="ROCKET">Rocket (রকেট)</option>
                  <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার</option>
                  <option value="CASH">ক্যাশ (নগদ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ট্রানজেকশন নম্বর (TrxID)</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 9J38KS10"
                  value={claimRef}
                  onChange={(e) => setClaimRef(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl font-mono text-base sm:text-sm"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  className="flex-1 py-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[44px] bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow transition cursor-pointer"
                >
                  পেমেন্ট সাবমিট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
