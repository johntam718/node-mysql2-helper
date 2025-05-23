import { ConnectionOptions } from "mysql2/promise";
/**
 * Represents a type that prettifies another type by preserving its keys and values.
 * @template T - The type to be prettified.
 */
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & unknown;
type ObjectValues = {
    [key: string]: any;
};
export type DatabaseConnectionConfig = {
    identifierName: string;
    config: ConnectionOptions;
    options?: DatabaseManagementOptions;
};
export type SQL_CONSTRUCTORS = {
    count: {
        sql: string;
        params: any[];
    };
    select: {
        sql: string;
        params: any[];
    };
    insert: {
        sql: string;
        params: any[];
    };
    update: {
        sql: string;
        params: any[];
    };
    delete: {
        sql: string;
        params: any[];
    };
    from: {
        sql: string;
        params: any[];
    };
    where: {
        sql: string;
        params: any[];
    };
    join: {
        sql: string;
        params: any[];
    };
    set: {
        sql: string;
        params: any[];
    };
    groupBy: {
        sql: string;
        params: any[];
    };
    orderBy: {
        sql: string;
        params: any[];
    };
    offset: {
        sql: string;
        params: any[];
    };
    limit: {
        sql: string;
        params: any[];
    };
};
export type TableModelConstructor<ColumnKeys, PrimaryKey> = {
    tableName: string;
    tableAlias?: string;
    primaryKey: PrimaryKey;
    columns: ColumnKeys;
    centralFields?: CentralFields;
    queryFn?: QueryFunction;
};
export type CentralFields = {
    ctimeField?: string;
    utimeField?: string;
    isActiveField?: string;
    isDeletedField?: string;
    statusField?: string;
};
export type RawField = {
    raw: string;
    alias?: string;
    params?: any[];
};
export type FieldAlias<T extends string> = {
    [key in T]?: string;
};
export type SelectFields<T extends string> = '*' | string & {} | T | (T | FieldAlias<T> | RawField | string & {})[] | {
    [key in T]?: string;
} & RawField;
export type OrderByField<T> = {
    raw?: never;
    field: T | (string & {});
    direction?: 'ASC' | 'DESC';
} | {
    raw: string;
    field?: never;
    direction?: 'ASC' | 'DESC';
};
export type GroupByField<T> = T | (string & {}) | T[];
export type ColumnData<T extends string> = Partial<Record<T, any>>;
export type IncrementDecrementValue = {
    increment: number;
    decrement?: never;
} | {
    decrement: number;
    increment?: never;
};
export type UpdateValue<T extends string> = Partial<Record<T, IncrementDecrementValue | string | number | null>>;
export type InsertValue<T extends string> = ColumnData<T> | ColumnData<T>[];
export type InsertOptions = {
    insertIgnore?: boolean;
    onDuplicateKeyUpdate?: ObjectValues;
    enableTimestamps?: boolean;
    ctimeField?: string;
    ctimeValue?: () => any;
    utimeField?: string;
    utimeValue?: () => any;
};
export type UpdateOptions = {
    enableTimestamps?: boolean;
    primaryKey?: string;
    utimeField?: string;
    utimeValue?: () => any;
};
export type PatchOptions = Prettify<{} & Omit<UpdateOptions, 'primaryKey'>>;
export type SoftDeleteOptions = Prettify<{
    deleteField?: string;
} & UpdateOptions>;
export type LimitOffset = {
    limit?: never;
    offset?: never;
} | {
    limit: Limit;
    offset?: Offset;
};
export type Limit = null | number;
export type Offset = null | number;
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
export type BuildQueryOptions = {
    format?: boolean;
};
export type BuildQueryResult = {
    sql: string;
    params: any[];
    [Symbol.iterator](): Iterator<any>;
};
export type QueryFunction = <T>(sql: string, params?: any[]) => Promise<T>;
export type QueryAction<QueryReturnType> = {
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
};
export type SelectQueryBuilder<ColumnKeys extends string, QueryReturnType> = {
    from(table: string, alias?: string): FromQueryBuilder<ColumnKeys, QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
};
export interface WhereQueryBuilder<ColumnKeys extends string, QueryReturnType> {
    orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
    groupBy(fields: GroupByField<ColumnKeys>): GroupByQueryBuilder<QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export type FromQueryBuilder<ColumnKeys extends string, QueryReturnType> = {
    join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
    join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
    where(where: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    groupBy(fields: GroupByField<ColumnKeys>): GroupByQueryBuilder<QueryReturnType>;
    orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
};
export interface JoinQueryBuilder<ColumnKeys extends string, QueryReturnType> extends FromQueryBuilder<ColumnKeys, QueryReturnType> {
}
export interface OrderByQueryBuilder<T> {
    limit(limit?: Limit): LimitQueryBuilder<T>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<K = T>(): Promise<K>;
}
export interface GroupByQueryBuilder<QueryReturnType> extends QueryAction<QueryReturnType> {
}
export interface LimitQueryBuilder<QueryReturnType> {
    offset(offset?: Offset): OffsetQueryBuilder<QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export interface OffsetQueryBuilder<QueryReturnType> {
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export interface UpdateQueryBuilder<ColumnKeys extends string, QueryReturnType> {
    set?(values: UpdateValue<ColumnKeys>): UpdateQueryBuilder<ColumnKeys, QueryReturnType>;
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export interface UpdateQueryBuilderWithoutSet<ColumnKeys extends string, QueryReturnType> {
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export interface SetQueryBuilder<ColumnKeys extends string, QueryReturnType> {
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export interface InsertQueryBuilder<QueryReturnType> {
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
export interface DeleteQueryBuilder<ColumnKeys extends string, QueryReturnType> {
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): BuildQueryResult;
    executeQuery<ReturnType = QueryReturnType>(): Promise<ReturnType>;
}
type LikePatternType = {
    contains: string;
    startsWith?: never;
    endsWith?: never;
} | {
    startsWith: string;
    contains?: never;
    endsWith?: never;
} | {
    endsWith: string;
    contains?: never;
    startsWith?: never;
};
type EqualOperator = {
    '='?: any;
};
type NotEqualOperator = {
    '!='?: any;
};
type LessThanOperator = {
    '<'?: any;
};
type LessThanOrEqualOperator = {
    '<='?: any;
};
type GreaterThanOperator = {
    '>'?: any;
};
type GreaterThanOrEqualOperator = {
    '>='?: any;
};
type LikeOperator = {
    'LIKE'?: LikePatternType | string;
};
type NotLikeOperator = {
    'NOT_LIKE'?: LikePatternType | string;
};
type RegexpOperator = {
    'REGEXP'?: string;
};
type InOperator = {
    'IN'?: any[];
};
type NotInOperator = {
    'NOT_IN'?: any[];
};
type BetweenOperator = {
    'BETWEEN'?: [any, any];
};
type NotBetweenOperator = {
    'NOT_BETWEEN'?: [any, any];
};
type IsNullOperator = {
    'IS_NULL'?: true;
};
type IsNotNullOperator = {
    'IS_NOT_NULL'?: true;
};
type OperatorCondition = Prettify<EqualOperator & NotEqualOperator & LessThanOperator & LessThanOrEqualOperator & GreaterThanOperator & GreaterThanOrEqualOperator & LikeOperator & NotLikeOperator & RegexpOperator & InOperator & NotInOperator & BetweenOperator & NotBetweenOperator & IsNullOperator & IsNotNullOperator>;
type RawWhereCondition = {
    'RAW'?: {
        sql: string;
        params?: any[];
    };
};
export type SimpleCondition<ColumnKeys extends string> = {
    [key in ColumnKeys]?: OperatorCondition | string | number | Array<string> | Array<number>;
} & ({
    [key: string]: OperatorCondition | string | number | Array<string> | Array<number>;
} | RawWhereCondition);
type NonEmptyArray<T> = [T, ...T[]];
export type NestedCondition<ColumnKeys extends string> = {
    AND?: NonEmptyArray<WhereCondition<ColumnKeys>>;
    OR?: NonEmptyArray<WhereCondition<ColumnKeys>>;
};
export type WhereCondition<ColumnKeys extends string> = Prettify<SimpleCondition<ColumnKeys> | NestedCondition<ColumnKeys>>;
export type DatabaseManagementOptions = {
    verbose?: boolean;
};
export {};
//# sourceMappingURL=types.d.ts.map