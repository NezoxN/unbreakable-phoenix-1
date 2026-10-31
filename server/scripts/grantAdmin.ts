import { prisma } from '../db';

/**
 * Видає права адміністратора ліги.
 *   npm run admin:grant -- <faceit-нікнейм-або-id>          існуючому користувачу (має хоч раз увійти на сайт)
 *   npm run admin:grant -- <нікнейм> --dev                  створює dev-акаунт для входу через DEV_LOGIN
 *   npm run admin:grant -- <нікнейм> --revoke               забирає права
 */
async function main() {
  const args = process.argv.slice(2);
  const ident = args.find((a) => !a.startsWith('--'));
  const dev = args.includes('--dev');
  const revoke = args.includes('--revoke');

  if (!ident) {
    console.error('Вкажіть FACEIT-нікнейм або ID: npm run admin:grant -- <nickname> [--dev|--revoke]');
    process.exit(1);
  }

  if (dev) {
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(ident)) {
      console.error('Dev-нікнейм: 3–24 символи, латиниця, цифри, _ або -.');
      process.exit(1);
    }
    const university = await prisma.university.findFirst({ orderBy: { id: 'asc' } });
    // Повний профіль і статус студента, щоб dev-адмін одразу міг користуватися всім сайтом
    const profile = {
      faceitNickname: ident,
      isAdmin: true,
      fullName: `Адміністратор ${ident}`,
      telegram: `@${ident.replace(/-/g, '_').padEnd(4, '_')}`,
      role: 'IGL',
      universityId: university?.id ?? null,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
    };
    const user = await prisma.user.upsert({
      where: { faceitId: `dev-${ident}` },
      create: { faceitId: `dev-${ident}`, faceitLevel: 10, faceitElo: 2400, ...profile },
      update: profile,
    });
    console.log(`[admin] Dev-адмін «${user.faceitNickname}» готовий. Вхід: DEV-вхід з нікнеймом ${ident}.`);
    return;
  }

  const user = await prisma.user.findFirst({ where: { OR: [{ faceitId: ident }, { faceitNickname: ident }] } });
  if (!user) {
    console.error(
      `[admin] Користувача «${ident}» не знайдено. Він має спершу увійти на сайт через FACEIT ` +
        `або додайте нікнейм в ADMIN_FACEIT_IDS у .env — права видадуться при вході.`
    );
    process.exit(1);
  }
  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: !revoke } });
  console.log(`[admin] ${user.faceitNickname}: права адміністратора ${revoke ? 'знято' : 'видано'}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
