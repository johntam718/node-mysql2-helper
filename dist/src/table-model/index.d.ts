import { SQLBuilder } from "../../dto/sql-builder-class";
import { InsertOptions, LimitOffset, OrderByField, Prettify, QueryAction, UpdateOptions, WhereCondition, SoftDeleteOptions, PatchOptions, TableModelConstructor, SelectFields, InsertValue, UpdateValue } from "../../dto/types";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
export declare class TableModel<ColumnKeys extends string, PrimaryKey extends ColumnKeys> {
    tableName: string;
    tableAlias?: string;
    primaryKey: PrimaryKey;
    columns: ColumnKeys[];
    private enablePrimaryKey;
    private centralFields;
    private queryFn?;
    constructor(config: TableModelConstructor<ColumnKeys[], PrimaryKey>);
    private checkConfig;
    private checkEmptyObject;
    private throwEmptyObjectError;
    private throwEmptyArrayError;
    private printPrefixMessage;
    private cloneData;
    private removeExtraFieldsAndLog;
    initSQLBuilder<T extends ColumnKeys, QueryReturnType = any>(): SQLBuilder<T, QueryReturnType>;
    createWhereCondition(): WhereCondition<ColumnKeys>;
    createOrderByObject(defaultValues?: OrderByField<ColumnKeys>): OrderByField<ColumnKeys>;
    createOrderByArray(): OrderByField<ColumnKeys>[];
    createSelect(): (values?: {
        fields?: SelectFields<ColumnKeys>;
    }) => import("../../dto/types").FromQueryBuilder<ColumnKeys, RowDataPacket[]>;
    createUpdate(options?: UpdateOptions): (values: {
        data: UpdateValue<ColumnKeys>;
        where: WhereCondition<ColumnKeys>;
    }) => import("../../dto/types").WhereQueryBuilder<ColumnKeys, ResultSetHeader>;
    createInsert(options?: InsertOptions<ColumnKeys>): (data: InsertValue<ColumnKeys>) => import("../../dto/types").InsertQueryBuilder<ResultSetHeader>;
    createDelete(): (values: {
        where: WhereCondition<ColumnKeys>;
    }) => import("../../dto/types").WhereQueryBuilder<ColumnKeys, ResultSetHeader>;
    createCount(): (field?: ColumnKeys | (string & {}) | "*", alias?: string) => import("../../dto/types").FromQueryBuilder<ColumnKeys, RowDataPacket[]>;
    findOne(values: {
        fields?: SelectFields<ColumnKeys>;
        where: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    }): import("../../dto/types").LimitQueryBuilder<{ [key in (string & {}) | ColumnKeys]?: any; }[]>;
    findAll(values?: Prettify<{
        fields?: SelectFields<ColumnKeys>;
        where?: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    } & LimitOffset>): import("../../dto/types").OffsetQueryBuilder<{ [key in (string & {}) | ColumnKeys]?: any; }[]>;
    updateOne(values: Prettify<{
        data: UpdateValue<ColumnKeys>;
        where: WhereCondition<ColumnKeys>;
        options?: UpdateOptions;
    }>): QueryAction<ResultSetHeader>;
    updateAll(values: Prettify<{
        data: UpdateValue<ColumnKeys>;
        where?: WhereCondition<ColumnKeys>;
        options?: UpdateOptions;
    }>): QueryAction<ResultSetHeader>;
    insertRecord(data: InsertValue<ColumnKeys>, options?: InsertOptions<ColumnKeys>): import("../../dto/types").InsertQueryBuilder<ResultSetHeader>;
    removeOne(values: {
        where: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    }): QueryAction<ResultSetHeader>;
    remove(values: {
        where: WhereCondition<ColumnKeys>;
    }): QueryAction<ResultSetHeader>;
    patchSingleField<T>(values: {
        patchField: ColumnKeys;
        where: WhereCondition<ColumnKeys>;
        value: T;
        options?: PatchOptions;
    }): QueryAction<ResultSetHeader>;
    softDeleteOne<T>(values: {
        where: WhereCondition<ColumnKeys>;
        value: T;
        options?: SoftDeleteOptions;
    }): QueryAction<ResultSetHeader>;
    softDelete(values: {
        where: WhereCondition<ColumnKeys>;
        value: any;
        options?: SoftDeleteOptions;
    }): QueryAction<ResultSetHeader>;
}
//# sourceMappingURL=index.d.ts.map