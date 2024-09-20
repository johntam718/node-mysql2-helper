import {
  DeleteQueryBuilder,
  FromQueryBuilder,
  InsertOptions,
  InsertQueryBuilder,
  InsertValues,
  // GroupByQueryBuilder,
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

export class SQLBuilder<QueryReturnType> implements
  SelectQueryBuilder<QueryReturnType>,
  FromQueryBuilder<QueryReturnType>,
  JoinQueryBuilder<QueryReturnType>,
  WhereQueryBuilder<QueryReturnType>,
  // GroupByQueryBuilder,
  OrderByQueryBuilder<QueryReturnType>,
  LimitQueryBuilder<QueryReturnType>,
  OffsetQueryBuilder<QueryReturnType>,
  DeleteQueryBuilder<QueryReturnType>,
  UpdateQueryBuilder<QueryReturnType>,
  UpdateQueryBuilderWithoutSet<QueryReturnType>,
  SetQueryBuilder<QueryReturnType>,
  InsertQueryBuilder<QueryReturnType>
  {
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

  // For simple count query e.g. SELECT COUNT(*) FROM table
  count(field: string = '*', alias?: string): SelectQueryBuilder<QueryReturnType> {
    const countClause = `COUNT(${field === '*' ? '*' : '??'})`;
    this.queryParts.select.sql = `SELECT ${alias ? `${countClause} AS ??` : countClause}`;
    this.queryParts.select.params = field === '*' ? [] : [field];
    if (alias) {
      this.queryParts.select.params.push(alias);
    }
    return this;
  }

  select(fields: SelectFields): SelectQueryBuilder<QueryReturnType> {
    const wildcardPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.\*$/; // Checking for table.* pattern

    if (typeof fields === 'string') {
      if (fields === '*') {
        // Select all fields
        this.queryParts.select.sql = 'SELECT *';
        this.queryParts.select.params = [];
      } else if (wildcardPattern.test(fields)) {
        // Select specific one field with wildcard e.g. 'table.*'
        this.queryParts.select.sql = `SELECT ${fields}`;
        this.queryParts.select.params = [];
      } else {
        // Select specific one field
        this.queryParts.select.sql = 'SELECT ??';
        this.queryParts.select.params = [fields];
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
          // Return the field if it's a wildcard pattern e.g. 'table.*'
          return wildcardPattern.test(field) ? [] : [field];
        } else if (typeof field === 'object') {
          // Return the field and alias if it's an object e.g. { 'table.column': 'alias' }
          return Object.entries(field).flatMap(([col, alias]) => alias ? [col, alias] : [col]);
        }
      });
      // console.log(fieldClauses)
      // console.log(fieldParams)
      this.queryParts.select.sql = `SELECT ${fieldClauses.join(', ')}`;
      this.queryParts.select.params = fieldParams;
    } else {
      this.queryParts.select.sql = 'SELECT *';
      this.queryParts.select.params = [];
    }

    return this;
  }

  from(table: string, alias?: string): FromQueryBuilder<QueryReturnType> {
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
  join(joinType: JoinType, table: string, onCondition: string): JoinQueryBuilder<QueryReturnType>;
  join(joinType: JoinType, table: string, alias: string, onCondition: string): JoinQueryBuilder<QueryReturnType>;
  // Implementation of the join method
  join(joinType: JoinType, table: string, aliasOrOnCondition: string, onCondition?: string): JoinQueryBuilder<QueryReturnType> {
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

  where(conditions: WhereCondition): WhereQueryBuilder<QueryReturnType> {
    const { clause, params } = this.buildWhereClause(conditions);
    this.queryParts.where.sql = clause ? `WHERE ${clause}` : '';
    this.queryParts.where.params = params;
    return this;
  }

  // groupBy(fields: string[]): SQLBuilder {
  //   this.queryParts.groupBy.sql = `GROUP BY ${fields.map(() => '??').join(', ')}`;
  //   this.queryParts.groupBy.params = fields;
  //   return this;
  // }

  orderBy(fields: OrderByField[]): OrderByQueryBuilder<QueryReturnType> {
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
  update(table: string): UpdateQueryBuilder<QueryReturnType>;
  update(table: string, values: SetValues): UpdateQueryBuilderWithoutSet<QueryReturnType>;
  update(table: string, values: SetValues, options?: UpdateOptions): UpdateQueryBuilderWithoutSet<QueryReturnType>;
  update(table: string, values?: SetValues, options?: UpdateOptions): UpdateQueryBuilder<QueryReturnType> | UpdateQueryBuilderWithoutSet<QueryReturnType> {
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
      return this as UpdateQueryBuilderWithoutSet<QueryReturnType>;
    }
    return this;
  }

  set(values: SetValues): SetQueryBuilder<QueryReturnType> {
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

  deleteFrom(table: string): DeleteQueryBuilder<QueryReturnType> {
    this.queryParts.delete.sql = `DELETE FROM ??`;
    this.queryParts.delete.params = [table];
    return this;
  }

  // private buildWhereClause(conditions: WhereCondition): { clause: string, params: any[] } {
  //   const whereClauses: string[] = [];
  //   const params: any[] = [];

  //   for (const key in conditions) {
  //     const value = conditions[key]; // e.g. { name: { 'LIKE': 'John%' } }
  //     const sanitizedKey = key.replace(/[^a-zA-Z0-9_.]/g, ''); // Filter out non-alphanumeric characters

  //     if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
  //       for (const operator in value) {
  //         // handle IN condition
  //         if (operator === 'IN' && Array.isArray(value[operator])) {
  //           whereClauses.push(`${sanitizedKey} IN (${value[operator].map(() => '?').join(', ')})`);
  //           params.push(...value[operator]);

  //           // handle BETWEEN condition
  //         } else if (operator === 'BETWEEN' && Array.isArray(value[operator]) && value[operator].length === 2) {
  //           whereClauses.push(`${sanitizedKey} BETWEEN ? AND ?`);
  //           params.push(value[operator][0], value[operator][1]);
  //         } else if (operator === 'NOT_BETWEEN' && Array.isArray(value[operator]) && value[operator].length === 2) {
  //           whereClauses.push(`${sanitizedKey} NOT BETWEEN ? AND ?`);
  //           params.push(value[operator][0], value[operator][1]);

  //           // handle LIKE and other operators
  //         } else if (['=', '!=', '<', '<=', '>', '>=', 'LIKE'].includes(operator)) {
  //           whereClauses.push(`${sanitizedKey} ${operator} ?`);
  //           params.push((value as any)[operator]);

  //           // handle IS NULL and IS NOT NULL
  //         } else if (['IS_NULL', 'IS_NOT_NULL'].includes(operator)) {
  //           // whereClauses.push(`${sanitizedKey} ${operator.replaceAll('_', ' ')}`);
  //           whereClauses.push(`${sanitizedKey} ${operator.replace(/_/g, ' ')}`);
  //         }
  //         else {
  //           throw new Error(`Unsupported operator: ${operator}`);
  //         }
  //       }
  //     } else {
  //       // Default to equality
  //       whereClauses.push(`${sanitizedKey} = ?`);
  //       params.push(value);
  //     }
  //   }

  //   return { clause: whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '', params };
  // }

  private buildWhereClause(conditions: WhereCondition, parentOperator: string = 'AND'): { clause: string, params: any[] } {
    const processConditions = (conditions: WhereCondition, parentOperator: string = 'AND'): { clause: string, params: any[] } => {
      const clauses: string[] = [];
      const localParams: any[] = [];

      for (const key in conditions) {
        const value = (conditions as any)[key];

        if (key === 'AND' || key === 'OR') {
          const nestedConditions = value as WhereCondition[];
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
    if (!this.queryFn) throw new Error('Please provide a query function to execute the query in the constructor');
    return this.queryFn<T>(sql, params);
  }
}
