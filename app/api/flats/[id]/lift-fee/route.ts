import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';
import { updateFlatLiftFee } from '@/lib/billing';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const body = await req.json();
    const { liftFee } = body;

    if (liftFee === undefined || liftFee === null || isNaN(Number(liftFee))) {
      return NextResponse.json({ error: 'Valid lift fee amount is required' }, { status: 400 });
    }

    const updated = await updateFlatLiftFee(id, Number(liftFee), session.userId);

    return NextResponse.json({
      success: true,
      message: `Lift fee for flat ${updated.code} set to ৳${updated.liftFee}`,
      flat: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
