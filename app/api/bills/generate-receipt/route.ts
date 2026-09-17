import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();

    const {
      flatId,
      tenantName,
      tenantPhone,
      day,
      monthName,
      year,
      billingMonth, // Format: YYYY-MM
      baseRent,
      liftFee,
      extraCharge = 0,
      extraChargeLabel = 'অতিরিক্ত সার্ভিস ও বিবিধ চার্জ',
      applyExtraToAll = false,
      previousDue = 0,
      paidAmount,
      paymentMethod = 'CASH',
      referenceNo = '',
      adminNote = '',
    } = body;

    if (!flatId) {
      return NextResponse.json({ error: 'ফ্ল্যাট নির্বাচন আবশ্যক' }, { status: 400 });
    }

    const flat = await prisma.flat.findUnique({
      where: { id: flatId },
      include: {
        floor: true,
        leases: {
          where: { status: 'ACTIVE' },
          include: { tenant: true },
        },
      },
    });

    if (!flat) {
      return NextResponse.json({ error: 'ফ্ল্যাট পাওয়া যায়নি' }, { status: 404 });
    }

    const baseRentNum = Number(baseRent ?? flat.baseRent);
    const liftFeeNum = Number(liftFee ?? flat.liftFee);
    const extraChargeNum = Number(extraCharge ?? 0);
    const prevDueNum = Number(previousDue ?? 0);

    const totalPayable = baseRentNum + liftFeeNum + extraChargeNum + prevDueNum;
    const paidAmountNum = Number(paidAmount !== undefined ? paidAmount : totalPayable);
    const balanceDue = Math.max(0, totalPayable - paidAmountNum);

    const targetMonth =
      billingMonth ||
      `${year || new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Bulk Extra Charge application if selected
    if (applyExtraToAll && extraChargeNum > 0) {
      const allRentable = await prisma.flat.findMany({
        where: { type: { not: 'OWNER' } },
        select: { id: true },
      });

      for (const rf of allRentable) {
        if (rf.id !== flatId) {
          await prisma.extraCharge.create({
            data: {
              flatId: rf.id,
              month: targetMonth,
              category: 'SERVICE',
              label: extraChargeLabel,
              amount: extraChargeNum,
              status: 'UNPAID',
            },
          });
        }
      }
    }

    // Save extra charge for this flat if > 0
    if (extraChargeNum > 0) {
      await prisma.extraCharge.create({
        data: {
          flatId,
          month: targetMonth,
          category: 'SERVICE',
          label: extraChargeLabel,
          amount: extraChargeNum,
          status: paidAmountNum >= totalPayable ? 'PAID' : 'PARTIAL',
        },
      });
    }

    // Generate unique receipt number: ST-YYYYMM-FLAT-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `ST-${targetMonth.replace('-', '')}-${flat.code}-${randomSuffix}`;

    // Format display date
    const now = new Date();
    const finalDay = day || now.getDate();
    const finalMonthName = monthName || 'সেপ্টেম্বর';
    const finalYear = year || now.getFullYear();
    const formattedDate = `${finalDay} ${finalMonthName} ${finalYear}`;

    // Complete breakdown metadata stored as JSON in payment notes
    const receiptMeta = {
      isCustomReport: true,
      tenantName: tenantName?.trim() || flat.leases[0]?.tenant?.fullNameBn || 'সম্মানিত বাসিন্দা',
      tenantPhone: tenantPhone || flat.leases[0]?.tenant?.phone || '',
      flatCode: flat.code,
      floorBn: flat.floor.labelBn,
      floorEn: flat.floor.labelEn,
      day: finalDay,
      monthName: finalMonthName,
      year: finalYear,
      formattedDate,
      billingPeriod: `${finalMonthName} ${finalYear}`,
      baseRent: baseRentNum,
      liftFee: liftFeeNum,
      extraCharge: extraChargeNum,
      extraChargeLabel,
      previousDue: prevDueNum,
      totalPayable,
      paidAmount: paidAmountNum,
      balanceDue,
      paymentMethod,
      referenceNo,
      adminNote,
    };

    const payment = await prisma.payment.create({
      data: {
        flatId,
        month: targetMonth,
        amount: paidAmountNum,
        paidOn: new Date(),
        method: paymentMethod,
        referenceNo: referenceNo || null,
        receiptNo,
        receivedByUserId: session.userId,
        notes: JSON.stringify(receiptMeta),
        status: 'APPROVED',
      },
    });

    // Update RentCharge status
    const existingRentCharge = await prisma.rentCharge.findUnique({
      where: {
        flatId_month: {
          flatId,
          month: targetMonth,
        },
      },
    });

    if (existingRentCharge) {
      const newPaid = existingRentCharge.paidAmount + paidAmountNum;
      await prisma.rentCharge.update({
        where: { id: existingRentCharge.id },
        data: {
          paidAmount: newPaid,
          status: newPaid >= existingRentCharge.amount ? 'PAID' : 'PARTIAL',
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'GENERATE_CUSTOM_RECEIPT',
        entity: 'PAYMENT',
        entityId: payment.id,
        details: JSON.stringify({
          receiptNo,
          flatCode: flat.code,
          tenantName: receiptMeta.tenantName,
          totalPayable,
          paidAmount: paidAmountNum,
          previousDue: prevDueNum,
          extraCharge: extraChargeNum,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `ফ্ল্যাট ${flat.code} এর জন্য অফিসিয়াল মানি রিসিট নং ${receiptNo} সফলভাবে তৈরি হয়েছে।`,
      receiptNo,
      payment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
