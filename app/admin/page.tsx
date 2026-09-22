'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ReceiptModal from '@/components/ReceiptModal';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Edit,
  Printer,
  Sliders,
  DollarSign,
  Phone,
  ShieldCheck,
  Lock,
  FileText,
  CheckSquare,
  Square,
  Home,
  LogOut,
  CreditCard,
  UserCheck,
  UserX,
  FileBadge,
  Sparkles,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const SERIAL_FLAT_ORDER = [
  'A1', 'A2',
  'B1', 'B2', 'B3',
  'C1', 'C2', 'C3', 'C4',
  'D1', 'D2', 'D3',
  'E1', 'E2-E3',
  'F1', 'F2', 'F3',
  'G1', 'G2', 'G3'
];

export default function AdminDashboardPage() {
  const { lang, t, formatMoney, formatNumber } = useLanguage();
  const router = useRouter();

  // Authentication & session
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab (Clean 3-section layout as requested by User)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'building' | 'tenants'>('dashboard');

  // Data states
  const [floors, setFloors] = useState<any[]>([]);
  const [duesData, setDuesData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // 1. Rent Edit Modal State
  const [rentEditModalOpen, setRentEditModalOpen] = useState(false);
  const [targetRentFlat, setTargetRentFlat] = useState<any>(null);
  const [newBaseRent, setNewBaseRent] = useState<number>(0);

  // 2. Single Lift Fee Edit Modal
  const [liftEditModalOpen, setLiftEditModalOpen] = useState(false);
  const [targetLiftFlat, setTargetLiftFlat] = useState<any>(null);
  const [singleLiftFee, setSingleLiftFee] = useState<number>(0);

  // 3. Bulk Lift Fee (Dashboard Quick Control)
  const [bulkLiftMode, setBulkLiftMode] = useState<'ALL' | 'SELECTED'>('ALL');
  const [bulkLiftAction, setBulkLiftAction] = useState<'SET' | 'ADD'>('SET');
  const [bulkLiftFee, setBulkLiftFee] = useState<number>(500);
  const [selectedLiftFlatIds, setSelectedLiftFlatIds] = useState<string[]>([]);

  // 4. Extra / Hidden Charge (Dashboard Quick Control)
  const [extraChargeMode, setExtraChargeMode] = useState<'ALL' | 'SELECTED'>('ALL');
  const [extraChargeLabel, setExtraChargeLabel] = useState<string>('অতিরিক্ত সার্ভিস ও বিবিধ চার্জ');
  const [extraChargeAmount, setExtraChargeAmount] = useState<number>(500);
  const [selectedExtraFlatIds, setSelectedExtraFlatIds] = useState<string[]>([]);

  // 5. Bill Report & Receipt Generator Modal
  const [billReportModalOpen, setBillReportModalOpen] = useState(false);
  const [billForm, setBillForm] = useState({
    flatId: '',
    tenantName: '',
    tenantPhone: '',
    day: 17,
    monthName: 'সেপ্টেম্বর',
    year: 2026,
    billingMonth: '2026-09',
    baseRent: 0,
    liftFee: 0,
    extraCharge: 0,
    extraChargeLabel: 'অতিরিক্ত সার্ভিস ও বিবিধ চার্জ',
    applyExtraToAll: false,
    previousDue: 0,
    paidAmount: 0,
    paymentMethod: 'CASH',
    referenceNo: '',
    adminNote: '',
  });

  // 6. Due Clearance Modal (Clear all or partial)
  const [dueClearModalOpen, setDueClearModalOpen] = useState(false);
  const [targetDueFlat, setTargetDueFlat] = useState<any>(null);
  const [dueClearAction, setDueClearAction] = useState<'CLEAR_ALL' | 'PARTIAL'>('CLEAR_ALL');
  const [partialPayAmount, setPartialPayAmount] = useState<number>(0);
  const [dueClearNote, setDueClearNote] = useState<string>('');

  // 7. Tenant Edit & NID Details Modal
  const [tenantEditModalOpen, setTenantEditModalOpen] = useState(false);
  const [tenantEditForm, setTenantEditForm] = useState({
    tenantId: '',
    flatId: '',
    flatCode: '',
    fullNameBn: '',
    fullNameEn: '',
    phone: '',
    altPhone: '',
    nationalId: '',
    occupation: '',
    permanentAddress: '',
    familyMembersCount: 1,
    advanceAmount: '',
    moveInDate: '',
    isActive: true,
  });

  // 8. Secure "উঠা / নামা" Double Confirmation Modal
  const [occupancyConfirmModalOpen, setOccupancyConfirmModalOpen] = useState(false);
  const [targetTenantForOccupancy, setTargetTenantForOccupancy] = useState<any>(null);
  const [newOccupancyState, setNewOccupancyState] = useState<boolean>(true);

  // 9. Admin Password Verification Modal for Confirming Any Changes
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordVerificationError, setPasswordVerificationError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    execute: () => Promise<void>;
  } | null>(null);

  const triggerActionWithPasswordConfirmation = (
    title: string,
    description: string,
    execute: () => Promise<void>
  ) => {
    setPendingAction({ title, description, execute });
    setConfirmPasswordInput('');
    setPasswordVerificationError('');
    setPasswordModalOpen(true);
  };

  const handleVerifyPasswordAndExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPasswordInput) {
      setPasswordVerificationError('অনুগ্রহ করে অ্যাডমিন পাসওয়ার্ড লিখুন');
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordVerificationError('');

    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: confirmPasswordInput }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordVerificationError(data.error || 'ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে নিশ্চিত করুন।');
        setIsVerifyingPassword(false);
        return;
      }

      if (pendingAction) {
        const actionToRun = pendingAction.execute;
        setPasswordModalOpen(false);
        setPendingAction(null);
        setConfirmPasswordInput('');
        await actionToRun();
      }
    } catch (err: any) {
      setPasswordVerificationError('সার্ভারে যোগাযোগ করা সম্ভব হয়নি');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Load initial data
  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.authenticated || (meData.user.role !== 'ADMIN' && meData.user.role !== 'SUPER_ADMIN')) {
        router.push('/login');
        return;
      }
      setCurrentUser(meData.user);

      // Fetch Floors & Flats
      const flatsRes = await fetch('/api/flats');
      const flatsJson = await flatsRes.json();
      if (flatsJson.success) setFloors(flatsJson.floors);

      // Fetch Dues summary
      const duesRes = await fetch('/api/dues');
      const duesJson = await duesRes.json();
      if (duesJson.success) setDuesData(duesJson);

      // Fetch Payments
      const paymentsRes = await fetch('/api/payments');
      const paymentsJson = await paymentsRes.json();
      if (paymentsJson.success) setPayments(paymentsJson.payments);

      // Fetch Tenants
      const tenantsRes = await fetch('/api/tenants');
      const tenantsJson = await tenantsRes.json();
      if (tenantsJson.success) setTenants(tenantsJson.tenants);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // All flats flattened & sorted serially (A1 to G3)
  const allFlats = floors.flatMap((floor) => floor.flats || []);
  const serialFlats = [...allFlats].sort((a, b) => {
    const idxA = SERIAL_FLAT_ORDER.indexOf(a.code);
    const idxB = SERIAL_FLAT_ORDER.indexOf(b.code);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.code.localeCompare(b.code);
  });

  const rentableFlats = allFlats.filter((f) => f.type !== 'OWNER');

  // Total collected & total due calculations
  const totalDueOverall = duesData?.summary?.totalDueOverall || 0;
  const totalPaidOverall = duesData?.summary?.totalPaidOverall || 0;
  const highDueFlats = duesData?.flats?.filter((f: any) => f.isOverdueThreshold) || [];

  // Handler: Save Base Rent (immediately live on website)
  const handleSaveBaseRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRentFlat) return;

    triggerActionWithPasswordConfirmation(
      'মূল ভাড়া পরিবর্তন নিশ্চিতকরণ',
      `ফ্ল্যাট ${targetRentFlat.code} এর মূল ভাড়া ৳${Number(newBaseRent).toLocaleString('en-IN')} এ নির্ধারণ করতে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch('/api/flats', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: targetRentFlat.id, baseRent: Number(newBaseRent) }),
          });
          const data = await res.json();
          if (res.ok) {
            setRentEditModalOpen(false);
            setActionSuccess(
              `ফ্ল্যাট ${targetRentFlat.code} এর মূল ভাড়া ৳${Number(newBaseRent).toLocaleString('en-IN')} এ সফলভাবে হালনাগাদ করা হয়েছে এবং মূল ওয়েবসাইটে সঙ্গে সঙ্গে পরিবর্তিত হয়েছে।`
            );
            fetchData();
            setTimeout(() => setActionSuccess(''), 6000);
          } else {
            alert(data.error || 'ভাড়া পরিবর্তন ব্যর্থ হয়েছে');
          }
        } catch (e) {
          alert('সার্ভারে যোগাযোগ করা সম্ভব হয়নি');
        }
      }
    );
  };

  // Handler: Save Single Lift Fee
  const handleSaveSingleLiftFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLiftFlat) return;

    triggerActionWithPasswordConfirmation(
      'একক লিফট ফি পরিবর্তন নিশ্চিতকরণ',
      `ফ্ল্যাট ${targetLiftFlat.code} এর লিফট ফি ৳${Number(singleLiftFee).toLocaleString('en-IN')} নির্ধারণ করতে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch(`/api/flats/${targetLiftFlat.id}/lift-fee`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ liftFee: Number(singleLiftFee) }),
          });
          if (res.ok) {
            setLiftEditModalOpen(false);
            setActionSuccess(`ফ্ল্যাট ${targetLiftFlat.code} এর লিফট ফি ৳${Number(singleLiftFee).toLocaleString('en-IN')} নির্ধারণ করা হয়েছে।`);
            fetchData();
            setTimeout(() => setActionSuccess(''), 5000);
          } else {
            alert('লিফট ফি সংরক্ষণ করা যায়নি');
          }
        } catch (e) {
          alert('ত্রুটি হয়েছে');
        }
      }
    );
  };

  // Handler: Apply Bulk / Selected Lift Fee
  const handleApplyLiftFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkLiftMode === 'SELECTED' && selectedLiftFlatIds.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ফ্ল্যাট নির্বাচন করুন');
      return;
    }

    triggerActionWithPasswordConfirmation(
      'সার্বিক লিফট ফি প্রয়োগ নিশ্চিতকরণ',
      `এককালীন লিফট ফি ৳${Number(bulkLiftFee).toLocaleString('en-IN')} প্রয়োগ করতে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch('/api/flats/lift-fee/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: bulkLiftMode,
              flatIds: bulkLiftMode === 'SELECTED' ? selectedLiftFlatIds : undefined,
              liftFee: Number(bulkLiftFee),
              action: bulkLiftAction,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setSelectedLiftFlatIds([]);
            setActionSuccess(data.message);
            fetchData();
            setTimeout(() => setActionSuccess(''), 6000);
          } else {
            alert(data.error || 'লিফট চার্জ প্রয়োগ ব্যর্থ হয়েছে');
          }
        } catch (e) {
          alert('সার্ভারে সংযোগে ত্রুটি');
        }
      }
    );
  };

  // Handler: Apply Extra / Hidden Charge
  const handleApplyExtraCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (extraChargeMode === 'SELECTED' && selectedExtraFlatIds.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি ফ্ল্যাট নির্বাচন করুন');
      return;
    }

    triggerActionWithPasswordConfirmation(
      'অতিরিক্ত চার্জ যোগ করার নিশ্চিতকরণ',
      `চার্জ "${extraChargeLabel}" (৳${Number(extraChargeAmount).toLocaleString('en-IN')}) প্রয়োগ করতে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch('/api/charges/extra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: extraChargeMode,
              flatIds: extraChargeMode === 'SELECTED' ? selectedExtraFlatIds : undefined,
              amount: Number(extraChargeAmount),
              label: extraChargeLabel,
              category: 'SERVICE',
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setSelectedExtraFlatIds([]);
            setActionSuccess(data.message);
            fetchData();
            setTimeout(() => setActionSuccess(''), 6000);
          } else {
            alert(data.error || 'অতিরিক্ত চার্জ প্রয়োগ ব্যর্থ হয়েছে');
          }
        } catch (e) {
          alert('সার্ভারে সংযোগে ত্রুটি');
        }
      }
    );
  };

  // Handler: Open Bill Report Modal for a specific flat
  const openBillReportModal = (flat?: any) => {
    const target = flat || serialFlats.find((f: any) => f.type !== 'OWNER') || serialFlats[0];
    if (!target) return;

    const activeTenant = target.leases?.[0]?.tenant || tenants.find((t: any) => t.flatId === target.id && t.isActive);
    const existingDueItem = duesData?.flats?.find((df: any) => df.flatId === target.id);
    // Previous due defaults to existing due or 0, manually changeable
    const currentDue = existingDueItem?.totalDue || 0;

    const now = new Date();
    const todayDay = now.getDate();
    const monthIdx = now.getMonth();
    const todayMonthName = BENGALI_MONTHS[monthIdx] || 'সেপ্টেম্বর';
    const todayYear = now.getFullYear();
    const monthStr = `${todayYear}-${String(monthIdx + 1).padStart(2, '0')}`;

    const base = target.baseRent || 0;
    const lift = target.liftFee || 0;
    const total = base + lift + currentDue;

    setBillForm({
      flatId: target.id,
      tenantName: activeTenant?.fullNameBn || '',
      tenantPhone: activeTenant?.phone || '',
      day: todayDay,
      monthName: todayMonthName,
      year: todayYear,
      billingMonth: monthStr,
      baseRent: base,
      liftFee: lift,
      extraCharge: 0,
      extraChargeLabel: 'অতিরিক্ত সার্ভিস ও বিবিধ চার্জ',
      applyExtraToAll: false,
      previousDue: currentDue,
      paidAmount: total,
      paymentMethod: 'CASH',
      referenceNo: '',
      adminNote: '',
    });
    setBillReportModalOpen(true);
  };

  // Handler: Flat change inside bill report modal
  const handleBillFlatChange = (newFlatId: string) => {
    const target = allFlats.find((f: any) => f.id === newFlatId);
    if (!target) return;

    const activeTenant = target.leases?.[0]?.tenant || tenants.find((t: any) => t.flatId === target.id && t.isActive);
    const existingDueItem = duesData?.flats?.find((df: any) => df.flatId === target.id);
    const currentDue = existingDueItem?.totalDue || 0;

    const base = target.baseRent || 0;
    const lift = target.liftFee || 0;
    const total = base + lift + billForm.extraCharge + currentDue;

    setBillForm((prev) => ({
      ...prev,
      flatId: target.id,
      tenantName: activeTenant?.fullNameBn || '',
      tenantPhone: activeTenant?.phone || '',
      baseRent: base,
      liftFee: lift,
      previousDue: currentDue,
      paidAmount: total,
    }));
  };

  // Handler: Submit Bill & Generate Receipt
  const handleGenerateCustomBillAndReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFlat = serialFlats.find((f: any) => f.id === billForm.flatId);

    triggerActionWithPasswordConfirmation(
      'বিল ও অফিসিয়াল রিসিট তৈরি নিশ্চিতকরণ',
      `ফ্ল্যাট ${targetFlat?.code || ''} এর জন্য ৳${Number(billForm.paidAmount).toLocaleString('en-IN')} জমার অফিসিয়াল রিসিট অনুমোদনে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch('/api/bills/generate-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billForm),
          });
          const data = await res.json();
          if (res.ok) {
            setBillReportModalOpen(false);
            setActionSuccess(`বিল রিপোর্ট ও অফিসিয়াল মানি রিসিট সফলভাবে তৈরি হয়েছে! রসিদ নং: ${data.receiptNo}`);
            const receiptRes = await fetch(`/api/receipts/${data.receiptNo}`);
            const receiptJson = await receiptRes.json();
            if (receiptJson.success) {
              setSelectedReceipt(receiptJson.receipt);
            }
            fetchData();
            setTimeout(() => setActionSuccess(''), 6000);
          } else {
            alert(data.error || 'রসিদ তৈরিতে সমস্যা হয়েছে');
          }
        } catch (e) {
          alert('সার্ভারে যোগাযোগ করা যায়নি');
        }
      }
    );
  };

  // Handler: Open Due Clear Modal
  const openDueClearModal = (flat: any) => {
    const existingDueItem = duesData?.flats?.find((df: any) => df.flatId === flat.id);
    const currentDue = existingDueItem?.totalDue || 0;

    setTargetDueFlat(flat);
    setDueClearAction('CLEAR_ALL');
    setPartialPayAmount(currentDue);
    setDueClearNote('');
    setDueClearModalOpen(true);
  };

  // Handler: Submit Due Clear
  const handleDueClearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDueFlat) return;

    const actionText = dueClearAction === 'CLEAR_ALL' ? 'সম্পূর্ণ বকেয়া পরিশোধ' : `আংশিক ৳${Number(partialPayAmount).toLocaleString('en-IN')} পরিশোধ`;

    triggerActionWithPasswordConfirmation(
      'বকেয়া সমন্বয় ও ক্যাশ পরিশোধ নিশ্চিতকরণ',
      `ফ্ল্যাট ${targetDueFlat.code} এর ${actionText} নিশ্চিত করতে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch('/api/dues/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              flatId: targetDueFlat.id,
              action: dueClearAction,
              amount: dueClearAction === 'PARTIAL' ? Number(partialPayAmount) : undefined,
              note: dueClearNote,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setDueClearModalOpen(false);
            setActionSuccess(data.message);
            fetchData();
            setTimeout(() => setActionSuccess(''), 5000);
          } else {
            alert(data.error || 'বকেয়া পরিশোধ ব্যর্থ হয়েছে');
          }
        } catch (e) {
          alert('সার্ভারে সমস্যা হয়েছে');
        }
      }
    );
  };

  // Handler: Open Tenant Edit Modal
  const openTenantEditModal = (flat: any) => {
    const activeLease = flat.leases?.find((l: any) => l.status === 'ACTIVE' && l.tenant?.isActive);
    const existingTenant = activeLease?.tenant || tenants.find((t: any) => t.flatId === flat.id && t.isActive);
    const existingAdvance = activeLease?.securityDeposit ?? existingTenant?.leases?.[0]?.securityDeposit;

    if (existingTenant && existingTenant.isActive) {
      setTenantEditForm({
        tenantId: existingTenant.id,
        flatId: flat.id,
        flatCode: flat.code,
        fullNameBn: existingTenant.fullNameBn || '',
        fullNameEn: existingTenant.fullNameEn || '',
        phone: existingTenant.phone || '',
        altPhone: existingTenant.altPhone || '',
        nationalId: existingTenant.nationalId || '',
        occupation: existingTenant.occupation || '',
        permanentAddress: existingTenant.permanentAddress || '',
        familyMembersCount: existingTenant.familyMembersCount || 1,
        advanceAmount: existingAdvance !== undefined && existingAdvance !== null && existingAdvance !== 0 ? String(existingAdvance) : (existingAdvance === 0 ? '0' : ''),
        moveInDate: existingTenant.moveInDate ? new Date(existingTenant.moveInDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        isActive: true,
      });
    } else {
      // Vacant flat: All fields completely blank ready for new tenant info
      setTenantEditForm({
        tenantId: '',
        flatId: flat.id,
        flatCode: flat.code,
        fullNameBn: '',
        fullNameEn: '',
        phone: '',
        altPhone: '',
        nationalId: '',
        occupation: '',
        permanentAddress: '',
        familyMembersCount: 1,
        advanceAmount: '',
        moveInDate: new Date().toISOString().slice(0, 10),
        isActive: true,
      });
    }
    setTenantEditModalOpen(true);
  };

  // Handler: Save Tenant & NID Details
  const handleSaveTenantDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    triggerActionWithPasswordConfirmation(
      'ভাড়াটিয়া ও এনআইডি তথ্য সংরক্ষণ নিশ্চিতকরণ',
      `ফ্ল্যাট ${tenantEditForm.flatCode} এর ভাড়াটিয়া ও এনআইডি বিবরণ সংরক্ষণ করতে অ্যাডমিন পাসওয়ার্ড দিন।`,
      async () => {
        try {
          const res = await fetch('/api/tenants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tenantEditForm),
          });
          const data = await res.json();
          if (res.ok) {
            setTenantEditModalOpen(false);
            setActionSuccess(`ফ্ল্যাট ${tenantEditForm.flatCode} এর ভাড়াটিয়া ও এনআইডি তথ্য সফলভাবে সংরক্ষিত হয়েছে।`);
            fetchData();
            setTimeout(() => setActionSuccess(''), 5000);
          } else {
            alert(data.error || 'ভাড়াটিয়ার তথ্য সংরক্ষণ ব্যর্থ হয়েছে');
          }
        } catch (e) {
          alert('সার্ভারে সমস্যা হয়েছে');
        }
      }
    );
  };

  // Handler: Trigger Double Confirmation for "উঠা / নামা"
  const requestOccupancyChange = (tenant: any, newStatus: boolean, flat?: any) => {
    const resolvedTenant = flat ? { ...tenant, flatId: tenant?.flatId || flat.id, flatCode: flat.code, flat } : tenant;
    setTargetTenantForOccupancy(resolvedTenant);
    setNewOccupancyState(newStatus);
    setOccupancyConfirmModalOpen(true);
  };

  // Handler: Execute confirmed occupancy change
  const executeOccupancyChange = async () => {
    if (!targetTenantForOccupancy) return;

    const isVacating = !newOccupancyState;
    const flatCode = targetTenantForOccupancy.flat?.code || targetTenantForOccupancy.flatCode || '';
    const actionTitle = isVacating ? 'ভাড়াটিয়া নামা ও তথ্য অপসারণ নিশ্চিতকরণ' : 'ভাড়াটিয়া উঠা নিশ্চিতকরণ';
    const actionDesc = isVacating
      ? `ফ্ল্যাট ${flatCode} এর পূর্ববর্তী ভাড়াটিয়ার সংরক্ষিত তথ্য ও অগ্রিম জামানত সম্পূর্ণ মুছে ফ্ল্যাটটি খালি (VACANT) করতে অ্যাডমিন পাসওয়ার্ড দিন।`
      : `ফ্ল্যাট ${flatCode} এর ভাড়াটিয়ার স্ট্যাটাস 'উঠা (বর্তমান)' সক্রিয় করতে অ্যাডমিন পাসওয়ার্ড দিন।`;

    triggerActionWithPasswordConfirmation(
      actionTitle,
      actionDesc,
      async () => {
        try {
          if (!newOccupancyState) {
            // Admin clicked "নামা" (Vacate): Send DELETE request to completely remove stored tenant data
            const res = await fetch('/api/tenants', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId: targetTenantForOccupancy.id,
                flatId: targetTenantForOccupancy.flatId,
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setOccupancyConfirmModalOpen(false);
              setActionSuccess(
                `ফ্ল্যাট ${targetTenantForOccupancy.flat?.code || targetTenantForOccupancy.flatCode || ''} এর পূর্ববর্তী ভাড়াটিয়ার সংরক্ষিত সমস্ত তথ্য মুছে ফেলা হয়েছে এবং ফ্ল্যাটটি খালি করা হয়েছে। এখন নতুন ভাড়াটিয়ার তথ্য হালনাগাদ করা যাবে।`
              );
              fetchData();
              setTimeout(() => setActionSuccess(''), 6000);
            } else {
              alert(data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
            }
          } else {
            // "উঠা" (Re-occupy)
            const res = await fetch('/api/tenants', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId: targetTenantForOccupancy.id,
                flatId: targetTenantForOccupancy.flatId,
                isActive: true,
                moveInDate: new Date().toISOString(),
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setOccupancyConfirmModalOpen(false);
              setActionSuccess(
                `ফ্ল্যাট ${targetTenantForOccupancy.flat?.code || targetTenantForOccupancy.flatCode || ''} এর ভাড়াটিয়ার স্ট্যাটাস সফলভাবে 'উঠা (বর্তমান)' হিসেবে সক্রিয় করা হয়েছে।`
              );
              fetchData();
              setTimeout(() => setActionSuccess(''), 6000);
            } else {
              alert(data.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
            }
          }
        } catch (e) {
          alert('সার্ভারে সমস্যা হয়েছে');
        }
      }
    );
  };

  // Handler: View Receipt
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-700 font-bold gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-900" />
        <p className="text-sm">সাঈদী টাওয়ার অ্যাডমিন কন্ট্রোল প্যানেল লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      <Navbar user={currentUser} />

      {/* Top Header & Smooth Back Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 font-bold text-xs transition border border-slate-300"
              title="মূল পাবলিক ওয়েবসাইটে ফিরে যান"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-900" />
              <span>মূল ওয়েবসাইট</span>
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-900 text-white font-bold text-[11px]">
                  অ্যাডমিন প্যানেল
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  সাঈদী টাওয়ার — প্রশাসনিক ও হিসাব কন্ট্রোল
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                লোহাগাড়া, চট্টগ্রাম • ৭ তলা বিশিষ্ট আধুনিক আবাসিক ভবন (২০ ইউনিট)
              </p>
            </div>
          </div>

          {/* Quick Universal Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openBillReportModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition shadow-xs cursor-pointer min-h-[40px]"
            >
              <FileText className="w-4 h-4" />
              <span>বিল রিপোর্ট ও রসিদ তৈরি</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs min-h-[40px]"
            >
              <Home className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">হোমপেজ দেখুন</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Action Success Alert Banner */}
      {actionSuccess && (
        <div className="bg-emerald-700 text-white px-4 py-2.5 shadow text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Clean 3-Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex overflow-x-auto gap-2 py-2.5 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer min-h-[42px] ${
              activeTab === 'dashboard'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span>১. ড্যাশবোর্ড ও কুইক কন্ট্রোল (Dashboard)</span>
          </button>

          <button
            onClick={() => setActiveTab('building')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer min-h-[42px] ${
              activeTab === 'building'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-400" />
            <span>২. বিল্ডিং ভিউ — তলাভিত্তিক (Building View)</span>
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer min-h-[42px] ${
              activeTab === 'tenants'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>৩. ভাড়াটিয়া তালিকা ও নথি (Tenants & NID)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 w-full flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: ড্যাশবোর্ড ও কুইক কন্ট্রোল (DASHBOARD & QUICK CONTROLS)           */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 block">মোট ফ্ল্যাট সংখ্যা</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
                  ২০ টি ইউনিট
                </span>
                <span className="text-xs text-blue-800 mt-1 block font-medium">
                  ১৯ ভাড়াযোগ্য + ১ মালিকের ইউনিট (E2-E3)
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 block">প্রত্যাশিত পূর্ণ মাসিক ভাড়া</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-950 mt-1 block">
                  {formatMoney(174000)}
                </span>
                <span className="text-xs text-slate-500 mt-1 block font-medium">
                  ১৯টি ফ্ল্যাটের নির্ধারিত মাসিক মোট
                </span>
              </div>
            </div>

            {/* Quick Controllers: Lift Fee & Extra / Hidden Charge */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controller 1: Lift Fee Manager (Bulk / Selected) */}
              <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-900">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">লিফট ফি নিয়ন্ত্রণ (Lift Fee)</h3>
                      <p className="text-xs text-slate-500">সব ফ্ল্যাটে অথবা বাছাইকৃত ফ্ল্যাটে প্রয়োগ করুন</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-[11px] rounded-lg">
                    সচল সুবিধা
                  </span>
                </div>

                <form onSubmit={handleApplyLiftFee} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">প্রয়োগের পরিধি</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkLiftMode('ALL')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          bulkLiftMode === 'ALL'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        সকল ফ্ল্যাটে (All Flats)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkLiftMode('SELECTED')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          bulkLiftMode === 'SELECTED'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        বাছাইকৃত ফ্ল্যাটে ({selectedLiftFlatIds.length})
                      </button>
                    </div>
                  </div>

                  {bulkLiftMode === 'SELECTED' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-700">ফ্ল্যাট নির্বাচন করুন:</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedLiftFlatIds.length === rentableFlats.length) {
                              setSelectedLiftFlatIds([]);
                            } else {
                              setSelectedLiftFlatIds(rentableFlats.map((f) => f.id));
                            }
                          }}
                          className="text-[10px] text-blue-900 font-bold hover:underline cursor-pointer"
                        >
                          {selectedLiftFlatIds.length === rentableFlats.length ? 'সব বাদ দিন' : 'সবগুলো নির্বাচন'}
                        </button>
                      </div>
                      <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-4 sm:grid-cols-5 gap-1.5 text-xs">
                        {rentableFlats.map((flat) => {
                          const isChecked = selectedLiftFlatIds.includes(flat.id);
                          return (
                            <label
                              key={flat.id}
                              className={`flex items-center justify-center gap-1 p-1.5 rounded-lg border font-bold text-xs cursor-pointer transition ${
                                isChecked
                                  ? 'bg-amber-100 border-amber-400 text-amber-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLiftFlatIds([...selectedLiftFlatIds, flat.id]);
                                  } else {
                                    setSelectedLiftFlatIds(selectedLiftFlatIds.filter((id) => id !== flat.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-amber-600"
                              />
                              <span>{flat.code}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">অ্যাকশন</label>
                      <select
                        value={bulkLiftAction}
                        onChange={(e: any) => setBulkLiftAction(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="SET">নির্দিষ্ট ফি নির্ধারণ (Set)</option>
                        <option value="ADD">পূর্বেটির সাথে যোগ (Add)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">লিফট ফি (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        required
                        value={bulkLiftFee}
                        onChange={(e) => setBulkLiftFee(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>
                      {bulkLiftMode === 'ALL'
                        ? 'সকল ১৯টি ফ্ল্যাটে লিফট ফি প্রয়োগ করুন'
                        : `নির্বাচিত ${selectedLiftFlatIds.length} টি ফ্ল্যাটে লিফট ফি প্রয়োগ করুন`}
                    </span>
                  </button>
                </form>
              </div>

              {/* Controller 2: Extra / Hidden Charge Manager (Bulk / Selected) */}
              <div className="bg-white rounded-3xl p-6 border border-blue-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-900">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">অতিরিক্ত / হিডেন চার্জ প্রয়োগ</h3>
                      <p className="text-xs text-slate-500">সার্ভিস, জেনারেটর বা মেরামত চার্জ যুক্ত করুন</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold text-[11px] rounded-lg">
                    ঐচ্ছিক চার্জ
                  </span>
                </div>

                <form onSubmit={handleApplyExtraCharge} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">প্রয়োগের পরিধি</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExtraChargeMode('ALL')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          extraChargeMode === 'ALL'
                            ? 'bg-blue-900 text-white border-blue-950 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        সকল ফ্ল্যাটে (All Flats)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExtraChargeMode('SELECTED')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          extraChargeMode === 'SELECTED'
                            ? 'bg-blue-900 text-white border-blue-950 font-black shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        বাছাইকৃত ফ্ল্যাটে ({selectedExtraFlatIds.length})
                      </button>
                    </div>
                  </div>

                  {extraChargeMode === 'SELECTED' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-700">ফ্ল্যাট নির্বাচন করুন:</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedExtraFlatIds.length === rentableFlats.length) {
                              setSelectedExtraFlatIds([]);
                            } else {
                              setSelectedExtraFlatIds(rentableFlats.map((f) => f.id));
                            }
                          }}
                          className="text-[10px] text-blue-900 font-bold hover:underline cursor-pointer"
                        >
                          {selectedExtraFlatIds.length === rentableFlats.length ? 'সব বাদ দিন' : 'সবগুলো নির্বাচন'}
                        </button>
                      </div>
                      <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-4 sm:grid-cols-5 gap-1.5 text-xs">
                        {rentableFlats.map((flat) => {
                          const isChecked = selectedExtraFlatIds.includes(flat.id);
                          return (
                            <label
                              key={flat.id}
                              className={`flex items-center justify-center gap-1 p-1.5 rounded-lg border font-bold text-xs cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-100 border-blue-400 text-blue-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedExtraFlatIds([...selectedExtraFlatIds, flat.id]);
                                  } else {
                                    setSelectedExtraFlatIds(selectedExtraFlatIds.filter((id) => id !== flat.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-blue-900"
                              />
                              <span>{flat.code}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">চার্জের খাত / বিবরণ</label>
                      <input
                        type="text"
                        required
                        value={extraChargeLabel}
                        onChange={(e) => setExtraChargeLabel(e.target.value)}
                        placeholder="যেমন: পরিচ্ছন্নতা / জেনারেটর ফি"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">চার্জের পরিমাণ (৳)</label>
                      <input
                        type="number"
                        min="1"
                        step="50"
                        required
                        value={extraChargeAmount}
                        onChange={(e) => setExtraChargeAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {extraChargeMode === 'ALL'
                        ? 'সকল ১৯টি ফ্ল্যাটে অতিরিক্ত চার্জ যোগ করুন'
                        : `নির্বাচিত ${selectedExtraFlatIds.length} টি ফ্ল্যাটে অতিরিক্ত চার্জ যোগ করুন`}
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Serial Flats (A1 to G3) Receipt Generator Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    সকল ফ্ল্যাটের ধারাবাহিক তালিকা (A1 থেকে G3) ও রসিদ তৈরি
                  </h3>
                  <p className="text-xs text-slate-500">
                    প্রতিটি ফ্ল্যাটের ভাড়াটিয়ার নাম, মোবাইল, ভাড়া, লিফট ফি ও দ্রুত মানি রিসিট তৈরির সুবিধা
                  </p>
                </div>
                <button
                  onClick={() => openBillReportModal()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>কাস্টম বিল ও রসিদ তৈরি</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ফ্ল্যাট কোড</th>
                      <th className="py-3 px-4">তলা</th>
                      <th className="py-3 px-4">বর্তমান ভাড়াটিয়া ও মোবাইল</th>
                      <th className="py-3 px-4">মূল ভাড়া</th>
                      <th className="py-3 px-4">লিফট ফি</th>
                      <th className="py-3 px-4">বর্তমান বকেয়া</th>
                      <th className="py-3 px-4 text-center">মানি রিসিট অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {serialFlats.map((flat) => {
                      const isOwner = flat.type === 'OWNER';
                      const activeTenant =
                        flat.leases?.[0]?.tenant ||
                        tenants.find((t: any) => t.flatId === flat.id && t.isActive);
                      const dueItem = duesData?.flats?.find((df: any) => df.flatId === flat.id);
                      const due = dueItem?.totalDue || 0;

                      return (
                        <tr key={flat.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <span className="font-black text-sm text-slate-900 block">
                              ফ্ল্যাট {flat.code}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {isOwner ? 'মালিকের ফ্ল্যাট' : flat.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-600">
                            {flat.floor?.labelBn}
                          </td>
                          <td className="py-3 px-4">
                            {isOwner ? (
                              <span className="text-blue-900 font-bold text-xs">মালিকের ব্যক্তিগত ব্যবহার</span>
                            ) : activeTenant ? (
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">
                                  {activeTenant.fullNameBn}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {activeTenant.phone}
                                </span>
                              </div>
                            ) : (
                              <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                খালি (To Let)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {isOwner ? '—' : formatMoney(flat.baseRent)}
                          </td>
                          <td className="py-3 px-4 font-black">
                            {isOwner ? (
                              '—'
                            ) : flat.liftFee > 0 ? (
                              <span className="text-amber-800 font-mono font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                {formatMoney(flat.liftFee)}
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                                ৳০
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-black text-sm">
                            {isOwner ? (
                              '—'
                            ) : due > 0 ? (
                              <span className="text-red-700 font-mono font-bold">{formatMoney(due)}</span>
                            ) : (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                পরিশোধিত
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOwner ? (
                              <span className="text-slate-400 text-xs">—</span>
                            ) : (
                              <button
                                onClick={() => openBillReportModal(flat)}
                                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-300" />
                                <span>রসিদ তৈরি</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: বিল্ডিং ভিউ — তলাভিত্তিক (BUILDING VIEW — FLOOR WISE)              */}
        {/* ========================================================================= */}
        {activeTab === 'building' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  সাঈদী টাওয়ার — তলাভিত্তিক ভিউ (Floor Stack)
                </h3>
                <p className="text-xs text-slate-500">
                  নিচতলা থেকে ৭ম তলা পর্যন্ত প্রতিটি ফ্ল্যাটের ভাড়া, লিফট চার্জ, বকেয়া ও পরিশোধ ব্যবস্থাপনা
                </p>
              </div>

              {/* Status color legends */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span>পরিশোধিত</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span>বকেয়া বিদ্যমান</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                  <span>খালি</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-700"></span>
                  <span>মালিক</span>
                </span>
              </div>
            </div>

            {/* Floor Stacks */}
            <div className="space-y-5">
              {floors.map((floor) => (
                <div
                  key={floor.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-black text-xs">
                        Level {floor.level}
                      </span>
                      <h4 className="font-black text-base text-slate-900">{floor.labelBn}</h4>
                      <span className="text-xs text-slate-400">({floor.labelEn})</span>
                    </div>

                    <div className="text-xs text-slate-500 font-semibold">
                      {floor.flats?.length || 0} টি ফ্ল্যাট ইউনিট
                    </div>
                  </div>

                  {/* Flats grid for this floor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {floor.flats?.map((flat: any) => {
                      const isOwner = flat.type === 'OWNER';
                      const activeTenant =
                        flat.leases?.[0]?.tenant ||
                        tenants.find((t: any) => t.flatId === flat.id && t.isActive);
                      const dueItem = duesData?.flats?.find((df: any) => df.flatId === flat.id);
                      const due = dueItem?.totalDue || 0;

                      return (
                        <div
                          key={flat.id}
                          className={`p-4 rounded-2xl border-2 transition flex flex-col justify-between ${
                            isOwner
                              ? 'bg-blue-50/60 border-blue-200'
                              : due > 0
                              ? 'bg-red-50/30 border-red-200'
                              : 'bg-emerald-50/30 border-emerald-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-xl text-slate-900">
                                ফ্ল্যাট {flat.code}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isOwner
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : activeTenant
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {isOwner ? 'মালিক' : activeTenant ? 'ভাড়া হয়েছে' : 'খালি'}
                              </span>
                            </div>

                            {activeTenant && (
                              <div className="mb-2 p-2 bg-white rounded-xl border border-slate-200 text-xs">
                                <span className="font-bold text-slate-900 block truncate">
                                  {activeTenant.fullNameBn}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {activeTenant.phone}
                                </span>
                              </div>
                            )}

                            <div className="space-y-1 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-100">
                              <div className="flex justify-between items-center">
                                <span>মূল ভাড়া:</span>
                                <strong className="text-slate-900 font-mono">
                                  {isOwner ? '—' : formatMoney(flat.baseRent)}
                                </strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>লিফট ফি:</span>
                                <span className="font-mono font-bold text-amber-800">
                                  {isOwner ? '—' : formatMoney(flat.liftFee)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                                <span>পূর্বের বকেয়া:</span>
                                <span className="font-mono font-bold text-red-700">
                                  {isOwner ? '—' : formatMoney(due)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!isOwner && (
                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
                              {/* Change Rent & Change Lift */}
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => {
                                    setTargetRentFlat(flat);
                                    setNewBaseRent(flat.baseRent || 0);
                                    setRentEditModalOpen(true);
                                  }}
                                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  title="মূল ভাড়া পরিবর্তন (ওয়েবসাইটে অবিলম্বে প্রকাশিত হবে)"
                                >
                                  <Edit className="w-3 h-3 text-emerald-700" />
                                  <span>ভাড়া পরিবর্তন</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setTargetLiftFlat(flat);
                                    setSingleLiftFee(flat.liftFee || 0);
                                    setLiftEditModalOpen(true);
                                  }}
                                  className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  title="লিফট ফি পরিবর্তন"
                                >
                                  <Sliders className="w-3 h-3 text-amber-700" />
                                  <span>লিফট ফি</span>
                                </button>
                              </div>

                              {/* Due Clearance / Partial payment */}
                              <button
                                onClick={() => openDueClearModal(flat)}
                                className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CreditCard className="w-3 h-3 text-amber-300" />
                                <span>বকেয়া পরিশোধ / সমন্বয়</span>
                              </button>

                              {/* Receipt Generator */}
                              <button
                                onClick={() => openBillReportModal(flat)}
                                className="w-full py-2 px-2 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-300" />
                                <span>রসিদ তৈরি ও প্রিন্ট</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ভাড়াটিয়া তালিকা ও নথি (TENANTS & NID — FLOOR WISE)                 */}
        {/* ========================================================================= */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  ভাড়াটিয়া তালিকা ও জাতীয় পরিচয়পত্র (NID) নথি
                </h3>
                <p className="text-xs text-slate-500">
                  মূল ওয়েবসাইটের মতোই তলাভিত্তিক বিন্যাস • ফ্ল্যাটভিত্তিক যাবতীয় তথ্য ও ডকুমেন্টেশন
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 font-medium max-w-md">
                <span className="font-bold block text-amber-900 mb-0.5">নিরাপত্তা নির্দেশনা:</span>
                ভাড়াটিয়ার 'উঠা / নামা' স্ট্যাটাস একটি সংবেদনশীল বিষয়। এতে পরিবর্তন আনার সময় নিশ্চিতকরণ ডায়ালগ প্রদান করা হবে।
              </div>
            </div>

            {/* Floor wise tenant cards */}
            <div className="space-y-6">
              {floors.map((floor) => {
                const floorFlats = floor.flats || [];

                return (
                  <div key={floor.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-black text-xs">
                          Level {floor.level}
                        </span>
                        <h4 className="font-black text-base text-slate-900">{floor.labelBn}</h4>
                        <span className="text-xs text-slate-400">({floor.labelEn})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {floorFlats.map((flat: any) => {
                        const isOwner = flat.type === 'OWNER';
                        const activeLease = flat.leases?.find((l: any) => l.status === 'ACTIVE' && l.tenant?.isActive);
                        const tenant =
                          activeLease?.tenant ||
                          tenants.find((t: any) => t.flatId === flat.id && t.isActive) ||
                          null;
                        const hasActiveTenant = Boolean(tenant && tenant.isActive);

                        return (
                          <div
                            key={flat.id}
                            className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between hover:border-blue-900 transition"
                          >
                            <div>
                              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                                <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-black text-sm">
                                  ফ্ল্যাট {flat.code}
                                </span>
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    isOwner
                                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                                      : hasActiveTenant
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : 'bg-amber-50 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  {isOwner ? 'মালিক' : hasActiveTenant ? 'উঠা (বর্তমান)' : 'নামা (খালি)'}
                                </span>
                              </div>

                              {isOwner ? (
                                <div className="py-4 text-center text-xs text-blue-950 font-bold">
                                  মালিকের নিজস্ব ফ্ল্যাট (E2-E3 ডুপ্লেক্স ইউনিট)
                                </div>
                              ) : hasActiveTenant ? (
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <h5 className="font-black text-slate-900 text-base">
                                      {tenant.fullNameBn}
                                    </h5>
                                    <span className="text-[11px] text-slate-500 block font-sans">
                                      {tenant.fullNameEn}
                                    </span>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-slate-600">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500">মোবাইল নম্বর:</span>
                                      <div className="flex items-center gap-1.5">
                                        <a
                                          href={`tel:${tenant.phone}`}
                                          className="font-bold text-slate-900 hover:underline font-mono"
                                        >
                                          {tenant.phone}
                                        </a>
                                        <a
                                          href={`https://wa.me/88${tenant.phone?.replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-600 hover:text-emerald-700"
                                          title="WhatsApp"
                                        >
                                          <WhatsAppIcon className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    </div>

                                    {/* NID Field */}
                                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                                      <span className="text-[11px] font-bold text-slate-500 block mb-0.5 flex items-center gap-1">
                                        <FileBadge className="w-3.5 h-3.5 text-blue-900" />
                                        <span>জাতীয় পরিচয়পত্র / NID নম্বর:</span>
                                      </span>
                                      <span className="font-mono font-bold text-slate-900 text-xs">
                                        {tenant.nationalId || 'নথি আপলোড বাকি (তথ্য এডিটে যুক্ত করুন)'}
                                      </span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">পেশা:</span>
                                      <strong className="text-slate-900">{tenant.occupation || '—'}</strong>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">পরিবারের সদস্য:</span>
                                      <strong className="text-slate-900">{tenant.familyMembersCount || 1} জন</strong>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">ওঠার তারিখ (Move In):</span>
                                      <strong className="text-slate-900">
                                        {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : '—'}
                                      </strong>
                                    </div>

                                    <div className="flex justify-between">
                                      <span className="text-slate-500">অগ্রিম জামানত (Advance Given):</span>
                                      <strong className="text-emerald-700 font-mono font-bold">
                                        {(activeLease?.securityDeposit || tenant.leases?.[0]?.securityDeposit)
                                          ? `৳${Number(activeLease?.securityDeposit || tenant.leases?.[0]?.securityDeposit).toLocaleString('en-IN')}`
                                          : '—'}
                                      </strong>
                                    </div>

                                    {tenant.permanentAddress && (
                                      <div>
                                        <span className="text-slate-500 block text-[11px]">স্থায়ী ঠিকানা:</span>
                                        <span className="text-slate-900 font-medium text-[11px]">
                                          {tenant.permanentAddress}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Vacant flat: Blank info details shown as requested by admin */
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <h5 className="font-bold text-slate-400 text-base italic">
                                      কোনো ভাড়াটিয়া নেই (খালি ফ্ল্যাট)
                                    </h5>
                                    <span className="text-[11px] text-slate-400 block font-sans">
                                      No Active Tenant • Ready for New Tenant
                                    </span>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-slate-400">
                                    <div className="flex items-center justify-between">
                                      <span>মোবাইল নম্বর:</span>
                                      <span className="font-mono font-bold">—</span>
                                    </div>

                                    <div className="p-2 bg-slate-100/80 rounded-xl border border-dashed border-slate-300">
                                      <span className="text-[11px] font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                                        <FileBadge className="w-3.5 h-3.5 text-slate-400" />
                                        <span>জাতীয় পরিচয়পত্র / NID বিবরণ:</span>
                                      </span>
                                      <span className="font-mono text-slate-400 text-xs italic">
                                        তথ্য খালি (নতুন ভাড়াটিয়া যুক্ত করুন)
                                      </span>
                                    </div>

                                    <div className="flex justify-between">
                                      <span>পেশা:</span>
                                      <strong className="text-slate-400">—</strong>
                                    </div>

                                    <div className="flex justify-between">
                                      <span>পরিবারের সদস্য:</span>
                                      <strong className="text-slate-400">—</strong>
                                    </div>

                                    <div className="flex justify-between">
                                      <span>ওঠার তারিখ (Move In):</span>
                                      <strong className="text-slate-400">—</strong>
                                    </div>

                                    <div className="flex justify-between">
                                      <span>অগ্রিম জামানত (Advance Given):</span>
                                      <strong className="text-slate-400">—</strong>
                                    </div>

                                    <div>
                                      <span className="block text-[11px]">স্থায়ী ঠিকানা:</span>
                                      <span className="font-medium text-[11px] italic text-slate-400">—</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {!isOwner && (
                              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => openTenantEditModal(flat)}
                                    className="py-2 px-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                                    title="তথ্য ও NID এডিট বা নতুন তথ্য দিন"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-blue-900" />
                                    <span>তথ্য ও NID এডিট</span>
                                  </button>

                                  {hasActiveTenant ? (
                                    <button
                                      type="button"
                                      onClick={() => requestOccupancyChange(tenant, false, flat)}
                                      className="py-2 px-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 border bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300"
                                      title="ভাড়াটিয়া নামা ও পূর্বের তথ্য খালি করুন"
                                    >
                                      <UserX className="w-3.5 h-3.5 text-amber-700" />
                                      <span>নামা (Vacate)</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openTenantEditModal(flat)}
                                      className="py-2 px-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 border bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300"
                                      title="নতুন ভাড়াটিয়া তুলুন ও তথ্য ইনপুট দিন"
                                    >
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>+ নতুন ভাড়াটিয়া (উঠা)</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: RENT EDIT MODAL (IMMEDIATE WEBSITE UPDATE)                       */}
      {/* ========================================================================= */}
      {rentEditModalOpen && targetRentFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-700 shrink-0" />
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  মূল ভাড়া পরিবর্তন — ফ্ল্যাট {targetRentFlat.code}
                </h3>
              </div>
              <button
                onClick={() => setRentEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBaseRent} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium leading-relaxed">
                <span className="font-bold block text-emerald-900 mb-0.5">তাৎক্ষণিক আপডেট নির্দেশিকা:</span>
                এখানে নতুন যে মাসিক ভাড়া সংরক্ষণ করবেন, তা সাঈদী টাওয়ারের মূল ওয়েবসাইটে এবং ডাটাবেজে সাথে সাথে আপডেট হবে।
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ফ্ল্যাট {targetRentFlat.code} এর নতুন মূল ভাড়া (টাকা / BDT):
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={newBaseRent}
                    onChange={(e) => setNewBaseRent(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
                <div className="flex justify-between">
                  <span>বর্তমান মূল ভাড়া:</span>
                  <strong className="text-slate-700 font-mono">{formatMoney(targetRentFlat.baseRent)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>ফ্ল্যাটের বর্তমান লিফট ফি:</span>
                  <strong className="text-slate-700 font-mono">{formatMoney(targetRentFlat.liftFee)}</strong>
                </div>
                <div className="pt-1 border-t border-slate-200 flex justify-between text-slate-900 font-bold">
                  <span>নতুন সর্বমোট মাসিক দাবি:</span>
                  <strong className="text-emerald-700 font-mono text-sm">
                    {formatMoney(Number(newBaseRent) + targetRentFlat.liftFee)}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRentEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow cursor-pointer min-h-[44px]"
                >
                  সংরক্ষণ ও মূল সাইটে প্রকাশ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SINGLE LIFT FEE MODAL                                            */}
      {/* ========================================================================= */}
      {liftEditModalOpen && targetLiftFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600 shrink-0" />
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  লিফট ফি নির্ধারণ — ফ্ল্যাট {targetLiftFlat.code}
                </h3>
              </div>
              <button
                onClick={() => setLiftEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSingleLiftFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মাসিক লিফট ফি (টাকা / BDT):
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={singleLiftFee}
                    onChange={(e) => setSingleLiftFee(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLiftEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs transition shadow cursor-pointer min-h-[44px]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DUE CLEARANCE & PARTIAL PAYMENT MODAL                           */}
      {/* ========================================================================= */}
      {dueClearModalOpen && targetDueFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-900 shrink-0" />
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  বকেয়া সমন্বয় — ফ্ল্যাট {targetDueFlat.code}
                </h3>
              </div>
              <button
                onClick={() => setDueClearModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDueClearSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">পরিশোধের ধরন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDueClearAction('CLEAR_ALL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      dueClearAction === 'CLEAR_ALL'
                        ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    সম্পূর্ণ বকেয়া পরিশোধ (Clear All)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueClearAction('PARTIAL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      dueClearAction === 'PARTIAL'
                        ? 'bg-blue-900 text-white border-blue-950 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    আংশিক পরিশোধ (Partial)
                  </button>
                </div>
              </div>

              {dueClearAction === 'PARTIAL' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পরিশোধের পরিমাণ (৳)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={partialPayAmount}
                    onChange={(e) => setPartialPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নোট / বিবরণ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: নগদ টাকা বা ব্যাংক জমা"
                  value={dueClearNote}
                  onChange={(e) => setDueClearNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDueClearModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs transition shadow cursor-pointer min-h-[44px]"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TENANT & NID DETAILS EDIT MODAL                                  */}
      {/* ========================================================================= */}
      {tenantEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-900 shrink-0" />
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    {tenantEditForm.tenantId
                      ? `ভাড়াটিয়া ও নথি এডিট — ফ্ল্যাট ${tenantEditForm.flatCode}`
                      : `নতুন ভাড়াটিয়ার তথ্য ইনপুট — ফ্ল্যাট ${tenantEditForm.flatCode}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tenantEditForm.tenantId
                      ? 'ভাড়াটিয়ার বর্তমান বিবরণ ও NID নম্বর হালনাগাদ করুন'
                      : 'নতুন ভাড়াটিয়ার তথ্য দিন। সংরক্ষণের পর ফ্ল্যাটটি সরাসরি প্রস্তুত হবে।'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTenantEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenantDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভাড়াটিয়ার নাম (বাংলা) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantEditForm.fullNameBn}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, fullNameBn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">নাম (English)</label>
                  <input
                    type="text"
                    value={tenantEditForm.fullNameEn}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, fullNameEn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantEditForm.phone}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">বিকল্প মোবাইল (Alt Phone)</label>
                  <input
                    type="text"
                    value={tenantEditForm.altPhone}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, altPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* NID / Document Details Input */}
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200">
                <label className="block text-xs font-black text-blue-950 mb-1.5 flex items-center gap-1.5">
                  <FileBadge className="w-4 h-4 text-blue-900" />
                  <span>জাতীয় পরিচয়পত্র / NID বিবরণ (Document Details):</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: স্মার্ট কার্ড নং: 8273648192 অথবা NID তথ্য"
                  value={tenantEditForm.nationalId}
                  onChange={(e) => setTenantEditForm({ ...tenantEditForm, nationalId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  ভাড়াটিয়ার ১০ বা ১৭ ডিজিটের NID নম্বর বা ভেরিফিকেশন স্ট্যাটাস লিখুন
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পেশা</label>
                  <input
                    type="text"
                    value={tenantEditForm.occupation}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, occupation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পরিবারের সদস্য সংখ্যা</label>
                  <input
                    type="number"
                    min="1"
                    value={tenantEditForm.familyMembersCount}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, familyMembersCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা</label>
                <input
                  type="text"
                  value={tenantEditForm.permanentAddress}
                  onChange={(e) => setTenantEditForm({ ...tenantEditForm, permanentAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অগ্রিম জামানত (Advance Given - ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="যেমন: ২০০০০"
                    value={tenantEditForm.advanceAmount}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, advanceAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    ভাড়াটিয়ার জামানত (ভাড়াটিয়া নামলে স্বয়ংক্রিয়ভাবে মুছে যাবে)
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ওঠার তারিখ (Move In Date)</label>
                  <input
                    type="date"
                    value={tenantEditForm.moveInDate}
                    onChange={(e) => setTenantEditForm({ ...tenantEditForm, moveInDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTenantEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs transition shadow cursor-pointer min-h-[44px]"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: MANDATORY DOUBLE CONFIRMATION FOR "উঠা / নামা" (MOVE IN/OUT)      */}
      {/* ========================================================================= */}
      {occupancyConfirmModalOpen && targetTenantForOccupancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-amber-400 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-700">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2 mb-6">
              <span className={`px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider ${
                newOccupancyState ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
              }`}>
                {newOccupancyState ? 'ভাড়াটিয়া উঠা নিশ্চিতকরণ' : 'ভাড়াটিয়া নামা ও তথ্য অপসারণ'}
              </span>
              <h3 className="text-lg font-black text-slate-900">
                {newOccupancyState
                  ? `আপনি কি ফ্ল্যাট ${targetTenantForOccupancy.flat?.code || targetTenantForOccupancy.flatCode || ''} এর ভাড়াটিয়াকে 'উঠা (বর্তমান)' করতে চান?`
                  : `আপনি কি নিশ্চিতভাবে এই ভাড়াটিয়াকে 'নামা (খালি)' করতে চান?`}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ফ্ল্যাট: <strong>{targetTenantForOccupancy.flat?.code || targetTenantForOccupancy.flatCode || ''}</strong> • বর্তমান ভাড়াটিয়া: <strong>{targetTenantForOccupancy.fullNameBn}</strong>
                <br />
                পরিবর্তিত নতুন অবস্থা: <strong className={newOccupancyState ? 'text-emerald-700' : 'text-rose-700 font-black'}>
                  {newOccupancyState ? 'উঠা (সক্রিয় বসবাসরত)' : 'নামা (ফ্ল্যাট খালি / Vacated)'}
                </strong>
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs font-medium mb-6 text-left ${
              newOccupancyState
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              {newOccupancyState ? (
                <p>এই পরিবর্তনের ফলে ফ্ল্যাটটির অবস্থা স্বয়ংক্রিয়ভাবে 'OCCUPIED' হিসেবে সিস্টেমে হালনাগাদ হবে।</p>
              ) : (
                <div className="space-y-1">
                  <p className="font-black text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>পূর্ববর্তী তথ্য অপসারণের নোটিশ:</span>
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    'নামা' নিশ্চিত করলে এই ফ্ল্যাটের পূর্বের ভাড়াটিয়ার সংরক্ষিত যাবতীয় তথ্য ও অগ্রিম জামানত (Advance Given) সম্পূর্ণভাবে মুছে ফেলা হবে এবং ফ্ল্যাটটি খালি (VACANT) হবে, যাতে পরবর্তীতে নতুন ভাড়াটিয়ার হালনাগাদ তথ্য ইনপুট দেওয়া যায়।
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOccupancyConfirmModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={executeOccupancyChange}
                className={`flex-1 py-3 rounded-xl font-black text-xs transition shadow cursor-pointer min-h-[44px] text-white ${
                  newOccupancyState
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {newOccupancyState ? 'হ্যাঁ, উঠা নিশ্চিত করুন' : 'হ্যাঁ, নামা ও তথ্য মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CUSTOM BILL REPORT & PROFESSIONAL MONEY RECEIPT GENERATOR        */}
      {/* ========================================================================= */}
      {billReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[94vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900 shrink-0" />
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    ফ্ল্যাট বিল রিপোর্ট ও মানি রিসিট তৈরি
                  </h3>
                  <p className="text-xs text-slate-500">ভাড়াটিয়ার নাম, তারিখ, চার্জ ও পূর্বের বকেয়াসহ ম্যানুয়াল নিয়ন্ত্রণ</p>
                </div>
              </div>
              <button
                onClick={() => setBillReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base p-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateCustomBillAndReceipt} className="space-y-4">
              {/* Flat Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ফ্ল্যাট নির্বাচন করুন (Select Flat)
                </label>
                <select
                  value={billForm.flatId}
                  onChange={(e) => handleBillFlatChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  {rentableFlats.map((flat: any) => (
                    <option key={flat.id} value={flat.id}>
                      ফ্ল্যাট {flat.code} ({flat.floor?.labelBn}) — মূল ভাড়া {formatMoney(flat.baseRent)} • লিফট {formatMoney(flat.liftFee)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenant Name and Phone (Manual edit allowed) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভাড়াটিয়ার নাম (Tenant Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোহাম্মদ রফিক"
                    value={billForm.tenantName}
                    onChange={(e) => setBillForm({ ...billForm, tenantName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভাড়াটিয়ার মোবাইল নম্বর (Phone)
                  </label>
                  <input
                    type="text"
                    placeholder="018XXXXXXXX"
                    value={billForm.tenantPhone}
                    onChange={(e) => setBillForm({ ...billForm, tenantPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              {/* Exact Date, Month, and Year for Receipt */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  রসিদে উল্লেখিত তারিখ, মাস ও বছর (Receipt Date):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">তারিখ (দিন):</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={billForm.day}
                      onChange={(e) => setBillForm({ ...billForm, day: Number(e.target.value) })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">ভাড়ার মাস:</span>
                    <select
                      value={billForm.monthName}
                      onChange={(e) => setBillForm({ ...billForm, monthName: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    >
                      {BENGALI_MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">বছর (Year):</span>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      required
                      value={billForm.year}
                      onChange={(e) => setBillForm({ ...billForm, year: Number(e.target.value) })}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-blue-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Base Rent & Lift Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মূল ফ্ল্যাট ভাড়া (৳)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={billForm.baseRent}
                    onChange={(e) =>
                      setBillForm({
                        ...billForm,
                        baseRent: Number(e.target.value),
                        paidAmount:
                          Number(e.target.value) +
                          billForm.liftFee +
                          billForm.extraCharge +
                          billForm.previousDue,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">লিফট সার্ভিস চার্জ (৳)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={billForm.liftFee}
                    onChange={(e) =>
                      setBillForm({
                        ...billForm,
                        liftFee: Number(e.target.value),
                        paidAmount:
                          billForm.baseRent +
                          Number(e.target.value) +
                          billForm.extraCharge +
                          billForm.previousDue,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Extra / Hidden Charge Section */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-blue-950">
                    অতিরিক্ত / হিডেন চার্জ (Extra Charge):
                  </label>
                  <span className="text-[10px] bg-blue-200/80 text-blue-900 font-bold px-2 py-0.5 rounded">
                    ঐচ্ছিক চার্জ
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-slate-600 block mb-1">চার্জের পরিমাণ (৳):</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={billForm.extraCharge}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBillForm({
                          ...billForm,
                          extraCharge: val,
                          paidAmount: billForm.baseRent + billForm.liftFee + val + billForm.previousDue,
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block mb-1">চার্জের খাত / নাম:</span>
                    <input
                      type="text"
                      placeholder="যেমন: সার্ভিস / বিবিধ চার্জ"
                      value={billForm.extraChargeLabel}
                      onChange={(e) => setBillForm({ ...billForm, extraChargeLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-bold text-blue-900">
                  <input
                    type="checkbox"
                    checked={billForm.applyExtraToAll}
                    onChange={(e) => setBillForm({ ...billForm, applyExtraToAll: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-900"
                  />
                  <span>ভবনের সকল ফ্ল্যাটেও এই অতিরিক্ত চার্জ প্রয়োগ করুন</span>
                </label>
              </div>

              {/* Previous Due (Admin set manually) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    পূর্বের বকেয়া (Previous Due — ম্যানুয়ালি নির্ধারিত):
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ম্যানুয়াল এন্ট্রি
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-base">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={billForm.previousDue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setBillForm({
                        ...billForm,
                        previousDue: val,
                        paidAmount: billForm.baseRent + billForm.liftFee + billForm.extraCharge + val,
                      });
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-black text-red-700 focus:bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Live Calculation Box */}
              {(() => {
                const totalPayable =
                  billForm.baseRent +
                  billForm.liftFee +
                  billForm.extraCharge +
                  billForm.previousDue;
                const balanceDue = Math.max(0, totalPayable - billForm.paidAmount);

                return (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>মূল ভাড়া + লিফট চার্জ:</span>
                      <span className="font-mono font-bold">
                        {formatMoney(billForm.baseRent + billForm.liftFee)}
                      </span>
                    </div>
                    {billForm.extraCharge > 0 && (
                      <div className="flex justify-between text-blue-300">
                        <span>অতিরিক্ত চার্জ ({billForm.extraChargeLabel}):</span>
                        <span className="font-mono font-bold">+{formatMoney(billForm.extraCharge)}</span>
                      </div>
                    )}
                    {billForm.previousDue > 0 && (
                      <div className="flex justify-between text-red-300">
                        <span>পূর্বের বকেয়া:</span>
                        <span className="font-mono font-bold">+{formatMoney(billForm.previousDue)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700 flex justify-between text-sm font-black text-amber-300">
                      <span>সর্বমোট প্রদেয় বিল (Total Payable):</span>
                      <span className="font-mono text-base">{formatMoney(totalPayable)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                      <span className="font-bold text-emerald-300">প্রাপ্ত / পরিশোধিত টাকা:</span>
                      <input
                        type="number"
                        min="0"
                        value={billForm.paidAmount}
                        onChange={(e) => setBillForm({ ...billForm, paidAmount: Number(e.target.value) })}
                        className="w-32 py-1 px-2.5 bg-slate-800 border border-emerald-500 rounded-lg text-emerald-400 font-mono font-black text-right text-sm focus:outline-none"
                      />
                    </div>
                    {balanceDue > 0 ? (
                      <div className="flex justify-between text-red-400 font-bold pt-1">
                        <span>অবশিষ্ট বকেয়া (Balance Due):</span>
                        <span className="font-mono">{formatMoney(balanceDue)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-emerald-400 font-bold pt-1">
                        <span>অবস্থা:</span>
                        <span>সম্পূর্ণ পরিশোধিত (Paid)</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Payment Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পেমেন্ট মাধ্যম</label>
                  <select
                    value={billForm.paymentMethod}
                    onChange={(e) => setBillForm({ ...billForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  >
                    <option value="CASH">ক্যাশ (নগদ টাকা)</option>
                    <option value="BKASH">bKash (বিকাশ)</option>
                    <option value="NAGAD">Nagad (নগদ)</option>
                    <option value="ROCKET">Rocket (রকেট)</option>
                    <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার</option>
                    <option value="CHEQUE">চেক</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    রেফারেন্স / TrxID (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: Trx-928374"
                    value={billForm.referenceNo}
                    onChange={(e) => setBillForm({ ...billForm, referenceNo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBillReportModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs transition shadow-md cursor-pointer min-h-[44px] inline-flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>বিল সংরক্ষণ ও মানি রিসিট দেখুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSWORD CONFIRMATION MODAL (CONFIRM ANY DATA CHANGE)                      */}
      {/* ========================================================================= */}
      {passwordModalOpen && pendingAction && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-blue-900 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-900">
              <Lock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2 mb-5">
              <span className="px-3 py-0.5 rounded-full font-black text-[11px] uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                নিরাপত্তা যাচাইকরণ (Security Confirmation)
              </span>
              <h3 className="text-lg font-black text-slate-900">
                {pendingAction.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                {pendingAction.description}
              </p>
            </div>

            <form onSubmit={handleVerifyPasswordAndExecute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <span>তথ্য পরিবর্তন নিশ্চিত করতে অ্যাডমিন পাসওয়ার্ড দিন:</span>
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    if (passwordVerificationError) setPasswordVerificationError('');
                  }}
                  placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-medium focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20 min-h-[44px]"
                />
                {passwordVerificationError && (
                  <p className="text-xs font-bold text-red-600 mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                    {passwordVerificationError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPendingAction(null);
                    setConfirmPasswordInput('');
                    setPasswordVerificationError('');
                  }}
                  disabled={isVerifyingPassword}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer min-h-[44px]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPassword || !confirmPasswordInput}
                  className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-black text-xs transition shadow-md cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                >
                  {isVerifyingPassword ? (
                    <span>যাচাই হচ্ছে...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>পাসওয়ার্ড দিয়ে নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEIPT MODAL (STANDALONE OFFICIAL PRINT & DOWNLOAD)                      */}
      {/* ========================================================================= */}
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
