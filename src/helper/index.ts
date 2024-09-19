import { SQLBuilder } from "@dto/sql-builder-class";
import { ColumnData, InsertOptions, LimitOffset, OrderByField, OrderByQueryBuilder, Prettify, QueryAction, SelectFields, SetValues, UpdateOptions, WhereCondition } from "@dto/types";
import { createDelete, createInsert, createSelect, createUpdate } from "@lib/helper";

export class BuildSQLModel<T extends string, PK extends T> {
  private tableName: string;
  private primaryKey: PK;
  private columns: T[];
  private queryFn?: Function;

  constructor(config: {
    tableName: string,
    primaryKey: PK,
    columns: T[],
    queryFn?: Function
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

  private initSQLBuilder() {
    return new SQLBuilder(this.queryFn);
  }

  findOne(values: {
    fields?: T[],
    // fields?: T[] SelectFields,
    where: WhereCondition,
    orderBy?: OrderByField[],
  }) {
    const { where, orderBy = [], fields } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('FindOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder();
    const _fields = Array.isArray(fields) ? Array.from(new Set(fields)) : "*";
    return SQLBuild.select(_fields)
      .from(this.tableName)
      .where(where)
      .orderBy(orderBy)
      .limit(1);
  }

  findAll(values?: Prettify<{
    fields?: T[],
    where?: WhereCondition,
    orderBy?: OrderByField[],
  } & LimitOffset>) {
    const { where, orderBy = [], fields, limit, offset } = values || {};
    if (where) this.throwEmptyObjectError(where, this.printPrefixMessage('FindAll :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder();
    const _fields = Array.isArray(fields) ? Array.from(new Set(fields)) : "*";
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
  }>): QueryAction {
    const { data, where, options } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('UpdateOne :: Where condition cannot be empty'));
    this.throwEmptyObjectError(data, this.printPrefixMessage('UpdateOne :: Data cannot be empty'));
    if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data]; // For javascript type checking
    const SQLBuild = this.initSQLBuilder();
    return SQLBuild.update(this.tableName, data, options)
      .where(where)
      .limit(1);
  }

  updateAll(values: Prettify<{
    data: Omit<ColumnData<T>, PK>,
    where?: WhereCondition,
    options?: UpdateOptions
  }>): QueryAction {
    const { data, where = {}, options } = values || {};
    if (this.primaryKey in data) delete data[this.primaryKey as unknown as keyof typeof data]; // For javascript type checking
    const SQLBuild = this.initSQLBuilder();
    return SQLBuild.update(this.tableName, data, options)
      .where(where);

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
      console.warn(this.printPrefixMessage(`Create :: Removed extra key fields: ${removedKeys.join(', ')}`));
    }

    const SQLBuild = this.initSQLBuilder();
    return SQLBuild.insert(this.tableName, structuredData, options);
  }

  removeOne(values: {
    where: WhereCondition,
    orderBy?: OrderByField[]
  }) {
    const { where, orderBy = [] } = values || {};
    this.throwEmptyObjectError(where, this.printPrefixMessage('RemoveOne :: Where condition cannot be empty'));
    const SQLBuild = this.initSQLBuilder();
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
    const SQLBuild = this.initSQLBuilder();
    return SQLBuild.deleteFrom(this.tableName)
      .where(where)
      .orderBy(orderBy);
  }
}