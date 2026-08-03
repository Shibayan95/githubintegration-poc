/**
 * Drizzle schema — single source of truth for all tables.
 *
 * Below is an example on how to define a table using Drizzle ORM, along with imports.
 */

// import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

// export const expenses = pgTable("expenses", {
//   id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
//   description: text("description").notNull(),
//   amount: text("amount").notNull(),
//   category: text("category")
//     .$type<"food" | "transport" | "entertainment" | "other">()
//     .notNull()
//     .default("other"),
//   date: timestamp("date").notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });

// export type Expense = typeof expenses.$inferSelect;
// export type NewExpense = typeof expenses.$inferInsert;

export const schema = {}; // This is empty, add the tables from above here
