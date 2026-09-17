import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const { mode, flatIds, liftFee, action = 'SET' } = body;

    const amount = Number(liftFee);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: 'সঠিক লিফট ফি লিখুন' }, { status: 400 });
    }

    let targetFlats: any[] = [];

    if (mode === 'ALL') {
      // All rentable flats excluding owner unit
      targetFlats = await prisma.flat.findMany({
        where: { type: { not: 'OWNER' } },
        select: { id: true, code: true, liftFee: true },
      });
    } else if (mode === 'SELECTED' && Array.isArray(flatIds) && flatIds.length > 0) {
      targetFlats = await prisma.flat.findMany({
        where: { id: { in: flatIds } },
        select: { id: true, code: true, liftFee: true },
      });
    } else {
      return NextResponse.json({ error: 'ফ্ল্যাট নির্বাচন করুন' }, { status: 400 });
    }

    if (targetFlats.length === 0) {
      return NextResponse.json({ error: 'কোনো ফ্ল্যাট পাওয়া যায়নি' }, { status: 404 });
    }

    // Process updates
    for (const flat of targetFlats) {
      const newFee = action === 'ADD' ? flat.liftFee + amount : amount;
      await prisma.flat.update({
        where: { id: flat.id },
        data: { liftFee: newFee },
      });

      await prisma.lease.updateMany({
        where: { flatId: flat.id, status: 'ACTIVE' },
        data: { monthlyLiftFee: newFee },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'BATCH_UPDATE_LIFT_FEE',
        entity: 'FLAT',
        details: JSON.stringify({
          mode,
          action,
          amount,
          affectedCount: targetFlats.length,
          flatCodes: targetFlats.map((f) => f.code),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${targetFlats.length} টি ফ্ল্যাটে লিফট চার্জ সফলভাবে হালনাগাদ করা হয়েছে।`,
      affectedCount: targetFlats.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
