const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
});

const prisma = new PrismaClient({
    adapter,
});

module.exports = prisma;