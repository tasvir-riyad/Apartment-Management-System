import prisma from '../lib/prisma';
import { generateMonthlyCharges, calculateFlatBalance, updateFlatLiftFee, recordPayment } from '../lib/billing';
import { toBanglaDigits, formatCurrency, amountInBengaliWords } from '../lib/numbers';

async function runTests() {
  console.log('🧪 Starting Sayedi Tower Ledger & Lift Tests...');

  // Test 1: Number & Currency formatting & Bengali words
  console.log('Test 1: Currency & Bengali words');
  const words10000 = amountInBengaliWords(10000);
  console.log(`- 10,000 in words: "${words10000}"`);
  if (!words10000.includes('দশ হাজার টাকা মাত্র')) {
    throw new Error(`Test 1 Failed: Expected "দশ হাজার টাকা মাত্র", got "${words10000}"`);
  }
  console.log('✅ Test 1 Passed: In-words translation correct.');

  // Test 2: Full Rent Roll verification
  console.log('\nTest 2: Total Rent Roll verification (Expected: ৳192,500)');
  const rentableFlats = await prisma.flat.findMany({
    where: { type: { not: 'OWNER' } },
  });
  const totalRoll = rentableFlats.reduce((sum, f) => sum + f.baseRent, 0);
  console.log(`- Rentable flats count: ${rentableFlats.length}`);
  console.log(`- Calculated monthly rent roll: ৳${totalRoll.toLocaleString()}`);
  if (totalRoll !== 192500) {
    throw new Error(`Test 2 Failed: Expected 192500, got ${totalRoll}`);
  }
  console.log('✅ Test 2 Passed: Monthly rent roll exactly ৳192,500.');

  // Test 3: Owner Unit Exclusion
  console.log('\nTest 3: Owner Unit (E2-E3) Rent Exclusion');
  const ownerFlat = await prisma.flat.findUnique({ where: { code: 'E2-E3' } });
  if (!ownerFlat || ownerFlat.baseRent !== 0 || ownerFlat.type !== 'OWNER') {
    throw new Error('Test 3 Failed: Owner flat E2-E3 should have 0 rent and type OWNER');
  }
  console.log('✅ Test 3 Passed: Owner unit E2-E3 is excluded (৳0).');

  // Test 4: Lift Fee Initial State
  console.log('\nTest 4: Initial Lift Fee for Flats (Should be 0 initially)');
  const nonZeroLiftFlats = await prisma.flat.findMany({
    where: { liftFee: { not: 0 } },
  });
  console.log(`- Flats with non-zero initial lift fee: ${nonZeroLiftFlats.length}`);
  if (nonZeroLiftFlats.length !== 0) {
    throw new Error('Test 4 Failed: Initial lift fees should all be 0');
  }
  console.log('✅ Test 4 Passed: All flats initially have ৳0 lift fee.');

  // Test 5: Admin Manually Adjusting Lift Fee for a Flat
  console.log('\nTest 5: Admin manually configures Lift Fee for Flat D1 to ৳500');
  const d1 = await prisma.flat.findUnique({ where: { code: 'D1' } });
  if (!d1) throw new Error('Flat D1 not found');
  
  await updateFlatLiftFee(d1.id, 500);
  const updatedD1 = await prisma.flat.findUnique({ where: { code: 'D1' } });
  if (updatedD1?.liftFee !== 500) {
    throw new Error(`Test 5 Failed: Expected D1 liftFee to be 500, got ${updatedD1?.liftFee}`);
  }
  console.log(`- Flat D1 liftFee updated to: ৳${updatedD1?.liftFee}`);

  // Test 6: Idempotent Monthly Charge Generation with Lift Fee
  console.log('\nTest 6: Idempotency of Charge Generation (Month: 2026-10)');
  // First run
  const run1 = await generateMonthlyCharges('2026-10');
  console.log(`- First generation run: ${run1.generatedCount} generated, ${run1.alreadyExistingCount} existing`);
  if (run1.generatedCount !== 19) {
    throw new Error(`Test 6 Failed: Expected 19 generated, got ${run1.generatedCount}`);
  }

  // Second run (must not create duplicates)
  const run2 = await generateMonthlyCharges('2026-10');
  console.log(`- Second generation run: ${run2.generatedCount} generated, ${run2.alreadyExistingCount} existing`);
  if (run2.generatedCount !== 0 || run2.alreadyExistingCount !== 19) {
    throw new Error('Test 6 Failed: Idempotency violated; duplicate charges attempted');
  }

  // Verify D1 charge includes ৳10,000 base + ৳500 lift = ৳10,500
  const d1Charge = await prisma.rentCharge.findUnique({
    where: {
      flatId_month: {
        flatId: d1.id,
        month: '2026-10',
      },
    },
  });
  console.log(`- Flat D1 Charge: Base Rent = ৳${d1Charge?.rentAmount}, Lift = ৳${d1Charge?.liftAmount}, Total = ৳${d1Charge?.amount}`);
  if (d1Charge?.amount !== 10500 || d1Charge?.liftAmount !== 500) {
    throw new Error(`Test 6 Failed: Expected 10500 with 500 lift fee, got ${d1Charge?.amount}`);
  }
  console.log('✅ Test 6 Passed: Idempotent generation succeeded and correctly computed Base + Lift Fee.');

  // Test 7: Partial Payment & Ledger Math
  console.log('\nTest 7: Partial Payment recording');
  const payment = await recordPayment({
    flatId: d1.id,
    month: '2026-10',
    amount: 5000,
    method: 'BKASH',
    referenceNo: 'TEST_TRX_123',
    notes: 'Partial payment test',
  });
  console.log(`- Recorded payment of ৳5,000 against Flat D1 (Receipt: ${payment.receiptNo})`);
  
  // Test 7: Cumulative Running Ledger Math & Partial Payment
  console.log('\nTest 7: Cumulative Running Ledger Math & Partial Payment');
  const balanceD1 = await calculateFlatBalance(d1.id);
  // Flat D1 had ৳10,000 unpaid from September + ৳10,500 October charge = ৳20,500 total charges
  // After ৳5,000 partial payment, cumulative due is exactly ৳15,500
  console.log(`- Flat D1 Cumulative Due correctly carried forward September arrears: ৳${balanceD1.totalDue} (Expected ৳15,500)`);
  if (balanceD1.totalDue !== 15500) {
    throw new Error(`Test 7 Failed: Expected cumulative due of ৳15500, got ${balanceD1.totalDue}`);
  }
  console.log('✅ Test 7 Passed: Running cumulative balance correctly accounts for carried-forward arrears and partial payment.');

  // Reset D1 lift fee back to 0 so database remains in pristine initial state
  await updateFlatLiftFee(d1.id, 0);
  // Clean up test month charges
  await prisma.payment.deleteMany({ where: { month: '2026-10' } });
  await prisma.rentCharge.deleteMany({ where: { month: '2026-10' } });

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% LEDGER ACCURACY CONFIRMED.');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
