import { drizzle } from 'drizzle-orm/postgres-js'
import { defineRelations } from 'drizzle-orm'
import postgres from 'postgres'
import dotenv from 'dotenv'
import * as schema from './schema/schema'

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL belum diisi')
const relations = defineRelations(schema, () => ({}))
const client = postgres(connectionString, { prepare: false })
export const db = drizzle({ client, relations })
