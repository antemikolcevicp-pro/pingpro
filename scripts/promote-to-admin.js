const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ante.mikolcevicp@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });
        console.log(`Uspjeh: Korisnik ${email} je sada ADMINISTRATOR.`);
    } else {
        console.log(`Greška: Korisnik s mailom ${email} nije pronađen.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
