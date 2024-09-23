import {
  DeleteQueryBuilder,
  FieldAlias,
  FromQueryBuilder,
  GroupByQueryBuilder,
  InsertOptions,
  InsertQueryBuilder,
  InsertValues,
  JoinQueryBuilder,
  JoinType,
  LimitQueryBuilder,
  OffsetQueryBuilder,
  OrderByField,
  OrderByQueryBuilder,
  QueryFunction,
  SelectFields,
  SelectQueryBuilder,
  SetQueryBuilder,
  SetValues,
  SQL_CONSTRUCTORS,
  UpdateOptions,
  UpdateQueryBuilder,
  UpdateQueryBuilderWithoutSet,
  WhereCondition,
  WhereQueryBuilder
} from '@dto/types';

export class SQLBuilder<ColumnKeys extends string, QueryReturnType = any> implements
  SelectQueryBuilder<ColumnKeys, QueryReturnType>,
  FromQueryBuilder<ColumnKeys, QueryReturnType>,
  JoinQueryBuilder<ColumnKeys, QueryReturnType>,
  WhereQueryBuilder<ColumnKeys, QueryReturnType>,
  GroupByQueryBuilder<QueryReturnType>,
  OrderByQueryBuilder<QueryReturnType>,
  LimitQueryBuilder<QueryReturnType>,
  OffsetQueryBuilder<QueryReturnType>,
  DeleteQueryBuilder<ColumnKeys, QueryReturnType>,
  UpdateQueryBuilder<ColumnKeys, QueryReturnType>,
  UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>,
  SetQueryBuilder<ColumnKeys, QueryReturnType>,
  InsertQueryBuilder<QueryReturnType> {
  queryParts: SQL_CONSTRUCTORS;
  private queryFn?: QueryFunction;

  constructor(queryFn?: QueryFunction) {
    this.queryParts = {
      count: { sql: "", params: [] },
      select: { sql: "", params: [] },
      from: { sql: "", params: [] },
      join: { sql: "", params: [] },
      where: { sql: "", params: [] },
      groupBy: { sql: "", params: [] },
      orderBy: { sql: "", params: [] },
      limit: { sql: "", params: [] },
      offset: { sql: "", params: [] },
      insert: { sql: "", params: [] },
      update: { sql: "", params: [] },
      set: { sql: "", params: [] },
      delete: { sql: "", params: [] },
    };
    this.queryFn = queryFn;
  }

  private extractTableAndAlias(table: string, alias?: string): [string, string | undefined] {
    let tableName: string;
    let extractedAlias: string | undefined;

    if (alias) {
      tableName = table;
    } else {
      [tableName, extractedAlias] = table.split(' ');
    }

    return [tableName, alias || extractedAlias];
  }

  private getCurrentUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000); // Unix timestamp
  }

  private processFields<T extends string>(fields: SelectFields<T>): { sql: string, params: string[] } {
    const wildcardPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.\*$/; // Checking for table.* pattern

    if (typeof fields === 'string') {
      if (fields === '*') {
        // Select all fields
        return { sql: 'SELECT *', params: [] };
      } else if (wildcardPattern.test(fields)) {
        // Select specific one field with wildcard e.g. table.*
        return { sql: `SELECT ${fields}`, params: [] };
      } else {
        // Select specific one field
        return { sql: 'SELECT ??', params: [fields] };
      }
    } else if (Array.isArray(fields) && fields.length > 0) {
      // Select multiple fields
      const fieldClauses = fields.map((field) => {
        if (typeof field === 'string') {
          return wildcardPattern.test(field) ? field : '??';
        } else if (typeof field === 'object') {
          return Object.entries(field).map(([col, alias]) => alias ? '?? AS ??' : '??').join(', ');
        }
      });

      // Flatten the field definitions
      const fieldParams = fields.flatMap((field) => {
        if (typeof field === 'string') {
          return wildcardPattern.test(field) ? [] : [field];
        } else if (typeof field === 'object') {
          return Object.entries(field).flatMap(([col, alias]) => alias ? [col, alias] : [col]);
        }
      });

      return { sql: `SELECT ${fieldClauses.join(', ')}`, params: fieldParams as string[] || [] };
    } else {
      return { sql: 'SELECT *', params: [] };
    }
  }

  private uniqueFields<T extends string>(fields: (T | FieldAlias<T>)[]) {
    const seen = new Map<string, T | FieldAlias<T>>();

    fields.forEach(field => {
      if (typeof field === 'string') {
        seen.set(field, field);
      } else if (typeof field === 'object') {
        const key = Object.keys(field)[0];
        const value = field[key as T];
        const fieldString = `${key}:${value}`;
        if (!seen.has(fieldString)) {
          seen.set(fieldString, field);
        }
      }
    });
    return Array.from(seen.values());
  }

  private buildWhereClause(conditions: WhereCondition<ColumnKeys>, parentOperator: string = 'AND'): { clause: string, params: any[] } {
    const processConditions = (conditions: WhereCondition<ColumnKeys>, parentOperator: string = 'AND'): { clause: string, params: any[] } => {
      const clauses: string[] = [];
      const localParams: any[] = [];

      for (const key in conditions) {
        const value = (conditions as any)[key];

        if (key === 'AND' || key === 'OR') {
          const nestedConditions = value as WhereCondition<ColumnKeys>[];
          const nestedClauses = nestedConditions.map(nestedCondition => processConditions(nestedCondition, key));
          const nestedClauseStrings = nestedClauses.map(nestedResult => `(${nestedResult.clause})`);
          clauses.push(nestedClauseStrings.join(` ${key} `));
          nestedClauses.forEach(nestedResult => localParams.push(...nestedResult.params));
        } else {
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_.]/g, '');

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            for (const operator in value) {
              if (operator === 'IN' && Array.isArray(value[operator])) {
                clauses.push(`${sanitizedKey} IN (${value[operator].map(() => '?').join(', ')})`);
                localParams.push(...value[operator]);
              } else if (operator === 'BETWEEN' && Array.isArray(value[operator]) && value[operator].length === 2) {
                clauses.push(`${sanitizedKey} BETWEEN ? AND ?`);
                localParams.push(value[operator][0], value[operator][1]);
              } else if (operator === 'NOT_BETWEEN' && Array.isArray(value[operator]) && value[operator].length === 2) {
                clauses.push(`${sanitizedKey} NOT BETWEEN ? AND ?`);
                localParams.push(value[operator][0], value[operator][1]);
              } else if (['=', '!=', '<', '<=', '>', '>=', 'LIKE'].includes(operator)) {
                clauses.push(`${sanitizedKey} ${operator} ?`);
                localParams.push(value[operator]);
              } else if (['IS_NULL', 'IS_NOT_NULL'].includes(operator)) {
                clauses.push(`${sanitizedKey} ${operator.replace(/_/g, ' ')}`);
              } else {
                throw new Error(`Unsupported operator: ${operator}`);
              }
            }
          } else {
            clauses.push(`${sanitizedKey} = ?`);
            localParams.push(value);
          }
        }
      }

      return { clause: clauses.join(` ${parentOperator} `), params: localParams };
    };

    return processConditions(conditions, parentOperator);
  }

  // For simple count query e.g. SELECT COUNT(*) FROM table
  count(field: string = '*', alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    const countClause = `COUNT(${field === '*' ? '*' : '??'})`;
    this.queryParts.select.sql = `SELECT ${alias ? `${countClause} AS ??` : countClause}`;
    this.queryParts.select.params = field === '*' ? [] : [field];
    if (alias) {
      this.queryParts.select.params.push(alias);
    }
    return this;
  }

  max(field: string, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.queryParts.select.sql = `SELECT MAX(??)${alias ? ` AS ??` : ''}`;
    this.queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  min(field: string, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.queryParts.select.sql = `SELECT MIN(??)${alias ? ` AS ??` : ''}`;
    this.queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  avg(field: string, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.queryParts.select.sql = `SELECT AVG(??)${alias ? ` AS ??` : ''}`;
    this.queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  sum(field: string, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.queryParts.select.sql = `SELECT SUM(??)${alias ? ` AS ??` : ''}`;
    this.queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  select(fields: SelectFields<ColumnKeys>): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    const _fields = Array.isArray(fields) ? this.uniqueFields<ColumnKeys>(fields) : fields;
    const { sql, params } = this.processFields<ColumnKeys>(_fields);
    this.queryParts.select.sql = sql;
    this.queryParts.select.params = params;
    return this
  }

  from(table: string, alias?: string): FromQueryBuilder<ColumnKeys, QueryReturnType> {
    const [tableName, extractedAlias] = this.extractTableAndAlias(table, alias);

    this.queryParts.from.sql = `FROM ??`;
    this.queryParts.from.params = [tableName];
    if (extractedAlias) {
      this.queryParts.from.sql += ` AS ??`;
      this.queryParts.from.params.push(alias || extractedAlias);
    }
    return this;
  }

  // Overload signatures for the join method
  join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
  join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder<ColumnKeys, QueryReturnType>;
  // Implementation of the join method
  join(joinType: JoinType, table: string, aliasOrOnCondition: string, onCondition?: string): JoinQueryBuilder<ColumnKeys, QueryReturnType> {
    let alias: string | undefined;
    let actualOnCondition: string;

    if (onCondition) {
      alias = aliasOrOnCondition;
      actualOnCondition = onCondition;
    } else {
      actualOnCondition = aliasOrOnCondition;
    }

    const [tableName, extractedAlias] = this.extractTableAndAlias(table, alias);

    const joinClause = `${joinType.toUpperCase()} JOIN ??${extractedAlias ? ' AS ??' : ''} ON ${actualOnCondition}`;
    const joinParams = extractedAlias ? [tableName, extractedAlias] : [tableName];

    // Append the new join clause and parameters
    this.queryParts.join.sql += (this.queryParts.join.sql ? ' ' : '') + joinClause;
    this.queryParts.join.params.push(...joinParams);
    return this;
  }

  where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType> {
    const { clause, params } = this.buildWhereClause(conditions);
    this.queryParts.where.sql = clause ? `WHERE ${clause}` : '';
    this.queryParts.where.params = params;
    return this;
  }

  groupBy(fields: string | string[]): GroupByQueryBuilder<QueryReturnType> {
    if (typeof fields === 'string') {
      this.queryParts.groupBy.sql = 'GROUP BY ??';
      this.queryParts.groupBy.params = [fields];
    } else if (Array.isArray(fields) && fields.length > 0) {
      this.queryParts.groupBy.sql = 'GROUP BY ' + fields.map(() => '??').join(', ');
      this.queryParts.groupBy.params = fields;
    }
    return this;
  }

  orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType> {
    if (fields.length === 0) return this;
    this.queryParts.orderBy.sql = `ORDER BY ${fields.map(({ field, direction }) => `?? ${direction || 'ASC'}`).join(', ')}`;
    this.queryParts.orderBy.params = fields.map(({ field }) => field);
    return this;
  }

  limit(limit: number): LimitQueryBuilder<QueryReturnType> {
    if (limit < 0) return this;
    this.queryParts.limit.sql = `LIMIT ?`;
    this.queryParts.limit.params = [limit];
    return this;
  }

  offset(offset: number): OffsetQueryBuilder<QueryReturnType> {
    if (offset < 0) return this;
    this.queryParts.offset.sql = `OFFSET ?`;
    this.queryParts.offset.params = [offset];
    return this;
  }
  update(table: string): UpdateQueryBuilder<ColumnKeys, QueryReturnType>;
  update(table: string, values: SetValues): UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
  update(table: string, values: SetValues, options?: UpdateOptions): UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
  update(table: string, values?: SetValues, options?: UpdateOptions): UpdateQueryBuilder<ColumnKeys, QueryReturnType> | UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType> {
    const utimeField = options?.utimeField || 'utime';
    const { enableTimestamps = false } = options || {};

    if (enableTimestamps) {
      const currentTime = this.getCurrentUnixTimestamp();
      if (values) {
        values[utimeField] = currentTime;
      }
    }


    this.queryParts.update.sql = `UPDATE ??`;
    this.queryParts.update.params = [table];

    if (Object.keys(values || {}).length === 0) {
      throw new Error('Please provide data to update');
    }

    if (values) {
      this.set(values);
      return this as UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
    }
    return this;
  }

  set(values: SetValues): SetQueryBuilder<ColumnKeys, QueryReturnType> {
    const setClauses = Object.keys(values).map(key => `?? = ?`);
    const setParams = Object.entries(values).flatMap(([key, value]) => [key, value]);
    this.queryParts.set.sql = `SET ${setClauses.join(', ')}`;
    this.queryParts.set.params = setParams;
    return this;
  }

  insert(table: string, values: InsertValues, options?: InsertOptions): InsertQueryBuilder<QueryReturnType> {
    const ctimeField = options?.ctimeField || 'ctime';
    const utimeField = options?.utimeField || 'utime';

    const { enableTimestamps = false } = options || {};
    if (enableTimestamps) {
      const currentTime = this.getCurrentUnixTimestamp();
      values[ctimeField] = currentTime;
      values[utimeField] = currentTime;
    }

    const columns = Object.keys(values); // e.g. ['name', 'email', 'password']
    const placeholders = columns.map(() => '?').join(', '); // e.g. '?, ?, ?'
    const columnPlaceholders = columns.map(() => '??').join(', '); // e.g. 'name, email, password'
    const valueParams = Object.values(values); // e.g. ['John Doe', '
    const columnParams = columns;

    let insertClause = `INSERT ${options?.insertIgnore ? 'IGNORE ' : ''}INTO ?? (${columnPlaceholders}) VALUES (${placeholders})`;

    if (options?.onDuplicateKeyUpdate) {
      const updateColumns = Object.keys(options.onDuplicateKeyUpdate).map(key => '?? = ?').join(', ');
      const updateParams = Object.entries(options.onDuplicateKeyUpdate).flatMap(([key, value]) => [key, value]);
      insertClause += ` ON DUPLICATE KEY UPDATE ${updateColumns}`;
      valueParams.push(...updateParams);
    }

    this.queryParts.insert.sql = insertClause;
    this.queryParts.insert.params = [table, ...columnParams, ...valueParams];
    return this;
  }

  deleteFrom(table: string): DeleteQueryBuilder<ColumnKeys, QueryReturnType> {
    this.queryParts.delete.sql = `DELETE FROM ??`;
    this.queryParts.delete.params = [table];
    return this;
  }

  buildQuery(): {
    sql: string;
    params: any[];
    [Symbol.iterator](): Iterator<any>
  } {
    const sql = [
      // Reminder: The order of these parts matter
      this.queryParts.count.sql,
      this.queryParts.select.sql,
      this.queryParts.update.sql,
      this.queryParts.insert.sql,
      this.queryParts.delete.sql,
      this.queryParts.set.sql,
      this.queryParts.from.sql,
      this.queryParts.join.sql,
      this.queryParts.where.sql,
      this.queryParts.groupBy.sql,
      this.queryParts.orderBy.sql,
      this.queryParts.limit.sql,
      this.queryParts.offset.sql,
    ].filter(Boolean).join(' ').trim();

    const params = [
      // Reminder: The order of these parts matter
      ...(this.queryParts.count.params || []),
      ...(this.queryParts.select.params || []),
      ...(this.queryParts.update.params || []),
      ...(this.queryParts.insert.params || []),
      ...(this.queryParts.delete.params || []),
      ...(this.queryParts.set.params || []),
      ...(this.queryParts.from.params || []),
      ...(this.queryParts.join.params || []),
      ...(this.queryParts.where.params || []),
      ...(this.queryParts.groupBy.params || []),
      ...(this.queryParts.orderBy.params || []),
      ...(this.queryParts.limit.params || []),
      ...(this.queryParts.offset.params || []),
    ];
    return {
      sql,
      params,
      // For allowing array destructuring
      [Symbol.iterator](): Iterator<any> {
        let index = 0;
        const values = [sql, params];
        return {
          next(): IteratorResult<any> {
            if (index < values.length) {
              return { value: values[index++], done: false };
            } else {
              return { value: undefined, done: true };
            }
          }
        };
      }
    };
  }

  executeQuery<T = QueryReturnType>(): Promise<T> {
    const [sql, params] = this.buildQuery();
    if (!this.queryFn) throw new Error('Please provide a query function to execute the query in the BuildSQLModel constructor');
    return this.queryFn<T>(sql, params);
  }
}
