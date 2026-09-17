import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// TODO (Owner Confirmation Required):
// 1. The 4th floor rent was written as 100000 in the source notes — seeded as 10,000 assuming a typo.
// 2. There is no separate "1st floor" — the ground floor is treated as level 1. Adjust labels if the building numbers them differently.

async function main() {
  console.log('🌱 Starting database seed for Sayedi Tower (সাঈদী টাওয়ার)...');

  // Clear existing records in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.extraCharge.deleteMany();
  await prisma.rentCharge.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.notice.deleteMany();

  // 1. Seed Floors (8 Levels)
  const floorDefinitions = [
    { level: 1, labelEn: 'Ground Floor', labelBn: 'নিচতলা', hasParking: true, isRooftop: false },
    { level: 2, labelEn: '2nd Floor', labelBn: '২য় তলা', hasParking: false, isRooftop: false },
    { level: 3, labelEn: '3rd Floor', labelBn: '৩য় তলা', hasParking: false, isRooftop: false },
    { level: 4, labelEn: '4th Floor', labelBn: '৪র্থ তলা', hasParking: false, isRooftop: false },
    { level: 5, labelEn: '5th Floor', labelBn: '৫ম তলা', hasParking: false, isRooftop: false },
    { level: 6, labelEn: '6th Floor', labelBn: '৬ষ্ঠ তলা', hasParking: false, isRooftop: false },
    { level: 7, labelEn: '7th Floor', labelBn: '৭ম তলা', hasParking: false, isRooftop: false },
    { level: 8, labelEn: 'Rooftop', labelBn: 'ছাদ (কমন স্পেস)', hasParking: false, isRooftop: true },
  ];

  const floorsMap: Record<number, string> = {};
  for (const f of floorDefinitions) {
    const created = await prisma.floor.create({
      data: f,
    });
    floorsMap[f.level] = created.id;
  }

  // 2. Seed Flats (20 units, 19 rentable, all liftFee initialized to 0)
  const flatDefinitions = [
    // Level 1: Ground Floor
    { code: 'A1', level: 1, type: 'STANDARD', baseRent: 10000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 950 },
    { code: 'A2', level: 1, type: 'BACHELOR', baseRent: 4000, liftFee: 0, bedrooms: 1, bathrooms: 1, sizeSqft: 420 },
    // Level 2: 2nd Floor
    { code: 'B1', level: 2, type: 'STANDARD', baseRent: 11000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'B2', level: 2, type: 'STANDARD', baseRent: 13000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'B3', level: 2, type: 'STANDARD', baseRent: 12000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    // Level 3: 3rd Floor (Compact layout)
    { code: 'C1', level: 3, type: 'COMPACT', baseRent: 10000, liftFee: 0, bedrooms: 2, bathrooms: 2, sizeSqft: 720 },
    { code: 'C2', level: 3, type: 'COMPACT', baseRent: 8500, liftFee: 0, bedrooms: 2, bathrooms: 2, sizeSqft: 720 },
    { code: 'C3', level: 3, type: 'COMPACT', baseRent: 7500, liftFee: 0, bedrooms: 2, bathrooms: 2, sizeSqft: 720 },
    { code: 'C4', level: 3, type: 'COMPACT', baseRent: 7500, liftFee: 0, bedrooms: 2, bathrooms: 2, sizeSqft: 720 },
    // Level 4: 4th Floor
    { code: 'D1', level: 4, type: 'STANDARD', baseRent: 10000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'D2', level: 4, type: 'STANDARD', baseRent: 12000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'D3', level: 4, type: 'STANDARD', baseRent: 11000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    // Level 5: 5th Floor
    { code: 'E1', level: 5, type: 'STANDARD', baseRent: 10000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'E2-E3', level: 5, type: 'OWNER', baseRent: 0, liftFee: 0, bedrooms: 4, bathrooms: 4, sizeSqft: 2000, status: 'OWNER_OCCUPIED', notes: "Owner's residence (combined unit)" },
    // Level 6: 6th Floor
    { code: 'F1', level: 6, type: 'STANDARD', baseRent: 10000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'F2', level: 6, type: 'STANDARD', baseRent: 12000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'F3', level: 6, type: 'STANDARD', baseRent: 11000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    // Level 7: 7th Floor
    { code: 'G1', level: 7, type: 'STANDARD', baseRent: 10000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'G2', level: 7, type: 'STANDARD', baseRent: 12000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
    { code: 'G3', level: 7, type: 'STANDARD', baseRent: 11000, liftFee: 0, bedrooms: 3, bathrooms: 3, sizeSqft: 980 },
  ];

  const flatsMap: Record<string, string> = {};
  for (const flatDef of flatDefinitions) {
    const created = await prisma.flat.create({
      data: {
        code: flatDef.code,
        floorId: floorsMap[flatDef.level],
        type: flatDef.type,
        baseRent: flatDef.baseRent,
        liftFee: flatDef.liftFee, // Lift fee initially set to 0 for all flats
        bedrooms: flatDef.bedrooms,
        bathrooms: flatDef.bathrooms,
        sizeSqft: flatDef.sizeSqft,
        status: flatDef.status || 'VACANT',
        notes: flatDef.notes || null,
      },
    });
    flatsMap[flatDef.code] = created.id;
  }

  // Calculate & verify total monthly rent roll
  const rentableFlats = flatDefinitions.filter(f => f.type !== 'OWNER');
  const totalRentRoll = rentableFlats.reduce((sum, f) => sum + f.baseRent, 0);
  console.log(`✅ Total Flats Seeded: ${flatDefinitions.length} (Rentable: ${rentableFlats.length})`);
  console.log(`✅ Total Expected Monthly Rent Roll: ৳${totalRentRoll.toLocaleString()} (Target: ৳192,500)`);

  // 3. Seed Users (Super Admin & Admin)
  const passwordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin@sayeditower.com',
      email: 'admin@sayeditower.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      username: 'owner',
      email: 'owner@sayeditower.com',
      passwordHash: await bcrypt.hash('owner123', 12),
      role: 'ADMIN',
      flatId: flatsMap['E2-E3'],
      isActive: true,
      mustChangePassword: false,
    },
  });

  // 4. Seed Settings
  const defaultSettings = [
    { key: 'building_name_bn', value: 'সাঈদী টাওয়ার' },
    { key: 'building_name_en', value: 'Sayedi Tower' },
    { key: 'address_bn', value: 'চৌধুরী সড়ক, বোয়ালিয়ারকুল, লোহাগাড়া, চট্টগ্রাম' },
    { key: 'address_en', value: 'Chowdhury Road, Boaliarkul, Lohagara, Chattogram, Bangladesh' },
    { key: 'google_maps_url', value: 'https://maps.app.goo.gl/e58HCKi4UTQQ5Je78?g_st=iw' },
    { key: 'owner_phone', value: '01815826053' },
    { key: 'secondary_phone', value: '01632-443446' },
    { key: 'currency_symbol', value: '৳' },
    { key: 'timezone', value: 'Asia/Dhaka' },
    { key: 'rent_due_day', value: '9' },
    { key: 'high_due_threshold', value: '30000' },
    { key: 'has_lift', value: 'true' },
    { key: 'lift_default_fee', value: '0' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.create({
      data: s,
    });
  }

  // 5. Seed Sample Tenants & Leases for Demonstration
  const tenantPasswordHash = await bcrypt.hash('tenant123', 12);

  const sampleTenants = [
    {
      flatCode: 'B2',
      nameBn: 'মোঃ রফিকুল ইসলাম',
      nameEn: 'Md. Rafiqul Islam',
      phone: '01711223344',
      email: 'rafiq@example.com',
      occupation: 'ব্যাংক কর্মকর্তা (Bank Officer)',
      familyMembers: 3,
      moveInDate: new Date('2025-01-01'),
      status: 'OCCUPIED',
      rent: 13000,
      liftFee: 0,
    },
    {
      flatCode: 'C1',
      nameBn: 'আব্দুল করিম',
      nameEn: 'Abdul Karim',
      phone: '01822334455',
      email: 'karim@example.com',
      occupation: 'শিক্ষক (Teacher)',
      familyMembers: 2,
      moveInDate: new Date('2025-03-01'),
      status: 'OCCUPIED',
      rent: 10000,
      liftFee: 0,
    },
    {
      flatCode: 'A1',
      nameBn: 'মাহমুদুল হাসান',
      nameEn: 'Mahmudul Hasan',
      phone: '01933445566',
      email: 'mahmud@example.com',
      occupation: 'ব্যবসায়ী (Businessman)',
      familyMembers: 4,
      moveInDate: new Date('2024-11-01'),
      status: 'OCCUPIED',
      rent: 10000,
      liftFee: 0,
    },
    {
      flatCode: 'D1',
      nameBn: 'ফারহানা আক্তার',
      nameEn: 'Farhana Akter',
      phone: '01644556677',
      email: 'farhana@example.com',
      occupation: 'ডাক্তার (Doctor)',
      familyMembers: 2,
      moveInDate: new Date('2025-05-01'),
      status: 'OCCUPIED',
      rent: 10000,
      liftFee: 0,
    },
  ];

  for (const t of sampleTenants) {
    const flatId = flatsMap[t.flatCode];

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        flatId,
        fullNameBn: t.nameBn,
        fullNameEn: t.nameEn,
        phone: t.phone,
        email: t.email,
        occupation: t.occupation,
        permanentAddress: 'লোহাগাড়া, চট্টগ্রাম (Lohagara, Chattogram)',
        familyMembersCount: t.familyMembers,
        moveInDate: t.moveInDate,
        isActive: true,
      },
    });

    // Create Tenant User Account (login with flat code e.g. B2, case-insensitive)
    await prisma.user.create({
      data: {
        username: t.flatCode,
        email: t.email,
        passwordHash: tenantPasswordHash,
        role: 'TENANT',
        flatId,
        isActive: true,
      },
    });

    // Create Lease
    const lease = await prisma.lease.create({
      data: {
        flatId,
        tenantId: tenant.id,
        startDate: t.moveInDate,
        monthlyRent: t.rent,
        monthlyLiftFee: t.liftFee,
        securityDeposit: t.rent * 2,
        advanceMonths: 1,
        status: 'ACTIVE',
      },
    });

    // Update flat status to OCCUPIED
    await prisma.flat.update({
      where: { id: flatId },
      data: { status: 'OCCUPIED' },
    });

    // Generate sample rent charges for recent months
    const months = ['2026-07', '2026-08', '2026-09'];
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const dueDate = new Date(`${month}-09T00:00:00+06:00`);
      
      const charge = await prisma.rentCharge.create({
        data: {
          flatId,
          leaseId: lease.id,
          month,
          rentAmount: t.rent,
          liftAmount: t.liftFee,
          amount: t.rent + t.liftFee,
          dueDate,
          status: i < 2 ? 'PAID' : (t.flatCode === 'B2' ? 'PAID' : 'UNPAID'),
          paidAmount: i < 2 ? t.rent : (t.flatCode === 'B2' ? t.rent : 0),
        },
      });

      // If marked paid, create payment record and receipt
      if (charge.status === 'PAID') {
        const receiptNo = `REC-${month.replace('-', '')}-${t.flatCode}`;
        await prisma.payment.create({
          data: {
            flatId,
            month,
            amount: t.rent + t.liftFee,
            paidOn: new Date(`${month}-05T10:00:00+06:00`),
            method: 'BKASH',
            referenceNo: `TRX${Math.floor(100000 + Math.random() * 900000)}`,
            receiptNo,
            receivedByUserId: adminUser.id,
            status: 'APPROVED',
            notes: 'Paid via bKash on time',
          },
        });
      }
    }

    // Seed sample vehicle for Flat B2
    if (t.flatCode === 'B2') {
      await prisma.vehicle.create({
        data: {
          flatId,
          vehicleType: 'MOTORCYCLE',
          brandModel: 'Yamaha FZS V3',
          registrationNo: 'Chatto Metro-Ha-12-3456',
          color: 'Blue',
          ownerName: t.nameEn,
          slotLabel: 'P-04',
          isActive: true,
        },
      });
    }
  }

  // Seed sample Notices
  await prisma.notice.create({
    data: {
      titleBn: 'লিফট ও জেনারেটর নিয়মিত রক্ষণাবেক্ষণ সংক্রান্ত নোটিশ',
      titleEn: 'Notice Regarding Lift & Generator Regular Maintenance',
      body: 'সম্মানিত ফ্ল্যাটবাসী, আগামী শুক্রবার সকাল ১০টা থেকে দুপুর ১২টা পর্যন্ত লিফটের নিয়মিত রক্ষণাবেক্ষণ কাজ চলবে। এই সময়ে লিফট সাময়িক বন্ধ থাকবে। সহযোগিতার জন্য ধন্যবাদ।',
      audience: 'ALL',
      isPinned: true,
    },
  });

  await prisma.notice.create({
    data: {
      titleBn: 'প্রতি মাসের ৯ তারিখের মধ্যে ভাড়া পরিশোধের অনুরোধ',
      titleEn: 'Request to pay rent by the 9th of each month',
      body: 'সকল ভাড়াটিয়া ভাই ও বোনদের বিনীত অনুরোধ করা যাচ্ছে যে প্রতি মাসের ৯ তারিখের মধ্যে চলতি মাসের ভাড়া ও ইউটিলিটি বিল পরিশোধ করার জন্য।',
      audience: 'ALL',
      isPinned: false,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('Admin login: admin@sayeditower.com / admin123');
  console.log('Tenant login: B2 / tenant123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
