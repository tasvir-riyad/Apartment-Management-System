import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/Flat Code and password are required' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();

    // Check if the requested user is SayediTower and ensure it exists with the exact password
    if (trimmed.toLowerCase() === 'sayeditower') {
      let sayediAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { username: 'SayediTower' },
            { username: 'sayeditower' },
            { email: 'admin@sayeditower.com' },
          ],
        },
      });

      const targetHash = await bcrypt.hash('Enam6053@#', 12);

      if (!sayediAdmin) {
        sayediAdmin = await prisma.user.create({
          data: {
            username: 'SayediTower',
            email: 'admin@sayeditower.com',
            passwordHash: targetHash,
            role: 'SUPER_ADMIN',
            isActive: true,
          },
        });
      }

      const isMatch = await bcrypt.compare(password, sayediAdmin.passwordHash);
      if (!isMatch && password !== 'Enam6053@#') {
        return NextResponse.json(
          { error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' },
          { status: 401 }
        );
      }

      // If password matched 'Enam6053@#' directly but hash was older, update hash and username
      if (password === 'Enam6053@#' && sayediAdmin.username !== 'SayediTower') {
        sayediAdmin = await prisma.user.update({
          where: { id: sayediAdmin.id },
          data: {
            username: 'SayediTower',
            passwordHash: targetHash,
            role: 'SUPER_ADMIN',
            lastLoginAt: new Date(),
          },
        });
      } else {
        await prisma.user.update({
          where: { id: sayediAdmin.id },
          data: { lastLoginAt: new Date() },
        });
      }

      // Sign token
      const token = signSessionToken({
        userId: sayediAdmin.id,
        username: 'SayediTower',
        email: sayediAdmin.email,
        role: 'SUPER_ADMIN',
        flatId: null,
        flatCode: null,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: sayediAdmin.id,
          username: 'SayediTower',
          role: 'SUPER_ADMIN',
          flatCode: null,
        },
        redirectUrl: '/admin',
      });

      response.cookies.set('sayedi_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 1. Search for user by email or username (Admin only)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmed } },
          { email: { equals: trimmed } },
        ],
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
      include: { flat: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'অ্যাডমিন ইউজার পাওয়া যায়নি অথবা অনুমতি নেই' },
        { status: 401 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'ভুল পাসওয়ার্ড' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Sign token
    const token = signSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role as any,
      flatId: user.flatId,
      flatCode: user.flat?.code || null,
    });

    const redirectUrl =
      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
        ? '/admin'
        : '/tenant';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        flatCode: user.flat?.code || null,
      },
      redirectUrl,
    });

    // Set cookie
    response.cookies.set('sayedi_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
