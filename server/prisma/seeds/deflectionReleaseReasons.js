export default async function main (prisma) {
  console.log('Seeding deflection release reasons...');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@careconnectsf.org' },
  });

  if (!adminUser) {
    throw new Error('Admin user not found for seeding deflection release reasons');
  }

  const deflectionReleaseReasons = [
    {
      id: 'completed_services',
      name: 'Completed Services',
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
    {
      id: 'voluntary_departure',
      name: 'Voluntary Departure',
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
    {
      id: 'medical_transfer',
      name: 'Medical Transfer',
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
    {
      id: 'no_longer_meets_criteria',
      name: 'No Longer Meets Criteria',
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
    {
      id: 'other',
      name: 'Other',
      createdById: adminUser.id,
      updatedById: adminUser.id,
    },
  ];

  for (const reason of deflectionReleaseReasons) {
    const existing = await prisma.deflectionReleaseReason.findUnique({
      where: { id: reason.id },
    });

    if (existing) {
      console.log(`Deflection release reason ${reason.id} already exists, skipping...`);
    } else {
      const created = await prisma.deflectionReleaseReason.create({ data: reason });
      console.log(`Created deflection release reason: ${created.id} - ${created.name}`);
    }
  }

  console.log('Done seeding deflection release reasons!');
}
