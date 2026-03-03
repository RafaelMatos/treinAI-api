import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })

const globalFotPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalFotPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV === 'production') globalFotPrisma.prisma = prisma