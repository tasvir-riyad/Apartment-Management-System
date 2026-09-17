import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function testFeatures() {
  console.log('--- Starting Admin Features Verification ---');

  // 1. Verify Admin user exists
  const admin = await prisma.user.findUnique({
    where: { username: 'admin@sayeditower.com' },
  });
  if (!admin) throw new Error('Admin user not found');
  console.log('✓ Admin user verified:', admin.username);

  // 2. Test updating individual flat rent
  const testFlat = await prisma.flat.findUnique({ where: { code: 'B2' } });
  if (!testFlat) throw new Error('Flat B2 not found');
  console.log('Current Flat B2 Rent:', testFlat.baseRent);

  const updatedRent = 13500;
  const updated = await prisma.flat.update({
    where: { id: testFlat.id },
    data: { baseRent: updatedRent },
  });
  console.log('✓ Flat B2 Rent successfully updated to:', updated.baseRent);

  // 3. Test Batch Lift Fee (ALL flats)
  const allRentable = await prisma.flat.findMany({
    where: { type: { not: 'OWNER' } },
  });
  console.log(`Found ${allRentable.length} rentable flats.`);

  const newBulkFee = 600;
  await prisma.flat.updateMany({
    where: { type: { not: 'OWNER' } },
    data: { liftFee: newBulkFee },
  });

  const sampleFlats = await prisma.flat.findMany({
    where: { code: { in: ['A1', 'B1', 'C1'] } },
  });
  for (const f of sampleFlats) {
    if (f.liftFee !== newBulkFee) throw new Error(`Bulk lift fee mismatch for ${f.code}`);
  }
  console.log('✓ Bulk Lift Fee successfully applied across flats: ৳' + newBulkFee);

  // 4. Test Custom Bill Report & Professional Money Receipt Generation
  const targetFlat = sampleFlats[0];
  const testReceiptMeta = {
    isCustomReport: true,
    tenantName: 'জনাব মোহাম্মদ নাসির উদ্দিন',
    tenantPhone: '01819-998877',
    flatCode: targetFlat.code,
    floorBn: 'নিচতলা',
    floorEn: 'Ground Floor',
    day: 17,
    monthName: 'সেপ্টেম্বর',
    year: 2026,
    formattedDate: '১৭ সেপ্টেম্বর ২০২৬',
    billingPeriod: 'সেপ্টেম্বর ২০২৬',
    baseRent: targetFlat.baseRent,
    liftFee: 600,
    extraCharge: 400,
    extraChargeLabel: 'কমন জেনারেটর ও পরিচ্ছন্নতা ফি',
    previousDue: 1500, // Manually entered previous due
    totalPayable: targetFlat.baseRent + 600 + 400 + 1500,
    paidAmount: targetFlat.baseRent + 600 + 400 + 1500,
    balanceDue: 0,
    paymentMethod: 'BKASH',
    referenceNo: 'TRX-BK-99281',
    adminNote: 'ভাড়াটিয়া সময়মতো পরিশোধ করেছেন',
  };

  const receiptNo = `ST-202609-${targetFlat.code}-9988`;
  const payment = await prisma.payment.create({
    data: {
      flatId: targetFlat.id,
      month: '2026-09',
      amount: testReceiptMeta.paidAmount,
      paidOn: new Date(),
      method: testReceiptMeta.paymentMethod,
      referenceNo: testReceiptMeta.referenceNo,
      receiptNo,
      receivedByUserId: admin.id,
      notes: JSON.stringify(testReceiptMeta),
      status: 'APPROVED',
    },
  });
  console.log('✓ Custom Payment and Receipt created:', payment.receiptNo);

  // 5. Verify Receipt retrieval with all parsed breakdown
  const retrievedPayment = await prisma.payment.findUnique({
    where: { receiptNo },
    include: { flat: { include: { floor: true } } },
  });

  const parsedMeta = JSON.parse(retrievedPayment!.notes!);
  console.log('Parsed Receipt Breakdown:');
  console.log('- Tenant Name:', parsedMeta.tenantName);
  console.log('- Issue Date:', parsedMeta.formattedDate);
  console.log('- Billing Period:', parsedMeta.billingPeriod);
  console.log('- Base Rent: ৳' + parsedMeta.baseRent);
  console.log('- Lift Fee: ৳' + parsedMeta.liftFee);
  console.log('- Extra / Hidden Charge: ৳' + parsedMeta.extraCharge, `(${parsedMeta.extraChargeLabel})`);
  console.log('- Previous Due: ৳' + parsedMeta.previousDue);
  console.log('- Total Payable: ৳' + parsedMeta.totalPayable);
  console.log('- Amount Paid: ৳' + parsedMeta.paidAmount);
  console.log('- Balance Due: ৳' + parsedMeta.balanceDue);

  if (parsedMeta.previousDue !== 1500) throw new Error('Previous due mismatch');
  if (parsedMeta.extraCharge !== 400) throw new Error('Extra charge mismatch');
  if (parsedMeta.tenantName !== 'জনাব মোহাম্মদ নাসির উদ্দিন') throw new Error('Tenant name mismatch');

  // Reset Flat B2 rent back to standard 13,000 for consistency
  await prisma.flat.update({
    where: { code: 'B2' },
    data: { baseRent: 13000 },
  });

  console.log('--- All Admin Features Verified Successfully! ---');
}

testFeatures()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
