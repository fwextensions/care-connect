/**
 * Seed a completed incident with a RELEASED deflection.
 *
 * This scenario is used to test rendering the 849(b) Certificate of Release form.
 * The 849(b) is generated when a subject has been released from custody, so the
 * deflection must have subjectStatus=RELEASED and a releasedAt timestamp.
 */
export default async function main (prisma) {
  console.log('Seeding test released deflection (849b form scenario)...');

  const sfsoUser = await prisma.user.findUnique({
    where: { email: 'sfso@careconnectsf.org' },
  });
  if (!sfsoUser) {
    console.warn('SFSO user not found, skipping test released deflection seed.');
    return;
  }

  const sfpdUser = await prisma.user.findUnique({
    where: { email: 'sfpd@careconnectsf.org' },
  });
  if (!sfpdUser) {
    console.warn('SFPD user not found, skipping test released deflection seed.');
    return;
  }

  const facility = await prisma.facility.findUnique({
    where: { subdomain: 'reset' },
  });
  if (!facility) {
    console.warn('RESET facility not found, skipping test released deflection seed.');
    return;
  }

  const bedType = await prisma.bedType.findFirst({
    where: { facilityId: facility.id },
  });
  if (!bedType) {
    console.warn('No bed type found for RESET, skipping test released deflection seed.');
    return;
  }

  // Check if a released test deflection already exists to keep the seed idempotent
  const existing = await prisma.deflection.findFirst({
    where: {
      facilityId: facility.id,
      subjectStatus: 'RELEASED',
      subject: {
        firstName: 'Robert',
        lastName: 'Release',
      },
    },
  });
  if (existing) {
    console.log('Test released deflection already exists, skipping...');
    return;
  }

  // Timestamps: arrested ~4 hours ago, admitted ~3 hours ago, released ~1 hour ago
  const now = new Date();
  const arrestedAt = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const arrivedAt = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const transferredAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const admittedAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const releasedAt = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const completedAt = releasedAt;

  // Create a subject with full details for realistic 849(b) output
  const subject = await prisma.subject.create({
    data: {
      firstName: 'Robert',
      lastName: 'Release',
      middleInitial: 'J',
      dateOfBirth: new Date('1985-03-22'),
      sex: 'MALE',
      race: 'WHITE',
      addressLine1: '123 Market St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      localId: 'SF-TEST-849B',
    },
  });

  // Create the incident
  const incident = await prisma.incident.create({
    data: {
      facilityId: facility.id,
      arrivedAt,
      leftAt: releasedAt,
      completedAt,
      addressLine1: '850 Bryant St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      arrestedAt,
      cadNumber: '260300849',
      supervisorBadgeNumber: '9999',
      createdById: sfpdUser.id,
      createdByOrganizationId: sfpdUser.organizationId,
      updatedById: sfsoUser.id,
    },
  });

  // Grab a few deflection details to populate 647(f) indicators
  const details = await prisma.deflectionDetail.findMany({ take: 4 });

  // Look up the release reason (seeded by deflectionReleaseReasons seed)
  const releaseReason = await prisma.deflectionReleaseReason.findUnique({
    where: { id: 'completed_services' },
  });

  // Create the deflection in RELEASED / COMPLETED state
  const deflection = await prisma.deflection.create({
    data: {
      facilityId: facility.id,
      incidentId: incident.id,
      bedTypeId: bedType.id,
      subjectId: subject.id,
      subjectStatus: 'RELEASED',
      status: 'COMPLETED',
      narcoticsSubstance: false,
      narcoticsParaphernalia: false,
      behavior: 'Subject was cooperative throughout the intake process. Released after completing sobering services.',
      property: 'SMALL',
      propertyDetails: 'Wallet, keys, cell phone',
      createdById: sfpdUser.id,
      // Transfer (field officer handoff to custody)
      transferredAt,
      transferredById: sfpdUser.id,
      transferredByBadgeNumber: sfpdUser.badgeNumber,
      transferredByProp115Certified: false,
      transferredByOrganizationId: sfpdUser.organizationId,
      // Admission by custody
      admittedAt,
      admittedById: sfsoUser.id,
      // Release by custody
      releasedAt,
      releasedById: sfsoUser.id,
      ...(releaseReason ? { releaseReasonId: releaseReason.id } : {}),
      completedAt,
      // Attach 647(f) detail indicators
      ...(details.length > 0 ? { deflectionDetails: { connect: details.map(d => ({ id: d.id })) } } : {}),
    },
  });

  console.log(`Done seeding test released deflection! (deflection #${deflection.id}, subject: Robert J Release, for 849(b) form testing)`);
}
