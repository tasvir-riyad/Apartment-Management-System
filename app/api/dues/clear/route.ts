import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const { flatId, action = 'CLEAR_ALL', amount = 0, note = '' } = body;

    if (!flatId) {
      return NextResponse.json({ error: 'Flat ID is required' }, { status: 400 });
    }

    const flat = await prisma.flat.findUnique({
      where: { id: flatId },
      include: { tenants: { where: { isActive: true }, take: 1 } },
    });

    if (!flat) {
      return NextResponse.json({ error: 'ফ্ল্যাট পাওয়া যায়নি' }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNo = `PAY-${flat.code}-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (action === 'CLEAR_ALL') {
      // Find all unpaid or partial rent charges
      const rentCharges = await prisma.rentCharge.findMany({
        where: { flatId, status: { in: ['UNPAID', 'PARTIAL'] } },
      });

      let totalCleared = 0;
      for (const rc of rentCharges) {
        const remaining = rc.amount - rc.paidAmount;
        totalCleared += remaining;
        await prisma.rentCharge.update({
          where: { id: rc.id },
          data: { status: 'PAID', paidAmount: rc.amount },
        });
      }

      // Find all unpaid extra charges
      const extraCharges = await prisma.extraCharge.findMany({
        where: { flatId, status: { in: ['UNPAID', 'PARTIAL'] } },
      });

      for (const ec of extraCharges) {
        totalCleared += ec.amount;
        await prisma.extraCharge.update({
          where: { id: ec.id },
          data: { status: 'PAID' },
        });
      }

      // Record a payment entry
      await prisma.payment.create({
        data: {
          flatId,
          month: currentMonth,
          amount: totalCleared > 0 ? totalCleared : 0,
          paidOn: new Date(),
          method: 'CASH',
          receiptNo,
          status: 'APPROVED',
          notes: note || 'সম্পূর্ণ বকেয়া পরিশোধ (Clear All Dues)',
          receivedByUserId: session.userId,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'CLEAR_DUES',
          entity: 'FLAT',
          entityId: flatId,
          details: JSON.stringify({ flatCode: flat.code, totalCleared }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${flat.code} ফ্ল্যাটের বকেয়া সফলভাবে পরিশোধিত হিসেবে চিহ্নিত হয়েছে।`,
        totalCleared,
      });
    } else if (action === 'PARTIAL') {
      const payAmount = Number(amount) || 0;
      if (payAmount <= 0) {
        return NextResponse.json({ error: 'পরিশোধের পরিমাণ উল্লেখ করুন' }, { status: 400 });
      }

      await prisma.payment.create({
        data: {
          flatId,
          month: currentMonth,
          amount: payAmount,
          paidOn: new Date(),
          method: 'CASH',
          receiptNo,
          status: 'APPROVED',
          notes: note || `আংশিক বকেয়া পরিশোধ (৳${payAmount.toLocaleString('en-IN')})`,
          receivedByUserId: session.userId,
        },
      });

      // Allocate across unpaid rent charges
      let remainingToApply = payAmount;
      const rentCharges = await prisma.rentCharge.findMany({
        where: { flatId, status: { in: ['UNPAID', 'PARTIAL'] } },
        orderBy: { month: 'asc' },
      });

      for (const rc of rentCharges) {
        if (remainingToApply <= 0) break;
        const due = rc.amount - rc.paidAmount;
        if (remainingToApply >= due) {
          await prisma.rentCharge.update({
            where: { id: rc.id },
            data: { status: 'PAID', paidAmount: rc.amount },
          });
          remainingToApply -= due;
        } else {
          await prisma.rentCharge.update({
            where: { id: rc.id },
            data: { status: 'PARTIAL', paidAmount: rc.paidAmount + remainingToApply },
          });
          remainingToApply = 0;
        }
      }

      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'PARTIAL_PAYMENT',
          entity: 'FLAT',
          entityId: flatId,
          details: JSON.stringify({ flatCode: flat.code, paidAmount: payAmount }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${flat.code} ফ্ল্যাটের ৳${payAmount.toLocaleString('en-IN')} আংশিক পরিশোধ জমা হয়েছে।`,
        paidAmount: payAmount,
      });
    }

    return NextResponse.json({ error: 'অকার্যকর রিকোয়েস্ট' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
