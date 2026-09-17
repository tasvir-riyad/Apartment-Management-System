import prisma from './prisma';

export interface FlatBalanceSummary {
  flatId: string;
  flatCode: string;
  floorLabelEn: string;
  floorLabelBn: string;
  type: string;
  baseRent: number;
  liftFee: number;
  tenantNameBn?: string;
  tenantNameEn?: string;
  tenantPhone?: string;
  totalRentCharges: number;
  totalLiftCharges: number;
  totalExtraCharges: number;
  totalCharges: number;
  totalPaid: number;
  totalDue: number; // Balance owed
  advanceBalance: number; // Excess paid
  isOverdueThreshold: boolean;
  status: string; // PAID, PARTIAL, OVERDUE, VACANT, OWNER
}

/**
 * Idempotent monthly charge generation.
 * Generates RentCharge for each active rentable flat for the given month (format: YYYY-MM).
 * Combines flat.baseRent + flat.liftFee.
 * Excludes owner unit (E2-E3).
 */
export async function generateMonthlyCharges(month: string, adminUserId?: string) {
  // 1. Fetch setting for rent due day (default 9)
  const dueDaySetting = await prisma.setting.findUnique({ where: { key: 'rent_due_day' } });
  const dueDay = dueDaySetting ? parseInt(dueDaySetting.value, 10) : 9;

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const dueDate = new Date(Date.UTC(year, m - 1, dueDay, 18, 0, 0)); // 00:00 Asia/Dhaka is 18:00 UTC previous day

  // 2. Fetch all rentable flats (exclude OWNER units)
  const flats = await prisma.flat.findMany({
    where: {
      type: { not: 'OWNER' },
    },
    include: {
      leases: {
        where: { status: 'ACTIVE' },
        include: { tenant: true },
      },
    },
  });

  const results = {
    month,
    generatedCount: 0,
    alreadyExistingCount: 0,
    skippedCount: 0,
    charges: [] as any[],
  };

  for (const flat of flats) {
    // Check if already generated for this month (idempotency check)
    const existing = await prisma.rentCharge.findUnique({
      where: {
        flatId_month: {
          flatId: flat.id,
          month,
        },
      },
    });

    if (existing) {
      results.alreadyExistingCount++;
      continue;
    }

    const activeLease = flat.leases[0];
    const rentAmount = activeLease ? activeLease.monthlyRent : flat.baseRent;
    const liftAmount = activeLease ? activeLease.monthlyLiftFee : flat.liftFee;
    const totalAmount = rentAmount + liftAmount;

    const charge = await prisma.rentCharge.create({
      data: {
        flatId: flat.id,
        leaseId: activeLease ? activeLease.id : null,
        month,
        rentAmount,
        liftAmount,
        amount: totalAmount,
        dueDate,
        status: 'UNPAID',
        paidAmount: 0,
      },
    });

    results.generatedCount++;
    results.charges.push(charge);
  }

  // Audit log
  if (adminUserId) {
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'GENERATE_RENT_CHARGES',
        entity: 'RENT_CHARGE',
        details: JSON.stringify({
          month,
          generatedCount: results.generatedCount,
          alreadyExistingCount: results.alreadyExistingCount,
        }),
      },
    });
  }

  return results;
}

/**
 * Calculate the complete ledger balance and aging for a single flat.
 */
export async function calculateFlatBalance(flatId: string): Promise<FlatBalanceSummary> {
  const flat = await prisma.flat.findUnique({
    where: { id: flatId },
    include: {
      floor: true,
      leases: {
        where: { status: 'ACTIVE' },
        include: { tenant: true },
      },
      rentCharges: true,
      extraCharges: true,
      payments: {
        where: { status: 'APPROVED', isDeleted: false },
      },
    },
  });

  if (!flat) throw new Error('Flat not found');

  const activeTenant = flat.leases[0]?.tenant;

  let totalRentCharges = 0;
  let totalLiftCharges = 0;
  for (const rc of flat.rentCharges) {
    totalRentCharges += rc.rentAmount;
    totalLiftCharges += rc.liftAmount;
  }

  let totalExtraCharges = 0;
  for (const ec of flat.extraCharges) {
    totalExtraCharges += ec.amount;
  }

  let totalPaid = 0;
  for (const p of flat.payments) {
    totalPaid += p.amount;
  }

  const totalCharges = totalRentCharges + totalLiftCharges + totalExtraCharges;
  const netBalance = totalCharges - totalPaid;

  const totalDue = netBalance > 0 ? netBalance : 0;
  const advanceBalance = netBalance < 0 ? Math.abs(netBalance) : 0;

  // Threshold alert check (default 30,000)
  const threshold = 30000;
  const isOverdueThreshold = totalDue >= threshold;

  let displayStatus = 'PAID';
  if (flat.type === 'OWNER') {
    displayStatus = 'OWNER';
  } else if (flat.status === 'VACANT') {
    displayStatus = 'VACANT';
  } else if (totalDue === 0) {
    displayStatus = 'PAID';
  } else if (totalPaid > 0) {
    displayStatus = 'PARTIAL';
  } else {
    displayStatus = 'OVERDUE';
  }

  return {
    flatId: flat.id,
    flatCode: flat.code,
    floorLabelEn: flat.floor.labelEn,
    floorLabelBn: flat.floor.labelBn,
    type: flat.type,
    baseRent: flat.baseRent,
    liftFee: flat.liftFee,
    tenantNameBn: activeTenant?.fullNameBn,
    tenantNameEn: activeTenant?.fullNameEn,
    tenantPhone: activeTenant?.phone,
    totalRentCharges,
    totalLiftCharges,
    totalExtraCharges,
    totalCharges,
    totalPaid,
    totalDue,
    advanceBalance,
    isOverdueThreshold,
    status: displayStatus,
  };
}

/**
 * Update a flat's Lift Fee.
 * Admin can manually set how much each flat pays for the Lift (initial 0).
 */
export async function updateFlatLiftFee(flatId: string, liftFee: number, adminUserId?: string) {
  const flat = await prisma.flat.findUnique({ where: { id: flatId } });
  if (!flat) throw new Error('Flat not found');

  const oldLiftFee = flat.liftFee;

  // Update flat default
  const updatedFlat = await prisma.flat.update({
    where: { id: flatId },
    data: { liftFee },
  });

  // Update active lease snapshot if present
  await prisma.lease.updateMany({
    where: { flatId, status: 'ACTIVE' },
    data: { monthlyLiftFee: liftFee },
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      actorId: adminUserId || null,
      action: 'UPDATE_LIFT_FEE',
      entity: 'FLAT',
      entityId: flatId,
      details: JSON.stringify({
        flatCode: flat.code,
        previousLiftFee: oldLiftFee,
        newLiftFee: liftFee,
      }),
    },
  });

  return updatedFlat;
}

/**
 * Record a payment, allocate to rent charges oldest first, generate unique receipt number.
 */
export async function recordPayment(data: {
  flatId: string;
  month: string;
  amount: number;
  method: string;
  referenceNo?: string;
  receivedByUserId?: string;
  notes?: string;
}) {
  const flat = await prisma.flat.findUnique({ where: { id: data.flatId } });
  if (!flat) throw new Error('Flat not found');

  // Unique receipt number: REC-YYYYMM-FLAT-XXX
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const receiptNo = `REC-${data.month.replace('-', '')}-${flat.code}-${randomSuffix}`;

  const payment = await prisma.payment.create({
    data: {
      flatId: data.flatId,
      month: data.month,
      amount: data.amount,
      paidOn: new Date(),
      method: data.method,
      referenceNo: data.referenceNo || null,
      receiptNo,
      receivedByUserId: data.receivedByUserId || null,
      notes: data.notes || null,
      status: 'APPROVED',
    },
  });

  // Update RentCharge status for the targeted month or unpaid charges
  const charge = await prisma.rentCharge.findUnique({
    where: {
      flatId_month: {
        flatId: data.flatId,
        month: data.month,
      },
    },
  });

  if (charge) {
    const newPaid = charge.paidAmount + data.amount;
    let newStatus = 'PARTIAL';
    if (newPaid >= charge.amount) {
      newStatus = 'PAID';
    }
    await prisma.rentCharge.update({
      where: { id: charge.id },
      data: {
        paidAmount: newPaid,
        status: newStatus,
      },
    });
  }

  // Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: data.receivedByUserId || null,
      action: 'RECORD_PAYMENT',
      entity: 'PAYMENT',
      entityId: payment.id,
      details: JSON.stringify({
        receiptNo,
        amount: data.amount,
        method: data.method,
        flatCode: flat.code,
        month: data.month,
      }),
    },
  });

  return payment;
}
