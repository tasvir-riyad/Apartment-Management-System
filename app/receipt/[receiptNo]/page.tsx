'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReceiptModal from '@/components/ReceiptModal';
import Link from 'next/link';

export default function ReceiptViewPage() {
  const params = useParams();
  const router = useRouter();
  const receiptNo = params.receiptNo as string;

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetch(`/api/receipts/${receiptNo}`);
        const data = await res.json();
        if (data.success) {
          setReceipt(data.receipt);
        } else {
          setError(data.error || 'Receipt not found');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (receiptNo) {
      loadReceipt();
    }
  }, [receiptNo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-700">
        রসিদ লোড হচ্ছে...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow border border-slate-200 text-center max-w-sm">
          <p className="text-red-600 font-bold mb-4">{error || 'রসিদ পাওয়া যায়নি'}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <ReceiptModal receipt={receipt} onClose={() => router.back()} />
    </div>
  );
}
