import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';
import { amountInBengaliWords } from '@/lib/numbers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ receiptNo: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiptNo } = await params;

    const payment = await prisma.payment.findUnique({
      where: { receiptNo },
      include: {
        flat: {
          include: {
            floor: true,
            leases: {
              where: { status: 'ACTIVE' },
              include: { tenant: true },
            },
          },
        },
        receivedByUser: {
          select: { username: true, email: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    // Role check: if tenant, only allowed to view their own flat's receipts
    if (session.role === 'TENANT' && session.flatId !== payment.flatId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rent charge breakdown for the month
    const rentCharge = await prisma.rentCharge.findUnique({
      where: {
        flatId_month: {
          flatId: payment.flatId,
          month: payment.month,
        },
      },
    });

    const tenant = payment.flat.leases[0]?.tenant;

    // Try parsing notes if JSON
    let meta: any = null;
    if (payment.notes) {
      try {
        meta = JSON.parse(payment.notes);
      } catch (e) {
        meta = null;
      }
    }

    const baseRentPortion = meta?.baseRent ?? rentCharge?.rentAmount ?? payment.flat.baseRent;
    const liftPortion = meta?.liftFee ?? rentCharge?.liftAmount ?? payment.flat.liftFee;
    const extraCharge = meta?.extraCharge ?? 0;
    const extraChargeLabel = meta?.extraChargeLabel || 'অতিরিক্ত সার্ভিস চার্জ';
    const previousDue = meta?.previousDue ?? 0;
    const totalPayable = meta?.totalPayable ?? (baseRentPortion + liftPortion + extraCharge + previousDue);
    const balanceDue = meta?.balanceDue ?? Math.max(0, totalPayable - payment.amount);

    const receiptData = {
      receiptNo: payment.receiptNo,
      flatCode: payment.flat.code,
      floorEn: payment.flat.floor.labelEn,
      floorBn: payment.flat.floor.labelBn,
      tenantNameBn: meta?.tenantName || tenant?.fullNameBn || 'সম্মানিত ভাড়াটিয়া',
      tenantNameEn: tenant?.fullNameEn || 'Tenant',
      tenantPhone: meta?.tenantPhone || tenant?.phone || '',
      month: payment.month,
      paidOn: payment.paidOn,
      formattedDate: meta?.formattedDate || null,
      billingPeriod: meta?.billingPeriod || payment.month,
      day: meta?.day || null,
      monthName: meta?.monthName || null,
      year: meta?.year || null,
      method: meta?.paymentMethod || payment.method,
      referenceNo: meta?.referenceNo || payment.referenceNo,
      notes: meta?.adminNote || (typeof payment.notes === 'string' && !meta ? payment.notes : ''),
      amount: payment.amount,
      amountInWordsBn: amountInBengaliWords(payment.amount),
      baseRentPortion,
      liftPortion,
      extraCharge,
      extraChargeLabel,
      previousDue,
      totalPayable,
      paidAmount: payment.amount,
      balanceDue,
      building: {
        nameBn: 'সাঈদী টাওয়ার',
        nameEn: 'Sayedi Tower',
        addressBn: 'চৌধুরী সড়ক, বোয়ালিয়ারকুল, লোহাগাড়া, চট্টগ্রাম',
        addressEn: 'Chowdhury Road, Boaliarkul, Lohagara, Chattogram',
        phoneOwner: '01815826053',
        phoneSecondary: '01632-443446',
      },
    };

    return NextResponse.json({ success: true, receipt: receiptData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
