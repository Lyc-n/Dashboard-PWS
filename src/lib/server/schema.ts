import { date, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const dataWargaTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    dob: date().notNull(),
    nik: integer().notNull(),
    rt: integer().notNull(),
    rw: integer().notNull(),
    petugas: text().notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
});