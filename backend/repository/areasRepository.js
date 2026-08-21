const prisma = require('../lib/prisma')

exports.findAll = async () => {
    return await prisma.areas.findMany()
}
