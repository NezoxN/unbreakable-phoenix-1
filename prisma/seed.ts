import { prisma } from '../server/db';
import { universities } from '../src/data/universities';

/** Заповнює/оновлює довідник ЗВО з src/data/universities.ts. Безпечно запускати повторно. */
async function main() {
  for (const u of universities) {
    const data = { name: u.name, city: u.city, emailDomains: u.domain.replace(/^@/, '') };
    await prisma.university.upsert({ where: { id: u.short }, create: { id: u.short, ...data }, update: data });
  }
  console.log(`[seed] ЗВО: ${universities.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
