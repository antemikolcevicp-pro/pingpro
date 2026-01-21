const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: { contains: 'ante', mode: 'insensitive' } },
                { name: { contains: 'ante', mode: 'insensitive' } }
            ]
        }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'COACH' }
        });
        console.log(`Uspjeh: Korisnik ${user.email} (ID: ${user.id}) postavljen je za TRENERA.`);
    } else {
        const allUsers = await prisma.user.findMany();
        console.log('Greška: Korisnik nije pronađen.');
        console.log('Svi korisnici u bazi:', allUsers.map(u => u.email));
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
