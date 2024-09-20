/**
 * Represents a type that prettifies another type by preserving its keys and values.
 * @template T - The type to be prettified.
 */
export type Prettify<T> = {
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

export type FieldAlias = { [field: string]: string };
export type SelectFields = '*' | (string & {}) | string[] | (string | FieldAlias)[];
export type OrderByField = { field: string, direction?: 'ASC' | 'DESC' };
export type SetValues = ObjectValues;
export type InsertValues = ObjectValues;

export type ColumnData<T extends string> = Partial<Record<T, any>>;

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

export type SoftDeleteOptions = Prettify<{
  deleteField?: string;
} & UpdateOptions>

export type LimitOffset =
  | { limit?: never; offset?: never }
  | { limit: number; offset?: number };

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';

// --------------------------------------------------QUERY BUILDER--------------------------------------------------

export type BuildQueryResult = { sql: string; params: any[];[Symbol.iterator](): Iterator<any> };
export type QueryFunction = <T>(sql: string, params?: any[]) => Promise<T>

export type QueryAction<T> = {
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}

export type SelectQueryBuilder<T> = {
  from(table: string, alias?: string): FromQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}

export interface WhereQueryBuilder<T> {
  orderBy(fields: OrderByField[]): OrderByQueryBuilder<T>;
  limit(limit: number): LimitQueryBuilder<T>;
  groupBy(fields: string | string[]): GroupByQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}

export type FromQueryBuilder<T> = {
  join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder<T>;
  join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder<T>;
  where(where: WhereCondition): WhereQueryBuilder<T>;
  groupBy(fields: string | string[]): GroupByQueryBuilder<T>;
  orderBy(fields: OrderByField[]): OrderByQueryBuilder<T>;
  limit(limit: number): LimitQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}

export interface JoinQueryBuilder<T> extends FromQueryBuilder<T> { }
// export interface GroupByQueryBuilder extends FromQueryBuilder { }

export interface OrderByQueryBuilder<T> {
  limit(limit: number): LimitQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface GroupByQueryBuilder<T> extends QueryAction<T> { }
export interface LimitQueryBuilder<T> {
  offset(offset: number): OffsetQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface OffsetQueryBuilder<T> {
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface UpdateQueryBuilder<T> {
  set?(values: SetValues): UpdateQueryBuilder<T>;
  where(conditions: WhereCondition): WhereQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface UpdateQueryBuilderWithoutSet<T> {
  where(conditions: WhereCondition): WhereQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface SetQueryBuilder<T> {
  where(conditions: WhereCondition): WhereQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface InsertQueryBuilder<T> {
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
}
export interface DeleteQueryBuilder<T> {
  where(conditions: WhereCondition): WhereQueryBuilder<T>;
  limit(limit: number): LimitQueryBuilder<T>;
  buildQuery(): BuildQueryResult;
  executeQuery<K = T>(): Promise<K>;
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