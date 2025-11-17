import { ConnectionOptions } from "mysql2/promise";
/**
 * Represents a type that prettifies another type by preserving its keys and values.
 * @template T - The type to be prettified.
 */
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & unknown;
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
    enablePrimaryKey?: boolean;
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
export type Direction = 'ASC' | 'DESC';
export type OrderByField<T> = {
    raw?: never;
    field: T | (string & {});
    direction?: Direction;
} | {
    raw: string;
    field?: never;
    direction?: Direction;
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
export type InsertOptions<ColumnKeys extends string = string> = {
    insertIgnore?: boolean;
    onDuplicateKeyUpdate?: UpdateValue<ColumnKeys>;
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
export interface SelectQueryBuilder<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    from(table: string, alias?: string): FromQueryBuilder<ColumnKeys, QueryReturnType>;
}
export interface WhereQueryBuilder<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
    groupBy(fields: GroupByField<ColumnKeys>): GroupByQueryBuilder<QueryReturnType>;
}
export interface FromQueryBuilder<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
    join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
    where(where: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    groupBy(fields: GroupByField<ColumnKeys>): GroupByQueryBuilder<QueryReturnType>;
    orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
}
export interface JoinQueryBuilder<ColumnKeys extends string, QueryReturnType> extends FromQueryBuilder<ColumnKeys, QueryReturnType> {
}
export interface OrderByQueryBuilder<QueryReturnType> extends QueryAction<QueryReturnType> {
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
}
export interface GroupByQueryBuilder<QueryReturnType> extends QueryAction<QueryReturnType> {
}
export interface LimitQueryBuilder<QueryReturnType> extends QueryAction<QueryReturnType> {
    offset(offset?: Offset): OffsetQueryBuilder<QueryReturnType>;
}
export interface OffsetQueryBuilder<QueryReturnType> extends QueryAction<QueryReturnType> {
}
export interface UpdateQueryBuilder<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    set?(values: UpdateValue<ColumnKeys>): UpdateQueryBuilder<ColumnKeys, QueryReturnType>;
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
}
export interface UpdateQueryBuilderWithoutSet<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
}
export interface SetQueryBuilder<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
}
export interface InsertQueryBuilder<QueryReturnType> extends QueryAction<QueryReturnType> {
}
export interface DeleteQueryBuilder<ColumnKeys extends string, QueryReturnType> extends QueryAction<QueryReturnType> {
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
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
type NonEmptyArray<T> = [T, ...T[]];
type RawWhereCondition = {
    'RAW'?: {
        sql: string;
        params?: any[];
    };
};
export type SimpleCondition<ColumnKeys extends string> = {
    [key in ColumnKeys]?: OperatorCondition | string | number | Array<string> | Array<number>;
} & {
    [key: string]: OperatorCondition | string | number | Array<string> | Array<number>;
};
export type NestedCondition<ColumnKeys extends string> = {
    AND?: NonEmptyArray<WhereCondition<ColumnKeys>>;
    OR?: NonEmptyArray<WhereCondition<ColumnKeys>>;
};
export type WhereCondition<ColumnKeys extends string> = Prettify<(SimpleCondition<ColumnKeys> & NestedCondition<ColumnKeys>) | NestedCondition<ColumnKeys> | (RawWhereCondition & NestedCondition<ColumnKeys>) | (SimpleCondition<ColumnKeys> & RawWhereCondition & NestedCondition<ColumnKeys>)>;
export type DatabaseManagementOptions = {
    verbose?: boolean;
};
export {};
//# sourceMappingURL=types.d.ts.map