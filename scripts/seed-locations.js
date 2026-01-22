const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const locations = [
        { name: 'Bakarić', address: 'Zagreb', totalTables: 3 },
        { name: 'Velesajam', address: 'Zagreb', totalTables: 15 },
        { name: 'Medarska', address: 'Zagreb', totalTables: 6 },
        { name: 'Mladost', address: 'Zagreb', totalTables: 8 },
    ];

    for (const loc of locations) {
        await prisma.location.upsert({
            where: { id: loc.name.toLowerCase() }, // Using name as base for ID for simplicity in seed
            update: {
                totalTables: loc.totalTables,
            },
            create: {
                id: loc.name.toLowerCase(),
                name: loc.name,
                address: loc.address,
                totalTables: loc.totalTables,
            },
        });
    }

    console.log('Locations seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
