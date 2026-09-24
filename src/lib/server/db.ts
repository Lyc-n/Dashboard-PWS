import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL belum diisi')
const client = postgres(connectionString, { prepare: false })
export const db = drizzle({ client });