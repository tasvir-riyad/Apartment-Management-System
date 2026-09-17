import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentSession, requireAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        flat: {
          include: { floor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, vehicles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { flatId, vehicleType, brandModel, registrationNo, color, ownerName, slotLabel } = body;

    const targetFlatId = session.role === 'TENANT' ? session.flatId : flatId;

    if (!targetFlatId || !registrationNo || !ownerName) {
      return NextResponse.json({ error: 'Flat, Registration No, and Owner Name are required' }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        flatId: targetFlatId,
        vehicleType: vehicleType || 'MOTORCYCLE',
        brandModel: brandModel || null,
        registrationNo,
        color: color || null,
        ownerName,
        slotLabel: slotLabel || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
