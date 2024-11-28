import { SQLBuilder } from "@dto/sql-builder-class";
import {
  ColumnData,
  InsertOptions,
  LimitOffset,
  OrderByField,
  Prettify,
  QueryFunction,
  QueryAction,
  UpdateOptions,
  WhereCondition,
  SoftDeleteOptions,
  FieldAlias,
  PatchOptions,
  CentralFields,
  TableModelConstructor,
  SelectFields,
  InsertValue,
  UpdateValue
} from "@dto/types";
import logger from "@lib/logger";
import type {
  QueryResult,
  ResultSetHeader,
  RowDataPacket
} from "mysql2";
export class TableModel<ColumnKeys extends string, PrimaryKey extends ColumnKeys> {
  tableName: string;
  private primaryKey: PrimaryKey;
  private columns: ColumnKeys[];
  private centralFields: CentralFields;
  private queryFn?: QueryFunction;

  constructor(config: TableModelConstructor<ColumnKeys[], PrimaryKey>) {
    this.tableName = config.tableName;
    this.primaryKey = config.primaryKey;
    this.columns = config.columns;
    const defaultCentralFields: CentralFields = {
      ctimeField: 'ctime',
      utimeField: 'utime',
      isActiveField: 'is_active',
      isDeletedField: 'is_deleted',
      statusField: 'status'
    };
    this.centralFields = {
      ...defaultCentralFields,
      ...(config?.centralFields || {})
    };
    this.queryFn = config.queryFn;
    this.checkConfig();
  }

  private checkConfig() {
    if (!this.tableName) {
      throw new Error('Table name is required');
    }
    if (!this.primaryKey) {
      throw new Error('Primary key is required');
    }
    if (!Array.isArray(this.columns) || this.columns.length === 0) {
      throw new Error('Table Columns are required');
    }
  }

  private checkEmptyObject(obj: Object) {
    return Object.keys(obj).length === 0;
  }

  private throwEmptyObjectError(obj: Object, message?: string) {
    if (this.checkEmptyObject(obj)) {
      throw new Error(message || 'Object cannot be empty');
    }
  }

  private throwEmptyArrayError(arr: any[], message?: string) {
    if (arr.length === 0) {
      throw new Error(message || 'Array cannot be empty');
    }
  }

  private printPrefixMessage(message: string) {
    return `[Table :: ${this.tableName}] :: ${message}`;
  }

  private removeExtraFieldsAndLog(structuredData: InsertValue<ColumnKeys> & { [key: string]: any }, index?: number) {
    if (Array.isArray(structuredData)) {
      structuredData.forEach((data, index) => {
        this.removeExtraFieldsAndLog(data, index);
      });
      return;
    }

    const removedKeys: string[] = [];
    // Remove extra fields that are not in the columns
    Object.keys(structuredData).forEach(key => {
      if (!this.columns.includes(key as ColumnKeys)) {
        removedKeys.push(key);
        delete structuredData[key as ColumnKeys];
      }
    });

    if (removedKeys.length > 0) {
      logger.warn(this.printPrefixMessage(`Removed unknown fields: ${removedKeys.join(', ')} from data[${index}]`));
    }
  }

  initSQLBuilder<T extends ColumnKeys, QueryReturnType = any>() {
    return new SQLBuilder<T, QueryReturnType>(this.queryFn);
  }

  createSelect() {
    return (values?: {
      fields?: SelectFields<ColumnKeys>,
    }) => {
      const SQLBuild = this.initSQLBuilder<ColumnKeys, RowDataPacket[]>();
      const { fields } = values || {};
      return SQLBuild.select(fields || "*").from(this.tableName)
    }
  }

  createUpdate(options?: UpdateOptions) {
    return (values: {
      data: Omit<UpdateValue<ColumnKeys>, PrimaryKey>,
      where: WhereCondition<ColumnKeys>,
    }) => {
      const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
      const { data = {}, where = {} } = values || {};
      this.throwEmptyObjectError(where, this.printPrefixMessage('CreateUpdate :: Where condition cannot be empty'));
      this.throwEmptyObjectError(data, this.printPrefixMessage('CreateUpdate :: Data cannot be empty'));
      if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data];
      return SQLBuild.update(this.tableName, data as UpdateValue<ColumnKeys>, options)
        .where(where);
    }
  }

  createInsert(options?: InsertOptions) {
    return (data: InsertValue<ColumnKeys>) => {
      const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
      if (Array.isArray(data)) {
        this.throwEmptyArrayError(data, this.printPrefixMessage('CreateInsert :: Data cannot be empty'));
      } else {
        this.throwEmptyObjectError(data, this.printPrefixMessage('CreateInsert :: Data cannot be empty'));
      }
      const structuredData = Array.isArray(data) ? data : [data];
      this.removeExtraFieldsAndLog(structuredData);
      return SQLBuild.insert(this.tableName, structuredData, options);
    }
  }

  createDelete() {
    return (values: {
      where: WhereCondition<ColumnKeys>,
    }) => {
      const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
      const { where = {} } = values || {};
      this.throwEmptyObjectError(where, this.printPrefixMessage('CreateDelete :: Where condition cannot be empty'));
      return SQLBuild.deleteFrom(this.tableName)
        .where(where)
    }
  }

  createCount() {
    const SQLBuild = this.initSQLBuilder<ColumnKeys, RowDataPacket[]>();
    return (field: ColumnKeys | (string & {}) | "*" = '*', alias?: string) => {
      return SQLBuild.count(field, alias).from(this.tableName);
    }
  }

  findOne(values: {
    fields?: ColumnKeys | string & {} | (ColumnKeys | FieldAlias<ColumnKeys>)[],
    where: WhereCondition<ColumnKeys>,
    orderBy?: OrderByField<ColumnKeys>[],
  }) {
    const { where = {}, orderBy = [], fields } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('FindOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, { [key in ColumnKeys | (string & {})]?: any }[]>();
    return SQLBuild.select(fields || "*")
      .from(this.tableName)
      .where(where)
      .orderBy(orderBy)
      .limit(1);
  }

  findAll(values?: Prettify<{
    fields?: ColumnKeys | string & {} | (ColumnKeys | FieldAlias<ColumnKeys>)[],
    where?: WhereCondition<ColumnKeys>,
    orderBy?: OrderByField<ColumnKeys>[],
  } & LimitOffset>) {
    const { where, orderBy = [], fields, limit, offset } = values || {};
    if (where) this.throwEmptyObjectError(where, this.printPrefixMessage('FindAll :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, RowDataPacket[]>();
    return SQLBuild.select(fields || "*")
      .from(this.tableName)
      .where(where as WhereCondition<ColumnKeys>)
      .orderBy(orderBy)
      .limit(limit || -1) // -1 means no limit
      .offset(offset || -1); // -1 means no offset
  }

  updateOne(values: Prettify<{
    data: Omit<UpdateValue<ColumnKeys>, PrimaryKey>,
    where: WhereCondition<ColumnKeys>,
    options?: UpdateOptions
  }>) {
    const { data = {}, where = {}, options } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('UpdateOne :: Where condition cannot be empty'));
    this.throwEmptyObjectError(data, this.printPrefixMessage('UpdateOne :: Data cannot be empty'));
    if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data]; // For javascript type checking
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    return SQLBuild.update(this.tableName, data as UpdateValue<ColumnKeys>, options)
      .where(where)
      .limit(1) as QueryAction<ResultSetHeader>;
  }

  updateAll(values: Prettify<{
    data: Omit<UpdateValue<ColumnKeys>, PrimaryKey>,
    where?: WhereCondition<ColumnKeys>,
    options?: UpdateOptions
  }>) {
    const { data = {}, where = {}, options } = values || {};
    this.throwEmptyObjectError(data, this.printPrefixMessage('UpdateOne :: Data cannot be empty'));
    if (where) this.throwEmptyObjectError(where, this.printPrefixMessage('UpdateOne :: Where condition cannot be empty'));
    if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data]; // For javascript type checking
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    return SQLBuild.update(this.tableName, data as UpdateValue<ColumnKeys>, options)
      .where(where) as QueryAction<ResultSetHeader>;
  }

  insertRecord(data: InsertValue<ColumnKeys>, options?: InsertOptions) {
    if (Array.isArray(data)) {
      this.throwEmptyArrayError(data, this.printPrefixMessage('Create :: Data cannot be empty'));
    } else {
      this.throwEmptyObjectError(data, this.printPrefixMessage('Create :: Data cannot be empty'));
    }
    const structuredData = Array.isArray(data) ? data : [data];
    this.removeExtraFieldsAndLog(structuredData);
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    return SQLBuild.insert(this.tableName, structuredData, options);
  }

  removeOne(values: {
    where: WhereCondition<ColumnKeys>,
    orderBy?: OrderByField<ColumnKeys>[]
  }) {
    const { where = {}, orderBy = [] } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('RemoveOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    return SQLBuild.deleteFrom(this.tableName)
      .where(where)
      .orderBy(orderBy)
      .limit(1) as QueryAction<ResultSetHeader>;
  }

  remove(values: {
    where: WhereCondition<ColumnKeys>,
  }) {
    const { where = {} } = values || {};
    // Prevent accidental deletion of all records
    this.throwEmptyObjectError(where, this.printPrefixMessage('Remove :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    return SQLBuild.deleteFrom(this.tableName)
      .where(where) as QueryAction<ResultSetHeader>;
  }

  patchSingleField<T>(values: {
    patchField: ColumnKeys,
    where: WhereCondition<ColumnKeys>,
    value: T,
    options?: PatchOptions
  }) {
    const { where = {}, value, options, patchField } = values || {};
    if (typeof patchField !== 'string' || patchField.length === 0) {
      throw new Error(this.printPrefixMessage('PatchSingleField :: Patch field is required'));
    }
    this.throwEmptyObjectError(where, this.printPrefixMessage('PatchIsActive :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    const data = { [patchField]: value } as ColumnData<ColumnKeys>;
    return SQLBuild.update(this.tableName, data, options)
      .where(where) as QueryAction<ResultSetHeader>;
  }

  softDeleteOne<T>(values: {
    where: WhereCondition<ColumnKeys>,
    value: T,
    options?: SoftDeleteOptions
  }) {
    const { where = {}, value, options } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('SoftDeleteOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    const data = { [options?.deleteField || this.centralFields.isDeletedField!]: value } as ColumnData<ColumnKeys>;
    return SQLBuild.update(this.tableName, data, options)
      .where(where)
      .limit(1) as QueryAction<ResultSetHeader>;
  }

  softDelete(values: {
    where: WhereCondition<ColumnKeys>,
    value: any,
    options?: SoftDeleteOptions
  }) {
    const { where = {}, value, options } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('SoftDelete :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ColumnKeys, ResultSetHeader>();
    const data = { [options?.deleteField || this.centralFields.isDeletedField!]: value } as ColumnData<ColumnKeys>;
    return SQLBuild.update(this.tableName, data, options)
      .where(where) as QueryAction<ResultSetHeader>;
  }

}