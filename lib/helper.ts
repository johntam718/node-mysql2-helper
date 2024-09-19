import { SQLBuilder } from "@dto/sql-builder-class";
import { InsertOptions, OrderByField, SelectFields, SetValues, UpdateOptions, WhereCondition } from "@dto/types";

// Helper function to create select fields
export function createSelect(table: string) {
  const SQLBuild = new SQLBuilder();
  return (fields?: SelectFields) => SQLBuild.select(fields || "*").from(table);
}

// Helper function to create update queries
export function createUpdate(table: string, options?: UpdateOptions) {
  const SQLBuild = new SQLBuilder();
  return (values: SetValues) => SQLBuild.update(table, values, options);
}

// Helper function to create insert queries
export function createInsert(table: string, options?: InsertOptions) {
  const SQLBuild = new SQLBuilder();
  return (values: SetValues) => SQLBuild.insert(table, values, options);
}

// Helper function to create delete queries
export function createDelete(table: string) {
  const SQLBuild = new SQLBuilder();
  return (whereCondition?: WhereCondition, orderByField?: OrderByField[]) => SQLBuild.deleteFrom(table)
    .where(whereCondition || {})
    .orderBy(orderByField || [])
    // .limit(1);
}

// Helper function to create a WhereCondition
export function createWhereCondition(conditions: WhereCondition): WhereCondition {
  return conditions;
}

// Helper function to create an orderBy array
export function createOrderBy(fields: OrderByField[]): OrderByField[] {
  return fields;
}

// Helper function to create columns
export function createColumns<T extends string>(columns: T[]): T[] {
  return columns;
}