/**
 * Represents a type that prettifies another type by preserving its keys and values.
 * @template T - The type to be prettified.
 */
type Prettify<T> = {
  [K in keyof T]: T[K];
} & unknown;

type ObjectValues = { [key: string]: any };

export type SQL_CONSTRUCTORS = {
  count: { sql: string, params: any[] },
  select: { sql: string, params: any[] },
  insert: { sql: string, params: any[] },
  update: { sql: string, params: any[] },
  delete: { sql: string, params: any[] },
  from: { sql: string, params: any[] },
  where: { sql: string, params: any[] },
  join: { sql: string, params: any[] },
  set: { sql: string, params: any[] },
  groupBy: { sql: string, params: any[] },
  orderBy: { sql: string, params: any[] },
  offset: { sql: string, params: any[] },
  limit: { sql: string, params: any[] },
}

type FieldDefinition = string | { [key: string]: string };
export type SelectFields = '*' | (string & {}) | FieldDefinition[];
export type OrderByField = { field: string, direction?: 'ASC' | 'DESC' };
export type SetValues = ObjectValues;
export type InsertValues = ObjectValues;

export type InsertOptions = {
  insertIgnore?: boolean;
  onDuplicateKeyUpdate?: ObjectValues;
  enableTimestamps?: boolean;
  ctimeField?: string;
  utimeField?: string;
};

export type UpdateOptions = {
  enableTimestamps?: boolean;
  utimeField?: string;
};

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

// --------------------------------------------------QUERY BUILDER--------------------------------------------------

export type QueryResult = { sql: string; params: any[];[Symbol.iterator](): Iterator<any> };

export type SelectQueryBuilder = {
  from(table: string, alias?: string): FromQueryBuilder;
  buildQuery(): QueryResult;
}

export interface WhereQueryBuilder {
  orderBy(fields: OrderByField[]): OrderByQueryBuilder;
  limit(limit: number): LimitQueryBuilder;
  buildQuery(): QueryResult;
}

export type FromQueryBuilder = {
  join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder;
  join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder;
  where(where: WhereCondition): WhereQueryBuilder;
  // groupBy(fields: string[]): GroupByQueryBuilder;
  orderBy(fields: OrderByField[]): OrderByQueryBuilder;
  limit(limit: number): LimitQueryBuilder;
  buildQuery(): QueryResult;
}

export interface JoinQueryBuilder extends FromQueryBuilder { }
// export interface GroupByQueryBuilder extends FromQueryBuilder { }

export interface OrderByQueryBuilder {
  limit(limit: number): LimitQueryBuilder;
  buildQuery(): QueryResult;
}
export interface LimitQueryBuilder {
  offset(offset: number): OffsetQueryBuilder;
  buildQuery(): QueryResult;
}
export interface OffsetQueryBuilder {
  buildQuery(): QueryResult;
}
export interface UpdateQueryBuilder {
  set(values: SetValues): UpdateQueryBuilder;
  where(conditions: WhereCondition): WhereQueryBuilder;
  buildQuery(): QueryResult;
}
export interface UpdateQueryBuilderWithoutSet {
  where(conditions: WhereCondition): WhereQueryBuilder;
  buildQuery(): QueryResult;
}
export interface SetQueryBuilder {
  where(conditions: WhereCondition): WhereQueryBuilder;
  buildQuery(): QueryResult;
}
export interface InsertQueryBuilder {
  buildQuery(): QueryResult;
}
export interface DeleteQueryBuilder {
  where(conditions: WhereCondition): WhereQueryBuilder
  limit(limit: number): LimitQueryBuilder;
  buildQuery(): QueryResult;
}

// --------------------------------------------------QUERY BUILDER END--------------------------------------------------

type EqualOperator = { '='?: any };
type NotEqualOperator = { '!='?: any };
type LessThanOperator = { '<'?: any };
type LessThanOrEqualOperator = { '<='?: any };
type GreaterThanOperator = { '>'?: any };
type GreaterThanOrEqualOperator = { '>='?: any };
type LikeOperator = { 'LIKE'?: any };
type InOperator = { 'IN'?: any[] };
type BetweenOperator = { 'BETWEEN'?: [any, any] };
type NotBetweenOperator = { 'NOT_BETWEEN'?: [any, any] };
type IsNullOperator = { 'IS_NULL'?: true };
type IsNotNullOperator = { ['IS_NOT_NULL']?: true };

type OperatorCondition = Prettify<EqualOperator &
  NotEqualOperator &
  LessThanOperator &
  LessThanOrEqualOperator &
  GreaterThanOperator &
  GreaterThanOrEqualOperator &
  LikeOperator &
  InOperator &
  BetweenOperator &
  NotBetweenOperator &
  IsNullOperator &
  IsNotNullOperator
>;

// export type WhereCondition = { [key: string]: OperatorCondition | string | number }
export type SimpleCondition = {
  [key: string]: OperatorCondition | string | number;
};

type NonEmptyArray<T> = [T, ...T[]];

export type NestedCondition = {
  AND?: NonEmptyArray<WhereCondition>;
  OR?: NonEmptyArray<WhereCondition>;
};

export type WhereCondition = Prettify<SimpleCondition | NestedCondition>;

export type DatabaseManagementOptions = {
  verbose?: boolean;
}