import { drizzle } from 'drizzle-orm/postgres-js'
import { defineRelations } from "drizzle-orm";
import postgres from 'postgres'
import * as schema from "./schema"

const relations = defineRelations(schema, () => ({}));
const connectionString = import.meta.env.VITE_DATABASE_URL
const client = postgres(connectionString, { prepare: false })
export const db = drizzle({ client, relations } );