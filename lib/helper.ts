import { WhereCondition, OrderByField } from "@dto/types";

// Helper function to create a WhereCondition
export function createWhereCondition<T>(conditions: WhereCondition): WhereCondition {
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