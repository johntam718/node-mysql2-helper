import { BuildQueryOptions, DeleteQueryBuilder, FromQueryBuilder, GroupByField, GroupByQueryBuilder, InsertOptions, InsertQueryBuilder, InsertValue, JoinQueryBuilder, JoinType, Limit, LimitQueryBuilder, Offset, OffsetQueryBuilder, OrderByField, OrderByQueryBuilder, QueryFunction, SelectFields, SelectQueryBuilder, SetQueryBuilder, UpdateOptions, UpdateQueryBuilder, UpdateQueryBuilderWithoutSet, UpdateValue, WhereCondition, WhereQueryBuilder } from './types';
export declare class SQLBuilder<ColumnKeys extends string, QueryReturnType = any> {
    #private;
    queryFn?: QueryFunction;
    constructor(queryFn?: QueryFunction);
    private extractTableAndAlias;
    private getCurrentUnixTimestamp;
    private processFields;
    private checkEmptyObject;
    private checkTableName;
    private throwEmptyObjectError;
    private printPrefixMessage;
    /**
     * Validates that increment and decrement are not both provided for the same field
     */
    private validateIncrementDecrement;
    /**
     * Builds SQL clauses and parameters for update operations, handling increment/decrement values
     * @returns Object with clauses array and params array
     */
    private buildUpdateClausesAndParams;
    private uniqueFields;
    private buildWhereClause;
    count(field?: ColumnKeys | (string & {}), alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType>;
    max(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType>;
    min(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType>;
    avg(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType>;
    sum(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType>;
    select(fields?: SelectFields<ColumnKeys>): SelectQueryBuilder<ColumnKeys, QueryReturnType>;
    from(table: string, alias?: string): FromQueryBuilder<ColumnKeys, QueryReturnType>;
    join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
    join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
    where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType>;
    groupBy(fields: GroupByField<ColumnKeys>): GroupByQueryBuilder<QueryReturnType>;
    orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType>;
    limit(limit?: Limit): LimitQueryBuilder<QueryReturnType>;
    offset(offset?: Offset): OffsetQueryBuilder<QueryReturnType>;
    update(table: string): UpdateQueryBuilder<ColumnKeys, QueryReturnType>;
    update(table: string, values: UpdateValue<ColumnKeys>): UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
    update(table: string, values: UpdateValue<ColumnKeys>, options?: UpdateOptions): UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
    set(values: UpdateValue<ColumnKeys>): SetQueryBuilder<ColumnKeys, QueryReturnType>;
    insert(table: string, values: InsertValue<ColumnKeys>, options?: InsertOptions<ColumnKeys>): InsertQueryBuilder<QueryReturnType>;
    deleteFrom(table: string): DeleteQueryBuilder<ColumnKeys, QueryReturnType>;
    buildQuery(options?: BuildQueryOptions): {
        sql: string;
        params: any[];
        [Symbol.iterator](): Iterator<any>;
    };
    executeQuery<T = QueryReturnType>(): Promise<T>;
}
//# sourceMappingURL=sql-builder-class.d.ts.map