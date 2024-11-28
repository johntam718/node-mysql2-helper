import {
  BuildQueryOptions,
  ColumnData,
  DeleteQueryBuilder,
  FieldAlias,
  FromQueryBuilder,
  GroupByField,
  GroupByQueryBuilder,
  InsertOptions,
  InsertQueryBuilder,
  InsertValue,
  JoinQueryBuilder,
  JoinType,
  LimitQueryBuilder,
  OffsetQueryBuilder,
  OrderByField,
  OrderByQueryBuilder,
  QueryFunction,
  RawField,
  SelectFields,
  SelectQueryBuilder,
  SetQueryBuilder,
  SQL_CONSTRUCTORS,
  UpdateOptions,
  UpdateQueryBuilder,
  UpdateQueryBuilderWithoutSet,
  UpdateValue,
  WhereCondition,
  WhereQueryBuilder
} from '@dto/types';
import { format as _format } from 'mysql2';

// Type Guards
function isRawField<T extends string>(field: any): field is RawField {
  return field && typeof field === 'object' && 'raw' in field && typeof field.raw === 'string';
}

function isFieldAlias<T extends string>(field: any): field is FieldAlias<T> {
  return field && typeof field === 'object' && !('raw' in field);
}

export class SQLBuilder<ColumnKeys extends string, QueryReturnType = any> {
  #queryParts: SQL_CONSTRUCTORS;
  queryFn?: QueryFunction;
  message: string = 'Call .buildQuery() or .executeQuery() to get the result';
  constructor(queryFn?: QueryFunction) {
    this.#queryParts = {
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

  // private processFields<T extends string>(fields: SelectFields<T>): { sql: string, params: string[] } {
  //   const wildcardPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.\*$/; // Checking for table.* pattern

  //   if (typeof fields === 'string') {
  //     if (fields === '*') {
  //       // Select all fields
  //       return { sql: 'SELECT *', params: [] };
  //     } else if (wildcardPattern.test(fields)) {
  //       // Select specific one field with wildcard e.g. table.*
  //       return { sql: `SELECT ${fields}`, params: [] };
  //     } else {
  //       // Select specific one field
  //       return { sql: 'SELECT ??', params: [fields] };
  //     }
  //   } else if (Array.isArray(fields) && fields.length > 0) {
  //     // Select multiple fields
  //     const fieldClauses = fields.map((field) => {
  //       if (typeof field === 'string') {
  //         return wildcardPattern.test(field) ? field : '??';
  //       } else if (typeof field === 'object') {
  //         return Object.entries(field).map(([col, alias]) => alias ? '?? AS ??' : '??').join(', ');
  //       }
  //     });

  //     // Flatten the field definitions
  //     const fieldParams = fields.flatMap((field) => {
  //       if (typeof field === 'string') {
  //         return wildcardPattern.test(field) ? [] : [field];
  //       } else if (typeof field === 'object') {
  //         return Object.entries(field).flatMap(([col, alias]) => alias ? [col, alias] : [col]);
  //       }
  //     });

  //     return { sql: `SELECT ${fieldClauses.join(', ')}`, params: fieldParams as string[] || [] };
  //   } else {
  //     return { sql: 'SELECT *', params: [] };
  //   }
  // }

  private processFields<T extends string>(
    fields: SelectFields<T>
  ): { sql: string; params: any[] } {
    const wildcardPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.\*$/; // Pattern to match table.* (e.g., c.*)

    if (typeof fields === 'string') {
      if (fields === '*') {
        // Case 1: Select all fields
        return { sql: 'SELECT *', params: [] };
      } else if (wildcardPattern.test(fields)) {
        // Case 2: Select all fields from a specific table (e.g., c.*)
        return { sql: `SELECT ${fields}`, params: [] };
      } else {
        // Case 3: Select a single specific field with placeholder
        return { sql: 'SELECT ??', params: [fields] };
      }
    } else if (Array.isArray(fields) && fields.length > 0) {
      // Handling an array of fields
      const fieldClauses: string[] = []; // Array to accumulate SQL fragments for fields
      const fieldParams: any[] = []; // Array to accumulate parameters corresponding to placeholders

      fields.forEach((field) => {
        if (typeof field === 'string') {
          if (wildcardPattern.test(field)) {
            // Field is in the format table.*
            fieldClauses.push(field);
          } else {
            // Regular field with placeholder
            fieldClauses.push('??');
            fieldParams.push(field);
          }
        } else if (isFieldAlias(field)) {
          // Field with an alias (e.g., { email: 'email_address' })
          Object.entries(field).forEach(([col, alias]) => {
            fieldClauses.push('?? AS ??'); // SQL fragment with two placeholders
            fieldParams.push(col, alias); // Corresponding parameters
          });
        } else if (isRawField(field)) {
          // Raw SQL field (e.g., { raw: 'COUNT(*)', alias: 'total' })
          let rawField = field.raw;
          if (field.alias) {
            // Append alias if provided
            rawField += ` AS \`${field.alias}\``;
          }
          fieldClauses.push(rawField); // Insert raw SQL directly without placeholders

          if (field.params) {
            // Append raw field parameters to the main params array
            fieldParams.push(...field.params);
          }
        }
      });

      // Combine all field clauses into a single SELECT statement
      const sql = `SELECT ${fieldClauses.join(', ')}`;
      return { sql, params: fieldParams };
    } else if (typeof fields === 'object' && fields !== null) {
      // Handling a single field object
      if (isRawField(fields)) {
        // Single RawField object
        let rawField = fields.raw;
        if (fields.alias) {
          // Append alias if provided
          rawField += ` AS \`${fields.alias}\``;
        }
        const params = fields.params ? [...fields.params] : []; // Clone params if they exist
        return { sql: `SELECT ${rawField}`, params };
      }

      // Single FieldAlias object (e.g., { email: 'email_address' })
      const aliases = Object.entries(fields)
        .map(([col, alias]) => `?? AS ??`)
        .join(', ');
      const params = Object.entries(fields).flatMap(([col, alias]) => [col, alias]);
      return { sql: `SELECT ${aliases}`, params };
    } else {
      // Default case: Select all fields
      return { sql: 'SELECT *', params: [] };
    }
  }

  private checkEmptyObject(obj: Object) {
    return Object.keys(obj || {}).length === 0;
  }

  private checkTableName(tableName: string, caller?: string) {
    if (!tableName) {
      throw new Error(this.printPrefixMessage('Table name is required'));
    }
  }

  private throwEmptyObjectError(obj: Object, message?: string) {
    if (this.checkEmptyObject(obj)) {
      throw new Error(message || 'Object cannot be empty');
    }
  }

  private printPrefixMessage(message: string) {
    return `[SQLBuilder] :: ${message}`;
  }

  // private uniqueFields<T extends string>(fields: (T | FieldAlias<T>)[]) {
  //   const seen = new Map<string, T | FieldAlias<T>>();

  //   fields.forEach(field => {
  //     if (typeof field === 'string') {
  //       seen.set(field, field);
  //     } else if (typeof field === 'object') {
  //       const key = Object.keys(field)[0];
  //       const value = field[key as T];
  //       const fieldString = `${key}:${value}`;
  //       if (!seen.has(fieldString)) {
  //         seen.set(fieldString, field);
  //       }
  //     }
  //   });
  //   return Array.from(seen.values());
  // }
  private uniqueFields<T extends string>(
    fields: Array<T | FieldAlias<T> | RawField>
  ): Array<T | FieldAlias<T> | RawField> {
    const seen = new Map<string, T | FieldAlias<T> | RawField>();

    fields.forEach((field) => {
      if (typeof field === 'string') {
        // Handle string fields
        if (!seen.has(field)) {
          seen.set(field, field);
        }
      } else if (isRawField<T>(field)) {
        // Handle RawField
        const key = field.alias ? `${field.raw} AS ${field.alias}` : field.raw;
        if (!seen.has(key)) {
          seen.set(key, field);
        }
      } else if (isFieldAlias<T>(field)) {
        // Handle FieldAlias
        const key = Object.keys(field)[0];
        const alias = field[key as T];
        const fieldString = alias ? `${key}:${alias}` : key;
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
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error(this.printPrefixMessage(`processConditions :: ${key} :: condition must be a non-empty array`));
          }
          const nestedConditions = value as WhereCondition<ColumnKeys>[];
          const nestedClauses = nestedConditions.map(nestedCondition => processConditions(nestedCondition, key));
          const nestedClauseStrings = nestedClauses.map(nestedResult => `(${nestedResult.clause})`);
          clauses.push(nestedClauseStrings.join(` ${key} `));
          nestedClauses.forEach(nestedResult => localParams.push(...nestedResult.params));
        } else {
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_.]/g, '');

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            for (const operator in value) {
              // Handle IN
              if (operator === 'IN' && Array.isArray(value[operator])) {
                if (value[operator].length === 0) {
                  throw new Error(this.printPrefixMessage(`processConditions :: IN :: condition must be a non-empty array`));
                }
                clauses.push(`${sanitizedKey} IN (${value[operator].map(() => '?').join(', ')})`);
                localParams.push(...value[operator]);
                // Handle NOT_IN
              } else if (operator === 'NOT_IN' && Array.isArray(value[operator])) {
                if (value[operator].length === 0) {
                  throw new Error(this.printPrefixMessage(`processConditions :: NOT_IN :: condition must be a non-empty array`));
                }
                clauses.push(`${sanitizedKey} NOT IN (${value[operator].map(() => '?').join(', ')})`);
                localParams.push(...value[operator]);
                // Handle BETWEEN
              } else if (operator === 'BETWEEN' && Array.isArray(value[operator])) {
                if (value[operator].length !== 2) {
                  throw new Error(this.printPrefixMessage(`processConditions :: BETWEEN :: condition must be an array with exactly 2 elements`));
                }
                clauses.push(`${sanitizedKey} BETWEEN ? AND ?`);
                localParams.push(value[operator][0], value[operator][1]);
                // Handle NOT_BETWEEN
              } else if (operator === 'NOT_BETWEEN' && Array.isArray(value[operator])) {
                if (value[operator].length !== 2) {
                  throw new Error(this.printPrefixMessage(`processConditions :: NOT_BETWEEN :: condition must be an array with exactly 2 elements`));
                }
                clauses.push(`${sanitizedKey} NOT BETWEEN ? AND ?`);
                localParams.push(value[operator][0], value[operator][1]);
                // Handle =, !=, <, <=, >, >=
              } else if (['=', '!=', '<', '<=', '>', '>='].includes(operator)) {
                clauses.push(`${sanitizedKey} ${operator} ?`);
                localParams.push(value[operator]);
                // Handle LIKE, NOT LIKE
              } else if (operator === 'LIKE' || operator === 'NOT_LIKE') {
                const patternType = value[operator];
                const clauseString = `${sanitizedKey} ${operator === 'NOT_LIKE' ? 'NOT LIKE' : 'LIKE'} ?`;
                if (typeof patternType === 'string') {
                  // Direct string pattern
                  clauses.push(clauseString);
                  localParams.push(patternType);
                } else if (typeof patternType === 'object' && patternType !== null) {
                  // Validation step to ensure only one of contains, startsWith, or endsWith is present
                  const patternKeys = ['contains', 'startsWith', 'endsWith'];
                  const presentKeys = patternKeys.filter(key => key in patternType);
                  if (presentKeys.length > 1) {
                    throw new Error(this.printPrefixMessage(`processConditions :: ${operator} :: Only one of 'contains', 'startsWith', or 'endsWith' can be provided`));
                  }
                  switch (true) {
                    case !!patternType.contains:
                      clauses.push(clauseString);
                      localParams.push(`%${patternType.contains}%`);
                      break;
                    case !!patternType.startsWith:
                      clauses.push(clauseString);
                      localParams.push(`${patternType.startsWith}%`);
                      break;
                    case !!patternType.endsWith:
                      clauses.push(clauseString);
                      localParams.push(`%${patternType.endsWith}`);
                      break;
                    default:
                      throw new Error(this.printPrefixMessage(`processConditions :: ${operator} :: Invalid pattern type`));
                  }
                }
                // Handle REGEXP
              } else if (operator === "REGEXP") {
                if (typeof value[operator] !== 'string' || value[operator].length === 0) {
                  throw new Error(this.printPrefixMessage(`processConditions :: ${operator} :: condition must be a non empty string`));
                }
                clauses.push(`${sanitizedKey} REGEXP ?`);
                localParams.push(value[operator]);
                // Handle IS_NULL, IS_NOT_NULL
              } else if (['IS_NULL', 'IS_NOT_NULL'].includes(operator)) {
                if (value[operator] !== true) {
                  throw new Error(this.printPrefixMessage(`processConditions :: ${operator} :: condition must be true`));
                }
                clauses.push(`${sanitizedKey} ${operator.replace(/_/g, ' ')}`);
              } else {
                throw new Error(this.printPrefixMessage(`processConditions :: Unsupported operator: ${operator}`));
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
  count(field: ColumnKeys | (string & {}) = '*', alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    const countClause = `COUNT(${field === '*' ? '*' : '??'})`;
    this.#queryParts.select.sql = `SELECT ${alias ? `${countClause} AS ??` : countClause}`;
    this.#queryParts.select.params = field === '*' ? [] : [field];
    if (alias) {
      this.#queryParts.select.params.push(alias);
    }
    return this;
  }

  max(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.#queryParts.select.sql = `SELECT MAX(??)${alias ? ` AS ??` : ''}`;
    this.#queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  min(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.#queryParts.select.sql = `SELECT MIN(??)${alias ? ` AS ??` : ''}`;
    this.#queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  avg(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.#queryParts.select.sql = `SELECT AVG(??)${alias ? ` AS ??` : ''}`;
    this.#queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  sum(field: ColumnKeys, alias?: string): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    this.#queryParts.select.sql = `SELECT SUM(??)${alias ? ` AS ??` : ''}`;
    this.#queryParts.select.params = alias ? [field, alias] : [field];
    return this;
  }

  select(fields: SelectFields<ColumnKeys> = "*"): SelectQueryBuilder<ColumnKeys, QueryReturnType> {
    const _fields = Array.isArray(fields) ? this.uniqueFields<ColumnKeys>(fields) : fields;
    const { sql, params } = this.processFields<ColumnKeys>(_fields as SelectFields<ColumnKeys>);
    this.#queryParts.select.sql = sql;
    this.#queryParts.select.params = params;
    return this
  }

  from(table: string, alias?: string): FromQueryBuilder<ColumnKeys, QueryReturnType> {
    this.checkTableName(table, 'from');
    const [tableName, extractedAlias] = this.extractTableAndAlias(table, alias);

    this.#queryParts.from.sql = `FROM ??`;
    this.#queryParts.from.params = [tableName];
    if (extractedAlias) {
      this.#queryParts.from.sql += ` AS ??`;
      this.#queryParts.from.params.push(alias || extractedAlias);
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
    this.#queryParts.join.sql += (this.#queryParts.join.sql ? ' ' : '') + joinClause;
    this.#queryParts.join.params.push(...joinParams);
    return this;
  }

  where(conditions: WhereCondition<ColumnKeys>): WhereQueryBuilder<ColumnKeys, QueryReturnType> {
    const { clause, params } = this.buildWhereClause(conditions);
    this.#queryParts.where.sql = clause ? `WHERE ${clause}` : '';
    this.#queryParts.where.params = params;
    return this;
  }

  groupBy(fields: GroupByField<ColumnKeys>): GroupByQueryBuilder<QueryReturnType> {
    if (typeof fields === 'string') {
      this.#queryParts.groupBy.sql = 'GROUP BY ??';
      this.#queryParts.groupBy.params = [fields];
    } else if (Array.isArray(fields) && fields.length > 0) {
      this.#queryParts.groupBy.sql = 'GROUP BY ' + fields.map(() => '??').join(', ');
      this.#queryParts.groupBy.params = fields;
    }
    return this;
  }

  orderBy(fields: OrderByField<ColumnKeys>[]): OrderByQueryBuilder<QueryReturnType> {
    if (!Array.isArray(fields) || fields.length === 0) return this;
    this.#queryParts.orderBy.sql = `ORDER BY ${fields.map(({ field, direction }) => `?? ${direction || 'ASC'}`).join(', ')}`;
    this.#queryParts.orderBy.params = fields.map(({ field }) => field);
    return this;
  }

  limit(limit: number): LimitQueryBuilder<QueryReturnType> {
    if (isNaN(limit) || limit < 0) return this;
    this.#queryParts.limit.sql = `LIMIT ?`;
    this.#queryParts.limit.params = [limit];
    return this;
  }

  offset(offset: number): OffsetQueryBuilder<QueryReturnType> {
    if (isNaN(offset) || offset < 0) return this;
    this.#queryParts.offset.sql = `OFFSET ?`;
    this.#queryParts.offset.params = [offset];
    return this;
  }
  update(table: string): UpdateQueryBuilder<ColumnKeys, QueryReturnType>;
  update(table: string, values: UpdateValue<ColumnKeys>): UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
  update(table: string, values: UpdateValue<ColumnKeys>, options?: UpdateOptions): UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
  update(table: string, values?: UpdateValue<ColumnKeys>, options?: UpdateOptions): UpdateQueryBuilder<ColumnKeys, QueryReturnType> | UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType> {
    this.checkTableName(table, 'update');
    const {
      enableTimestamps = false,
      utimeField = 'utime',
      utimeValue = this.getCurrentUnixTimestamp(),
      primaryKey
    } = options || {};

    if (enableTimestamps) {
      const currentTime = utimeValue;
      if (values) {
        (values as Record<string, any>)[utimeField] = currentTime;
      }
    }

    // Avoid updating the primary key
    if ((primaryKey && values) && (values as Record<string, any>)?.[primaryKey]) {
      delete (values as Record<string, any>)[primaryKey];
    }

    this.#queryParts.update.sql = `UPDATE ??`;
    this.#queryParts.update.params = [table];

    if (values) {
      this.throwEmptyObjectError(values as Object, this.printPrefixMessage('Update :: Data cannot be empty'));
      this.set(values);
      return this as UpdateQueryBuilderWithoutSet<ColumnKeys, QueryReturnType>;
    }
    return this;
  }

  set(values: UpdateValue<ColumnKeys>): SetQueryBuilder<ColumnKeys, QueryReturnType> {
    this.throwEmptyObjectError(values, this.printPrefixMessage('Set :: Values cannot be empty'));

    // Both increment and decrement cannot be provided for the same field
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('increment' in value && 'decrement' in value) {
          throw new Error(`Set :: Both increment and decrement provided for field ${key}`);
        }
      }
    });

    // const setClauses = Object.keys(values).map(key => `?? = ?`);
    // const setParams = Object.entries(values).flatMap(([key, value]) => [key, value]);
    const setClauses = Object.keys(values).map(key => {
      const value = values[key as ColumnKeys];
      if (typeof value === 'object' && value !== null) {
        if ('increment' in value) {
          return `?? = ?? + ?`;
        } else if ('decrement' in value) {
          return `?? = ?? - ?`;
        }
      }
      return `?? = ?`;
    });

    const setParams = Object.entries(values).flatMap(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if ('increment' in value) {
          return [key, key, value.increment];
        } else if ('decrement' in value) {
          return [key, key, value.decrement];
        }
      }
      return [key, value];
    });
    this.#queryParts.set.sql = `SET ${setClauses.join(', ')}`;
    this.#queryParts.set.params = setParams;
    return this;
  }

  insert(table: string, values: InsertValue<ColumnKeys>, options?: InsertOptions): InsertQueryBuilder<QueryReturnType> {
    this.checkTableName(table, 'insert');
    const {
      enableTimestamps = false,
      ctimeField = 'ctime',
      utimeField = 'utime',
      ctimeValue = this.getCurrentUnixTimestamp(),
      utimeValue = this.getCurrentUnixTimestamp(),
    } = options || {};

    const isMultipleInsert = Array.isArray(values);
    const rows = isMultipleInsert ? values : [values];

    if (isMultipleInsert && rows.length === 0) {
      throw new Error(this.printPrefixMessage('Insert :: Values cannot be empty'));
    }

    if (enableTimestamps) {
      rows.forEach((row) => {
        (row as Record<string, any>)[ctimeField] = ctimeValue;
        (row as Record<string, any>)[utimeField] = utimeValue;
      });
    }

    const columns = Object.keys(rows[0]); // e.g. ['name', 'email', 'password']
    const placeholders = columns.map(() => '?').join(', '); // e.g. '?, ?, ?'
    const columnPlaceholders = columns.map(() => '??').join(', '); // e.g. 'name, email, password'
    const valueParams = rows.flatMap(row => Object.values(row)); // e.g. ['doe', 'doe@gmail.com', 'password']
    const columnParams = columns;

    const valuesPlaceholders = rows.map(() => `(${placeholders})`).join(', '); // e.g. '(?, ?, ?), (?, ?, ?)'

    let insertClause = `INSERT ${options?.insertIgnore ? 'IGNORE ' : ''}INTO ?? (${columnPlaceholders}) VALUES ${valuesPlaceholders}`;

    if (options?.onDuplicateKeyUpdate) {
      const updateColumns = Object.keys(options.onDuplicateKeyUpdate).map(key => '?? = ?').join(', ');
      const updateParams = Object.entries(options.onDuplicateKeyUpdate).flatMap(([key, value]) => [key, value]);
      insertClause += ` ON DUPLICATE KEY UPDATE ${updateColumns}`;
      valueParams.push(...updateParams);
    }

    this.#queryParts.insert.sql = insertClause;
    this.#queryParts.insert.params = [table, ...columnParams, ...valueParams];
    return this;
  }

  deleteFrom(table: string): DeleteQueryBuilder<ColumnKeys, QueryReturnType> {
    this.checkTableName(table, 'delete');
    this.#queryParts.delete.sql = `DELETE FROM ??`;
    this.#queryParts.delete.params = [table];
    return this;
  }

  buildQuery(options?: BuildQueryOptions): {
    sql: string;
    params: any[];
    [Symbol.iterator](): Iterator<any>
  } {
    let sql = '';
    let params: any[] = [];

    // Handle COUNT clause
    if (this.#queryParts.count.sql) {
      sql += this.#queryParts.count.sql;
      params.push(...this.#queryParts.count.params);
    }

    // Handle SELECT clause
    if (this.#queryParts.select.sql) {
      sql += this.#queryParts.select.sql;
      params.push(...this.#queryParts.select.params);
    }

    // Handle UPDATE clause
    if (this.#queryParts.update.sql) {
      sql += this.#queryParts.update.sql;
      params.push(...this.#queryParts.update.params);
    }

    // Handle INSERT clause
    if (this.#queryParts.insert.sql) {
      sql += this.#queryParts.insert.sql;
      params.push(...this.#queryParts.insert.params);
    }

    // Handle DELETE clause
    if (this.#queryParts.delete.sql) {
      sql += this.#queryParts.delete.sql;
      params.push(...this.#queryParts.delete.params);
    }

    // Handle SET clause
    if (this.#queryParts.set.sql) {
      sql += ` ${this.#queryParts.set.sql}`;
      params.push(...this.#queryParts.set.params);
    }

    // Handle FROM clause
    if (this.#queryParts.from.sql) {
      sql += ` ${this.#queryParts.from.sql}`;
      params.push(...this.#queryParts.from.params);
    }

    // Handle JOIN clauses
    if (this.#queryParts.join.sql) {
      sql += ` ${this.#queryParts.join.sql}`;
      params.push(...this.#queryParts.join.params);
    }

    // Handle WHERE clause
    if (this.#queryParts.where.sql) {
      sql += ` ${this.#queryParts.where.sql}`;
      params.push(...this.#queryParts.where.params);
    }

    // Handle GROUP BY clause
    if (this.#queryParts.groupBy.sql) {
      sql += ` ${this.#queryParts.groupBy.sql}`;
      params.push(...this.#queryParts.groupBy.params);
    }

    // Handle ORDER BY clause
    if (this.#queryParts.orderBy.sql) {
      sql += ` ${this.#queryParts.orderBy.sql}`;
      params.push(...this.#queryParts.orderBy.params);
    }

    // Handle LIMIT clause
    if (this.#queryParts.limit.sql) {
      sql += ` ${this.#queryParts.limit.sql}`;
      params.push(...this.#queryParts.limit.params);
    }

    // Handle OFFSET clause
    if (this.#queryParts.offset.sql) {
      sql += ` ${this.#queryParts.offset.sql}`;
      params.push(...this.#queryParts.offset.params);
    }

    // Format SQL if required
    if (options?.format) {
      sql = _format(sql, params);
      params = [];
    }
    return {
      sql,
      params: params,
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
    if (!this.queryFn) throw new Error(this.printPrefixMessage('executeQuery :: Query function is not defined / provided in the constructor'));
    const [sql, params] = this.buildQuery();
    return this.queryFn<T>(sql, params);
  }
}
