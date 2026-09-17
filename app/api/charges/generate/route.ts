import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { generateMonthlyCharges } from '@/lib/billing';

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json().catch(() => ({}));
    
    // Default to current month in YYYY-MM format if not provided
    let month = body.month;
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const result = await generateMonthlyCharges(month, session.userId);

    return NextResponse.json({
      success: true,
      result,
      message: `Generated charges for ${result.generatedCount} flats (${result.alreadyExistingCount} already generated).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
