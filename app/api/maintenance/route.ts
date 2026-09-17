import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const where = session.role === 'TENANT' && session.flatId ? { flatId: session.flatId } : {};

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        flat: {
          include: { floor: true },
        },
      },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { flatId, title, description, priority } = body;

    const targetFlatId = session.role === 'TENANT' ? session.flatId : flatId;
    if (!targetFlatId || !title || !description) {
      return NextResponse.json({ error: 'Flat, Title, and Description are required' }, { status: 400 });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        flatId: targetFlatId,
        title,
        description,
        priority: priority || 'NORMAL',
        status: 'OPEN',
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminNote } = body;

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNote !== undefined && { adminNote }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
