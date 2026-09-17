import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const floors = await prisma.floor.findMany({
      orderBy: { level: 'desc' }, // Top to bottom (Level 8 Rooftop to Level 1 Ground)
      include: {
        flats: {
          orderBy: { code: 'asc' },
          include: {
            leases: {
              where: {
                status: 'ACTIVE',
                tenant: { isActive: true },
              },
              include: { tenant: true },
            },
            rentCharges: {
              orderBy: { month: 'desc' },
              take: 1,
            },
            payments: {
              orderBy: { paidOn: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, floors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const { id, baseRent, liftFee, bedrooms, bathrooms, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flat ID is required' }, { status: 400 });
    }

    const updated = await prisma.flat.update({
      where: { id },
      data: {
        ...(baseRent !== undefined && { baseRent: Number(baseRent) }),
        ...(liftFee !== undefined && { liftFee: Number(liftFee) }),
        ...(bedrooms !== undefined && { bedrooms: Number(bedrooms) }),
        ...(bathrooms !== undefined && { bathrooms: Number(bathrooms) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    // If base rent changed, update active lease as well
    if (baseRent !== undefined) {
      await prisma.lease.updateMany({
        where: { flatId: id, status: 'ACTIVE' },
        data: { monthlyRent: Number(baseRent) },
      });
    }

    // If lift fee changed, update active lease as well
    if (liftFee !== undefined) {
      await prisma.lease.updateMany({
        where: { flatId: id, status: 'ACTIVE' },
        data: { monthlyLiftFee: Number(liftFee) },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'UPDATE_FLAT',
        entity: 'FLAT',
        entityId: id,
        details: JSON.stringify({ baseRent, liftFee, status }),
      },
    });

    return NextResponse.json({ success: true, flat: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
