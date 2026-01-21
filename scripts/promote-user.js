const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.updateMany({
        where: {
            OR: [
                { name: { contains: 'Ante' } },
                { email: { contains: 'ante' } }
            ]
        },
        data: {
            role: 'ADMIN'
        }
    });
    console.log(`Updated ${user.count} users to ADMIN role.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
