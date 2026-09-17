import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const { flatId, applyToAll = false, label, amount, month, notes } = body;

    const chargeAmount = Number(amount);
    if (isNaN(chargeAmount) || chargeAmount < 0) {
      return NextResponse.json({ error: 'সঠিক টাকার পরিমাণ দিন' }, { status: 400 });
    }

    const chargeLabel = label?.trim() || 'অতিরিক্ত সার্ভিস চার্জ';
    const billingMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    if (applyToAll) {
      const rentableFlats = await prisma.flat.findMany({
        where: { type: { not: 'OWNER' } },
        select: { id: true, code: true },
      });

      for (const f of rentableFlats) {
        await prisma.extraCharge.create({
          data: {
            flatId: f.id,
            month: billingMonth,
            category: 'SERVICE',
            label: chargeLabel,
            amount: chargeAmount,
            notes: notes || null,
            status: 'UNPAID',
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'BULK_EXTRA_CHARGE',
          entity: 'EXTRA_CHARGE',
          details: JSON.stringify({
            label: chargeLabel,
            amount: chargeAmount,
            month: billingMonth,
            flatsCount: rentableFlats.length,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `সকল ${rentableFlats.length} টি ফ্ল্যাটে ৳${chargeAmount} অতিরিক্ত চার্জ যুক্ত করা হয়েছে।`,
      });
    } else {
      if (!flatId) {
        return NextResponse.json({ error: 'ফ্ল্যাট নির্বাচন করুন' }, { status: 400 });
      }

      const extra = await prisma.extraCharge.create({
        data: {
          flatId,
          month: billingMonth,
          category: 'SERVICE',
          label: chargeLabel,
          amount: chargeAmount,
          notes: notes || null,
          status: 'UNPAID',
        },
      });

      return NextResponse.json({
        success: true,
        message: `ফ্ল্যাটে ৳${chargeAmount} অতিরিক্ত চার্জ যুক্ত করা হয়েছে।`,
        extraCharge: extra,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
