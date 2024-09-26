import { WhereCondition, OrderByField, FieldAlias } from "@dto/types";

// Helper function to create a WhereCondition
export function createWhereCondition<T extends string>(conditions: WhereCondition<T>): WhereCondition<T> {
  return conditions;
}

// Helper function to create an orderBy array
export function createOrderBy<T extends string>(fields: OrderByField<T>[]): OrderByField<T>[] {
  return fields;
}

// Helper function to create columns
export function createColumns<T extends string>(columns: T[]): T[] {
  return columns;
}

// Helper function to create field alias
export function createFieldAlias<T extends string>(fieldObj: FieldAlias<T>): FieldAlias<T> {
  return fieldObj;
}
