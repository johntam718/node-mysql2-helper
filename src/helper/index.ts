import { SQLBuilder } from "@dto/sql-builder-class";
import { InsertOptions, OrderByField, SelectFields, SetValues, UpdateOptions, WhereCondition } from "@dto/types";
import { createDelete, createInsert, createSelect, createUpdate } from "@lib/helper";

export class BuildSQLModel<T extends string> {
  private tableName: string;
  private columns: T[];

  constructor(tableName: string, columns: T[]) {
    this.tableName = tableName;
    this.columns = columns;
  }

  private checkEmptyObject(obj: Object) {
    return Object.keys(obj).length === 0;
  }

  private throwEmptyObjectError(obj: Object) {
    if (this.checkEmptyObject(obj)) {
      throw new Error('Where condition cannot be empty');
    }
  }

  findOne(values: {
    fields?: T[],
    // fields?: T[] SelectFields,
    where: WhereCondition,
    orderBy?: OrderByField[],
  }) {
    const { where, orderBy = [], fields = "*" } = values;
    this.throwEmptyObjectError(where);
    const SQLBuild = new SQLBuilder();
    return SQLBuild.select(fields)
      .from(this.tableName)
      .where(where)
      .orderBy(orderBy)
      .limit(1);
    // return createSelect(this.tableName)()
    //   .where(where)
    //   .orderBy(orderBy)
    //   .limit(1);
  }

  findAll(values?: { where?: WhereCondition, orderBy?: OrderByField[] }) {
    const { where = {}, orderBy = [] } = values || {};
    return createSelect(this.tableName)()
      .where(where)
      .orderBy(orderBy);
  }

  updateOne(values: { data: SetValues, where: WhereCondition, options?: UpdateOptions }) {
    const { data, where, options } = values || {};
    return createUpdate(this.tableName, options)(data)
      .where(where)
      .limit(1);
  }

  updateAll(values: { data: SetValues, where?: WhereCondition, options?: UpdateOptions }) {
    const { data, where = {}, options } = values || {};
    return createUpdate(this.tableName, options)(data)
      .where(where);
  }

  create(values: SetValues, options?: InsertOptions) {
    return createInsert(this.tableName, options)(values);
  }

  removeOne(values: { where: WhereCondition, orderBy?: OrderByField[] }) {
    const { where, orderBy = [] } = values;
    return createDelete(this.tableName)(where, orderBy).limit(1);
  }

  remove(values: { where: WhereCondition, orderBy?: OrderByField[] }) {
    const { where = {}, orderBy = [] } = values || {};
    // Prevent accidental deletion of all records
    if (Object.keys(where).length === 0) {
      throw new Error('DELETE without WHERE condition is not allowed');
    }
    return createDelete(this.tableName)(where, orderBy);
  }
}