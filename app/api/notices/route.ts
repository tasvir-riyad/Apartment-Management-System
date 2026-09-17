import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
    return NextResponse.json({ success: true, notices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const { titleBn, titleEn, body: noticeBody, audience, targetFloor, isPinned } = body;

    if (!titleBn || !noticeBody) {
      return NextResponse.json({ error: 'Title (BN) and Body are required' }, { status: 400 });
    }

    const notice = await prisma.notice.create({
      data: {
        titleBn,
        titleEn: titleEn || titleBn,
        body: noticeBody,
        audience: audience || 'ALL',
        targetFloor: targetFloor ? Number(targetFloor) : null,
        isPinned: !!isPinned,
      },
    });

    return NextResponse.json({ success: true, notice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
