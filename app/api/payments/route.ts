import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentSession, requireAdminSession } from '@/lib/auth';
import { recordPayment } from '@/lib/billing';

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const flatCode = searchParams.get('flatCode');

    const where: any = { isDeleted: false };

    // If tenant, restrict strictly to their flat
    if (session.role === 'TENANT') {
      if (!session.flatId) {
        return NextResponse.json({ success: true, payments: [] });
      }
      where.flatId = session.flatId;
    } else if (flatCode) {
      where.flat = { code: flatCode };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paidOn: 'desc' },
      include: {
        flat: {
          include: {
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

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const { flatId, month, amount, method, referenceNo, notes } = body;

    if (!flatId || !month || !amount) {
      return NextResponse.json({ error: 'Flat, month, and amount are required' }, { status: 400 });
    }

    const payment = await recordPayment({
      flatId,
      month,
      amount: Number(amount),
      method: method || 'CASH',
      referenceNo,
      receivedByUserId: session.userId,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
