const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('Postojeći korisnici:');
    users.forEach(u => {
        console.log(`- ${u.name} (${u.email}) [${u.role}] ID: ${u.id}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
