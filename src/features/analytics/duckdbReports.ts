import * as duckdb from "@duckdb/duckdb-wasm";
import mvpWorker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import mvpWasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import type { Expense } from "../../lib/schemas";

export type ExpenseReportRow = {
  category: string;
  count: number;
  totalCents: number;
};

export async function buildExpenseReport(expenses: Expense[]): Promise<ExpenseReportRow[]> {
  const worker = new Worker(mvpWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);

  try {
    await db.instantiate(mvpWasm);
    await db.registerFileText(
      "expenses.json",
      JSON.stringify(
        expenses.map((expense) => ({
          category: expense.category,
          amount_cents: expense.amountCents,
          status: expense.status
        }))
      )
    );
    const connection = await db.connect();
    await connection.insertJSONFromPath("expenses.json", { name: "expenses" });
    const result = await connection.query(`
      select
        category,
        count(*)::INTEGER as count,
        sum(amount_cents)::INTEGER as totalCents
      from expenses
      group by category
      order by totalCents desc
    `);
    await connection.close();

    return result.toArray().map((row) => ({
      category: String(row.category),
      count: Number(row.count),
      totalCents: Number(row.totalCents)
    }));
  } finally {
    await db.terminate();
    worker.terminate();
  }
}
