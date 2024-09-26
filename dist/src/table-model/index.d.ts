import { SQLBuilder } from "../../dto/sql-builder-class";
import { ColumnData, InsertOptions, LimitOffset, OrderByField, Prettify, QueryAction, UpdateOptions, WhereCondition, SoftDeleteOptions, FieldAlias, PatchOptions, TableModelConstructor, SelectFields } from "../../dto/types";
import type { QueryResult, ResultSetHeader, RowDataPacket } from "mysql2";
export declare class TableModel<ColumnKeys extends string, PrimaryKey extends ColumnKeys> {
    tableName: string;
    private primaryKey;
    private columns;
    private centralFields;
    private queryFn?;
    constructor(config: TableModelConstructor<ColumnKeys[], PrimaryKey>);
    private checkConfig;
    private checkEmptyObject;
    private throwEmptyObjectError;
    private printPrefixMessage;
    private removeExtraFieldsAndLog;
    initSQLBuilder<T extends ColumnKeys, QueryReturnType extends QueryResult>(): SQLBuilder<T, QueryReturnType>;
    createSelect(): (values?: {
        fields?: SelectFields<ColumnKeys>;
    }) => import("../../dto/types").FromQueryBuilder<ColumnKeys, RowDataPacket[]>;
    createUpdate(options?: UpdateOptions): (values: {
        data: Omit<ColumnData<ColumnKeys>, PrimaryKey>;
        where: WhereCondition<ColumnKeys>;
    }) => import("../../dto/types").WhereQueryBuilder<ColumnKeys, ResultSetHeader>;
    createInsert(options?: InsertOptions): (data: ColumnData<ColumnKeys>) => import("../../dto/types").InsertQueryBuilder<ResultSetHeader>;
    createDelete(): (values: {
        where: WhereCondition<ColumnKeys>;
    }) => import("../../dto/types").WhereQueryBuilder<ColumnKeys, ResultSetHeader>;
    createCount(): (field?: ColumnKeys | (string & {}) | "*", alias?: string) => import("../../dto/types").FromQueryBuilder<ColumnKeys, RowDataPacket[]>;
    findOne(values: {
        fields?: ColumnKeys | string & {} | (ColumnKeys | FieldAlias<ColumnKeys>)[];
        where: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    }): import("../../dto/types").LimitQueryBuilder<RowDataPacket[]>;
    findAll(values?: Prettify<{
        fields?: ColumnKeys | string & {} | (ColumnKeys | FieldAlias<ColumnKeys>)[];
        where?: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    } & LimitOffset>): import("../../dto/types").OffsetQueryBuilder<RowDataPacket[]>;
    updateOne(values: Prettify<{
        data: Omit<ColumnData<ColumnKeys>, PrimaryKey>;
        where: WhereCondition<ColumnKeys>;
        options?: UpdateOptions;
    }>): QueryAction<ResultSetHeader>;
    updateAll(values: Prettify<{
        data: Omit<ColumnData<ColumnKeys>, PrimaryKey>;
        where?: WhereCondition<ColumnKeys>;
        options?: UpdateOptions;
    }>): QueryAction<ResultSetHeader>;
    insertRecord(data: ColumnData<ColumnKeys>, options?: InsertOptions): import("../../dto/types").InsertQueryBuilder<ResultSetHeader>;
    removeOne(values: {
        where: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    }): import("../../dto/types").LimitQueryBuilder<ResultSetHeader>;
    remove(values: {
        where: WhereCondition<ColumnKeys>;
        orderBy?: OrderByField<ColumnKeys>[];
    }): import("../../dto/types").OrderByQueryBuilder<ResultSetHeader>;
    patchActiveStatus<T>(values: {
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