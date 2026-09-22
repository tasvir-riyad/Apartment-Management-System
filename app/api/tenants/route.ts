import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await requireAdminSession();
    const tenants = await prisma.tenant.findMany({
      orderBy: { moveInDate: 'desc' },
      include: {
        flat: {
          include: { floor: true },
        },
        leases: {
          where: { status: 'ACTIVE' },
        },
      },
    });
    return NextResponse.json({ success: true, tenants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const {
      flatId,
      fullNameBn,
      fullNameEn,
      phone,
      email,
      occupation,
      familyMembersCount,
      moveInDate,
      password,
    } = body;

    if (!flatId || !fullNameBn || !phone || !moveInDate) {
      return NextResponse.json(
        { error: 'Flat, Name (BN), Phone, and Move-in Date are required' },
        { status: 400 }
      );
    }

    const flat = await prisma.flat.findUnique({ where: { id: flatId } });
    if (!flat) return NextResponse.json({ error: 'Flat not found' }, { status: 404 });

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        flatId,
        fullNameBn,
        fullNameEn: fullNameEn || fullNameBn,
        phone,
        email: email || null,
        occupation: occupation || null,
        familyMembersCount: Number(familyMembersCount) || 1,
        moveInDate: new Date(moveInDate),
        isActive: true,
      },
    });

    // Create user login with flat code
    const initialPassword = password || 'tenant123';
    const passwordHash = await bcrypt.hash(initialPassword, 12);

    await prisma.user.upsert({
      where: { username: flat.code },
      update: {
        passwordHash,
        flatId,
        email: email || null,
        isActive: true,
      },
      create: {
        username: flat.code,
        email: email || null,
        passwordHash,
        role: 'TENANT',
        flatId,
        isActive: true,
      },
    });

    // Create active lease
    await prisma.lease.create({
      data: {
        flatId,
        tenantId: tenant.id,
        startDate: new Date(moveInDate),
        monthlyRent: flat.baseRent,
        monthlyLiftFee: flat.liftFee,
        securityDeposit: Number(body.advanceAmount || body.securityDeposit || 0),
        status: 'ACTIVE',
      },
    });

    // Mark flat as OCCUPIED
    await prisma.flat.update({
      where: { id: flatId },
      data: { status: 'OCCUPIED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'CREATE_TENANT',
        entity: 'TENANT',
        entityId: tenant.id,
        details: JSON.stringify({ flatCode: flat.code, tenantName: fullNameBn }),
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper: Complete removal of previous tenant data & vacate flat
async function removeTenantAndVacate(session: any, tenantId?: string, flatId?: string) {
  let targetTenant = null;
  if (tenantId) {
    targetTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { flat: true, leases: true },
    });
  } else if (flatId) {
    targetTenant = await prisma.tenant.findFirst({
      where: { flatId },
      orderBy: { createdAt: 'desc' },
      include: { flat: true, leases: true },
    });
  }

  const resolvedFlatId = targetTenant?.flatId || flatId;
  const flat = resolvedFlatId ? await prisma.flat.findUnique({ where: { id: resolvedFlatId } }) : null;

  if (targetTenant) {
    // Unlink leases from rent charges to prevent foreign key errors while keeping financial history
    const tenantLeaseIds = targetTenant.leases.map((l: any) => l.id);
    if (tenantLeaseIds.length > 0) {
      await prisma.rentCharge.updateMany({
        where: { leaseId: { in: tenantLeaseIds } },
        data: { leaseId: null },
      });

      // Delete leases for this tenant
      await prisma.lease.deleteMany({
        where: { id: { in: tenantLeaseIds } },
      });
    }

    // Delete uploaded documents for this tenant
    await prisma.document.deleteMany({
      where: { tenantId: targetTenant.id },
    });

    // Delete the tenant record completely
    await prisma.tenant.delete({
      where: { id: targetTenant.id },
    });
  }

  // Clean up any remaining leases for this flat
  if (resolvedFlatId) {
    const remainingLeases = await prisma.lease.findMany({
      where: { flatId: resolvedFlatId },
      select: { id: true },
    });
    const remainingLeaseIds = remainingLeases.map((l: any) => l.id);
    if (remainingLeaseIds.length > 0) {
      await prisma.rentCharge.updateMany({
        where: { leaseId: { in: remainingLeaseIds } },
        data: { leaseId: null },
      });
      await prisma.lease.deleteMany({
        where: { id: { in: remainingLeaseIds } },
      });
    }

    // Delete any documents associated with this flat
    await prisma.document.deleteMany({
      where: { flatId: resolvedFlatId },
    });

    // Also delete any remaining inactive/orphaned tenants for this flat
    await prisma.tenant.deleteMany({
      where: { flatId: resolvedFlatId },
    });

    // Update flat status to VACANT
    await prisma.flat.update({
      where: { id: resolvedFlatId },
      data: { status: 'VACANT' },
    });

    // Deactivate tenant portal user credentials for this flat
    await prisma.user.updateMany({
      where: { flatId: resolvedFlatId, role: 'TENANT' },
      data: { isActive: false },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: 'VACATE_TENANT_DATA_REMOVED',
      entity: 'FLAT',
      entityId: resolvedFlatId,
      details: JSON.stringify({
        flatCode: flat?.code,
        vacatedTenantName: targetTenant?.fullNameBn || 'N/A',
        vacatedTenantPhone: targetTenant?.phone || 'N/A',
        action: 'Previous tenant data removed, flat vacated and ready for new tenant info',
      }),
    },
  });

  return { success: true, message: 'ভাড়াটিয়ার পূর্বের সমস্ত তথ্য সফলভাবে মুছে ফেলা হয়েছে এবং ফ্ল্যাটটি খালি করা হয়েছে।' };
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const {
      action,
      tenantId,
      flatId,
      fullNameBn,
      fullNameEn,
      phone,
      altPhone,
      email,
      nationalId,
      occupation,
      permanentAddress,
      familyMembersCount,
      moveInDate,
      moveOutDate,
      advanceAmount,
      securityDeposit,
      isActive,
    } = body;

    // If action is explicitly VACATE or isActive is set to false (admin clicked "নামা")
    if (action === 'VACATE' || isActive === false) {
      const result = await removeTenantAndVacate(session, tenantId, flatId);
      return NextResponse.json(result);
    }

    let targetTenant = null;
    if (tenantId) {
      targetTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    } else if (flatId) {
      targetTenant = await prisma.tenant.findFirst({
        where: { flatId, isActive: true },
        orderBy: { moveInDate: 'desc' },
      });
    }

    if (!targetTenant) {
      // If no active tenant exists for this flat yet and admin provides name/phone, create one (উঠা)
      if (flatId && fullNameBn && phone) {
        const flat = await prisma.flat.findUnique({ where: { id: flatId } });
        if (!flat) return NextResponse.json({ error: 'ফ্ল্যাট পাওয়া যায়নি' }, { status: 404 });

        const effectiveMoveInDate = moveInDate ? new Date(moveInDate) : new Date();

        const newTenant = await prisma.tenant.create({
          data: {
            flatId,
            fullNameBn,
            fullNameEn: fullNameEn || fullNameBn,
            phone,
            altPhone: altPhone || null,
            email: email || null,
            nationalId: nationalId || null,
            occupation: occupation || null,
            permanentAddress: permanentAddress || null,
            familyMembersCount: Number(familyMembersCount) || 1,
            moveInDate: effectiveMoveInDate,
            isActive: true,
          },
        });

        // Create active lease for new tenant
        const depositVal = Number(advanceAmount !== undefined ? advanceAmount : (securityDeposit || 0));
        await prisma.lease.create({
          data: {
            flatId,
            tenantId: newTenant.id,
            startDate: effectiveMoveInDate,
            monthlyRent: flat.baseRent,
            monthlyLiftFee: flat.liftFee,
            securityDeposit: depositVal,
            status: 'ACTIVE',
          },
        });

        // Mark flat as OCCUPIED
        await prisma.flat.update({
          where: { id: flatId },
          data: { status: 'OCCUPIED' },
        });

        // Create/Update tenant login account with flat code
        const initialPassword = 'tenant123';
        const passwordHash = await bcrypt.hash(initialPassword, 12);
        await prisma.user.upsert({
          where: { username: flat.code },
          update: {
            passwordHash,
            flatId,
            email: email || null,
            isActive: true,
          },
          create: {
            username: flat.code,
            email: email || null,
            passwordHash,
            role: 'TENANT',
            flatId,
            isActive: true,
          },
        });

        // Audit Log
        await prisma.auditLog.create({
          data: {
            actorId: session.userId,
            action: 'CREATE_TENANT',
            entity: 'TENANT',
            entityId: newTenant.id,
            details: JSON.stringify({ flatCode: flat.code, tenantName: fullNameBn }),
          },
        });

        return NextResponse.json({ success: true, tenant: newTenant });
      }

      return NextResponse.json({ error: 'ভাড়াটিয়ার নাম ও মোবাইল নম্বর পূরণ করুন' }, { status: 400 });
    }

    const updatedData: any = {};
    if (fullNameBn !== undefined) updatedData.fullNameBn = fullNameBn;
    if (fullNameEn !== undefined) updatedData.fullNameEn = fullNameEn;
    if (phone !== undefined) updatedData.phone = phone;
    if (altPhone !== undefined) updatedData.altPhone = altPhone;
    if (email !== undefined) updatedData.email = email;
    if (nationalId !== undefined) updatedData.nationalId = nationalId;
    if (occupation !== undefined) updatedData.occupation = occupation;
    if (permanentAddress !== undefined) updatedData.permanentAddress = permanentAddress;
    if (familyMembersCount !== undefined) updatedData.familyMembersCount = Number(familyMembersCount);
    if (moveInDate) updatedData.moveInDate = new Date(moveInDate);
    if (moveOutDate !== undefined) updatedData.moveOutDate = moveOutDate ? new Date(moveOutDate) : null;
    if (isActive !== undefined) updatedData.isActive = Boolean(isActive);

    const updatedTenant = await prisma.tenant.update({
      where: { id: targetTenant.id },
      data: updatedData,
      include: { flat: true },
    });

    if (advanceAmount !== undefined || securityDeposit !== undefined) {
      const depositVal = Number(advanceAmount !== undefined ? advanceAmount : securityDeposit) || 0;
      const activeLease = await prisma.lease.findFirst({
        where: { tenantId: targetTenant.id, status: 'ACTIVE' },
      });
      if (activeLease) {
        await prisma.lease.update({
          where: { id: activeLease.id },
          data: { securityDeposit: depositVal },
        });
      } else {
        const flat = await prisma.flat.findUnique({ where: { id: targetTenant.flatId } });
        await prisma.lease.create({
          data: {
            flatId: targetTenant.flatId,
            tenantId: targetTenant.id,
            startDate: targetTenant.moveInDate || new Date(),
            monthlyRent: flat?.baseRent || 0,
            monthlyLiftFee: flat?.liftFee || 0,
            securityDeposit: depositVal,
            status: 'ACTIVE',
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'UPDATE_TENANT',
        entity: 'TENANT',
        entityId: updatedTenant.id,
        details: JSON.stringify(updatedData),
      },
    });

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Vacate tenant and completely purge previous tenant records for this flat
export async function DELETE(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const { tenantId, flatId } = body;

    if (!tenantId && !flatId) {
      return NextResponse.json({ error: 'Tenant ID or Flat ID is required' }, { status: 400 });
    }

    const result = await removeTenantAndVacate(session, tenantId, flatId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

