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
  FieldAlias
} from "@dto/types";
import logger from "@lib/logger";
import type {
  ResultSetHeader,
  RowDataPacket
} from "mysql2";
export class BuildSQLModel<T extends string, PK extends T> {
  private tableName: string;
  private primaryKey: PK;
  private columns: T[];
  private queryFn?: QueryFunction;

  constructor(config: {
    tableName: string,
    primaryKey: PK,
    columns: T[],
    queryFn?: QueryFunction
  }) {
    this.tableName = config.tableName;
    this.primaryKey = config.primaryKey;
    this.columns = config.columns;
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

  private printPrefixMessage(message: string) {
    return `[Table :: ${this.tableName}] :: ${message}`;
  }

  private initSQLBuilder<T>() {
    return new SQLBuilder<T>(this.queryFn);
  }

  findOne(values: {
    fields?: (T | FieldAlias<T>)[],
    where: WhereCondition,
    orderBy?: OrderByField[],
  }) {
    const { where, orderBy = [], fields } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('FindOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<RowDataPacket[]>();
    const _fields = Array.isArray(fields) ? fields : "*";
    return SQLBuild.select(_fields)
      .from(this.tableName)
      .where(where)
      .orderBy(orderBy)
      .limit(1);
  }

  findAll(values?: Prettify<{
    fields?: (T | FieldAlias<T>)[],
    where?: WhereCondition,
    orderBy?: OrderByField[],
  } & LimitOffset>) {
    const { where, orderBy = [], fields, limit, offset } = values || {};
    if (where) this.throwEmptyObjectError(where, this.printPrefixMessage('FindAll :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<RowDataPacket[]>();
    const _fields = Array.isArray(fields) ? fields : "*";
    return SQLBuild.select(_fields)
      .from(this.tableName)
      .where(where as WhereCondition)
      .orderBy(orderBy)
      .limit(limit || -1) // -1 means no limit
      .offset(offset || -1); // -1 means no offset
  }

  updateOne(values: Prettify<{
    data: Omit<ColumnData<T>, PK>,
    where: WhereCondition,
    options?: UpdateOptions
  }>) {
    const { data, where, options } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('UpdateOne :: Where condition cannot be empty'));
    this.throwEmptyObjectError(data, this.printPrefixMessage('UpdateOne :: Data cannot be empty'));
    if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data]; // For javascript type checking
    const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
    return SQLBuild.update(this.tableName, data, options)
      .where(where)
      .limit(1) as QueryAction<ResultSetHeader>;
  }

  updateAll(values: Prettify<{
    data: Omit<ColumnData<T>, PK>,
    where?: WhereCondition,
    options?: UpdateOptions
  }>) {
    const { data, where = {}, options } = values || {};
    if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data]; // For javascript type checking
    const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
    return SQLBuild.update(this.tableName, data, options)
      .where(where) as QueryAction<ResultSetHeader>;

  }

  create(data: ColumnData<T>, options?: InsertOptions) {
    this.throwEmptyObjectError(data, this.printPrefixMessage('Create :: Data cannot be empty'));
    const structuredData = { ...data };

    const removedKeys: string[] = [];
    // remove extra fields that are not in the columns
    Object.keys(structuredData).forEach(key => {
      if (!this.columns.includes(key as T)) {
        removedKeys.push(key);
        delete structuredData[key as T];
      }
    });

    if (removedKeys.length > 0) {
      logger.warn(this.printPrefixMessage(`Create :: Removed unknown fields: ${removedKeys.join(', ')}`));
    }

    const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
    return SQLBuild.insert(this.tableName, structuredData, options);
  }

  removeOne(values: {
    where: WhereCondition,
    orderBy?: OrderByField[]
  }) {
    const { where, orderBy = [] } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('RemoveOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
    return SQLBuild.deleteFrom(this.tableName)
      .where(where)
      .orderBy(orderBy)
      .limit(1);
  }

  remove(values: {
    where: WhereCondition,
    orderBy?: OrderByField[]
  }) {
    const { where = {}, orderBy = [] } = values || {};
    // Prevent accidental deletion of all records
    this.throwEmptyObjectError(where, this.printPrefixMessage('Remove :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
    return SQLBuild.deleteFrom(this.tableName)
      .where(where)
      .orderBy(orderBy);
  }

  // patchIsActive(values: {
  //   where: WhereCondition,
  //   isActive: boolean,
  //   options?: UpdateOptions
  // }) {
  //   const { where, isActive, options } = values || {};
  //   this.throwEmptyObjectError(where, this.printPrefixMessage('PatchIsActive :: Where condition cannot be empty'));
  //   const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
  //   return SQLBuild.update(this.tableName, { is_active: isActive ? 1 : 0 }, options)
  //     .where(where) as QueryAction<ResultSetHeader>;
  // }

  // softDeleteOne(values: {
  //   where: WhereCondition,
  //   options?: SoftDeleteOptions
  // }) {
  //   const { where, options } = values || {};
  //   this.throwEmptyObjectError(where, this.printPrefixMessage('SoftDeleteOne :: Where condition cannot be empty'));
  //   const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
  //   return SQLBuild.update(this.tableName, { is_deleted: 1 }, options)
  //     .where(where)
  //     .limit(1) as QueryAction<ResultSetHeader>;
  // }

  // softDelete(values: {
  //   where: WhereCondition,
  //   options?: SoftDeleteOptions
  // }) {
  //   const { where = {}, options } = values || {};
  //   this.throwEmptyObjectError(where, this.printPrefixMessage('SoftDelete :: Where condition cannot be empty'));
  //   const SQLBuild = this.initSQLBuilder<ResultSetHeader>();
  //   return SQLBuild.update(this.tableName, { is_deleted: 1 }, options)
  //     .where(where) as QueryAction<ResultSetHeader>;
  // }
}