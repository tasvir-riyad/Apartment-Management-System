import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';
import { calculateFlatBalance } from '@/lib/billing';

export async function GET() {
  try {
    await requireAdminSession();

    const flats = await prisma.flat.findMany({
      orderBy: { code: 'asc' },
    });

    const flatSummaries = await Promise.all(
      flats.map((flat) => calculateFlatBalance(flat.id))
    );

    // Aggregate statistics
    let totalExpectedMonthly = 0;
    let totalDueOverall = 0;
    let totalPaidOverall = 0;
    let flatsOverThresholdCount = 0;

    for (const s of flatSummaries) {
      if (s.type !== 'OWNER') {
        totalExpectedMonthly += s.baseRent + s.liftFee;
      }
      totalDueOverall += s.totalDue;
      totalPaidOverall += s.totalPaid;
      if (s.isOverdueThreshold) {
        flatsOverThresholdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalExpectedMonthly,
        totalDueOverall,
        totalPaidOverall,
        flatsOverThresholdCount,
        threshold: 30000,
      },
      flats: flatSummaries,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
