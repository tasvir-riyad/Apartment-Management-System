'use client';

import React, { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Printer, Download, X, CheckCircle2, Building2, Phone } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { formatDateDhaka } from '@/lib/numbers';

interface ReceiptModalProps {
  receipt: any | null;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const { lang, formatMoney } = useLanguage();
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!receiptCardRef.current || downloadingPdf) return;
    setDownloadingPdf(true);

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');
      const element = receiptCardRef.current;

      // html-to-image captures native browser rendering, immune to CSS lab() / oklch() color issues
      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210 mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

      const margin = 8; // 8mm margin
      const maxWidth = pdfWidth - margin * 2;   // 194 mm
      const maxHeight = pdfHeight - margin * 2; // 281 mm

      // Load image to determine native aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      // Strictly fit on EXACTLY 1 SINGLE PAGE
      let imgWidth = maxWidth;
      let imgHeight = (img.height * imgWidth) / img.width;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (img.width * imgHeight) / img.height;
      }

      // Center horizontally and vertically on the single page
      const x = (pdfWidth - imgWidth) / 2;
      const y = Math.max(margin, (pdfHeight - imgHeight) / 2);

      pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`Sayedi-Tower-Receipt-${receipt.receiptNo}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Date formatting
  const displayDate = receipt.formattedDate || formatDateDhaka(receipt.paidOn, lang);
  const displayMonth = receipt.billingPeriod || receipt.month;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Print isolation style to guarantee 1 page when printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
          }
          body > * {
            visibility: hidden !important;
          }
          #receipt-print-modal, #receipt-print-modal * {
            visibility: visible !important;
          }
          #receipt-print-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="receipt-print-modal"
        className="relative bg-white text-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-8 border border-slate-200 max-h-[96vh] overflow-y-auto my-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Action Header (No Print) */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 no-print gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="truncate">সাঈদী টাওয়ার — অফিসিয়াল মানি রিসিট</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm min-h-[40px]"
              title="প্রিন্ট করুন (Print Receipt)"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট (Print)</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm min-h-[40px]"
              title="রসিদ পিডিএফ ডাউনলোড করুন (Download PDF Receipt)"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingPdf ? 'পিডিএফ তৈরি হচ্ছে...' : 'পিডিএফ ডাউনলোড (PDF)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Card */}
        <div
          ref={receiptCardRef}
          className="receipt-card mt-3 sm:mt-4 p-5 sm:p-7 border-2 border-slate-900 rounded-2xl bg-white shadow-sm relative overflow-hidden"
        >
          {/* Subtle Security Watermark in Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
            <span className="text-6xl sm:text-7xl font-black text-slate-900 uppercase tracking-widest">
              SAYEDI TOWER
            </span>
          </div>

          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {receipt.building?.nameBn || 'সাঈদী টাওয়ার'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-bold tracking-wide">
              {receipt.building?.nameEn || 'Sayedi Tower'} • {receipt.building?.addressBn}
            </p>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-3 flex-wrap font-medium">
              <span>যোগাযোগ:</span>
              {receipt.building?.phoneOwner && (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900">
                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                  <span>{receipt.building.phoneOwner}</span>
                </span>
              )}
              {receipt.building?.phoneSecondary && (
                <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900">
                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                  <span>{receipt.building.phoneSecondary}</span>
                </span>
              )}
            </div>
            <div className="inline-block mt-3 px-4 py-1 bg-slate-900 text-white text-xs font-black rounded-full tracking-widest uppercase shadow-xs">
              ভাড়া আদায় মানি রিসিট (RENT MONEY RECEIPT)
            </div>
          </div>

          {/* Receipt Info Grid with Date, Month, Year & Tenant */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs mt-4 py-3 border-b border-dashed border-slate-300 relative z-10">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">রসিদ নম্বর (Receipt No):</span>
              <span className="font-mono font-black text-blue-950 text-sm">{receipt.receiptNo}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">ইস্যুর তারিখ (Issue Date):</span>
              <span className="font-bold text-slate-900">{displayDate}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">ভাড়ার মাস ও বছর (Month & Year):</span>
              <span className="font-black text-blue-950 bg-blue-100/70 px-2 py-0.5 rounded inline-block">
                {displayMonth}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">ফ্ল্যাট নম্বর ও তলা:</span>
              <span className="font-black text-slate-900 text-sm">
                ফ্ল্যাট {receipt.flatCode} ({receipt.floorBn || receipt.floorEn})
              </span>
            </div>
            <div className="col-span-2 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
              <span className="text-blue-900 block text-[11px] font-semibold">ভাড়াটিয়ার নাম (Tenant Name):</span>
              <span className="font-black text-slate-950 text-sm">{receipt.tenantNameBn}</span>
              {receipt.tenantPhone && (
                <span className="text-xs text-slate-600 font-mono ml-2">({receipt.tenantPhone})</span>
              )}
            </div>
          </div>

          {/* Itemized Bill Breakdown Table */}
          <div className="mt-4 overflow-x-auto relative z-10">
            <table className="w-full text-xs text-left border-collapse min-w-[280px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-3 rounded-l-lg">নং</th>
                  <th className="py-2.5 px-3">চার্জের বিবরণ (Item Description)</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">০১</td>
                  <td className="py-2.5 px-3 font-semibold">মাসিক মূল ফ্ল্যাট ভাড়া (Monthly Base Rent)</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatMoney(receipt.baseRentPortion || 0)}
                  </td>
                </tr>

                {receipt.liftPortion > 0 && (
                  <tr className="bg-amber-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-800">০২</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-950">
                      মাসিক লিফট সার্ভিস চার্জ (Monthly Lift Fee)
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-900">
                      {formatMoney(receipt.liftPortion)}
                    </td>
                  </tr>
                )}

                {receipt.extraCharge > 0 && (
                  <tr className="bg-blue-50/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-800">০৩</td>
                    <td className="py-2.5 px-3 font-semibold text-blue-950">
                      {receipt.extraChargeLabel || 'অতিরিক্ত / হিডেন সার্ভিস চার্জ'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-950">
                      {formatMoney(receipt.extraCharge)}
                    </td>
                  </tr>
                )}

                {receipt.previousDue > 0 && (
                  <tr className="bg-red-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-red-700">০৪</td>
                    <td className="py-2.5 px-3 font-semibold text-red-900">
                      পূর্বের বকেয়া (Previous Due — ম্যানুয়াল হিসাব)
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-red-700">
                      {formatMoney(receipt.previousDue)}
                    </td>
                  </tr>
                )}

                {/* Subtotals & Payments */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-3 text-right">
                    সর্বমোট প্রদেয় বিল (Total Payable):
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-blue-950">
                    {formatMoney(receipt.totalPayable || receipt.amount)}
                  </td>
                </tr>

                {receipt.balanceDue > 0 && (
                  <tr className="bg-red-50 font-bold text-red-900">
                    <td colSpan={2} className="py-2.5 px-3 text-right">
                      বর্তমান অবশিষ্ট বকেয়া (Remaining Due):
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-red-700">
                      {formatMoney(receipt.balanceDue)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* In Words & Payment info */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs relative z-10">
            <div className="mb-1.5 flex items-start gap-1">
              <span className="text-slate-500 shrink-0 font-medium">কথায় (In Words):</span>
              <span className="font-black text-slate-900">{receipt.amountInWordsBn}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-1 border-t border-slate-200">
              <span>
                পেমেন্ট মাধ্যম: <strong className="text-slate-900 uppercase font-bold">{receipt.method}</strong>
              </span>
              {receipt.referenceNo && (
                <span>
                  রেফারেন্স / TrxID: <strong className="text-slate-900 font-mono">{receipt.referenceNo}</strong>
                </span>
              )}
              {receipt.notes && (
                <span>
                  নোট: <span className="text-slate-700">{receipt.notes}</span>
                </span>
              )}
            </div>
          </div>

          {/* Dual Signatures */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 flex justify-between items-end text-xs relative z-10">
            <div className="text-center">
              <div className="w-36 sm:w-44 border-b border-slate-400 mb-1.5"></div>
              <span className="text-slate-600 font-bold">ভাড়াটিয়ার স্বাক্ষর</span>
              <span className="block text-[10px] text-slate-400">তারিখসহ</span>
            </div>

            <div className="text-center">
              <div className="w-36 sm:w-44 border-b border-slate-400 mb-1.5"></div>
              <span className="font-black text-slate-900">মালিক / ম্যানেজার স্বাক্ষর</span>
              <span className="block text-[10px] text-slate-500 font-medium">সাঈদী টাওয়ার, লোহাগাড়া</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
