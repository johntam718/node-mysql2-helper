"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLBuilder = void 0;
class SQLBuilder {
    queryParts;
    queryFn;
    constructor(queryFn) {
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
    extractTableAndAlias(table, alias) {
        let tableName;
        let extractedAlias;
        if (alias) {
            tableName = table;
        }
        else {
            [tableName, extractedAlias] = table.split(' ');
        }
        return [tableName, alias || extractedAlias];
    }
    getCurrentUnixTimestamp() {
        return Math.floor(Date.now() / 1000); // Unix timestamp
    }
    processFields(fields) {
        const wildcardPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\.\*$/; // Checking for table.* pattern
        if (typeof fields === 'string') {
            if (fields === '*') {
                // Select all fields
                return { sql: 'SELECT *', params: [] };
            }
            else if (wildcardPattern.test(fields)) {
                // Select specific one field with wildcard e.g. table.*
                return { sql: `SELECT ${fields}`, params: [] };
            }
            else {
                // Select specific one field
                return { sql: 'SELECT ??', params: [fields] };
            }
        }
        else if (Array.isArray(fields) && fields.length > 0) {
            // Select multiple fields
            const fieldClauses = fields.map((field) => {
                if (typeof field === 'string') {
                    return wildcardPattern.test(field) ? field : '??';
                }
                else if (typeof field === 'object') {
                    return Object.entries(field).map(([col, alias]) => alias ? '?? AS ??' : '??').join(', ');
                }
            });
            // Flatten the field definitions
            const fieldParams = fields.flatMap((field) => {
                if (typeof field === 'string') {
                    return wildcardPattern.test(field) ? [] : [field];
                }
                else if (typeof field === 'object') {
                    return Object.entries(field).flatMap(([col, alias]) => alias ? [col, alias] : [col]);
                }
            });
            return { sql: `SELECT ${fieldClauses.join(', ')}`, params: fieldParams || [] };
        }
        else {
            return { sql: 'SELECT *', params: [] };
        }
    }
    checkEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    }
    checkTableName(tableName, caller) {
        if (!tableName) {
            throw new Error(this.printPrefixMessage('Table name is required'));
        }
    }
    throwEmptyObjectError(obj, message) {
        if (this.checkEmptyObject(obj)) {
            throw new Error(message || 'Object cannot be empty');
        }
    }
    printPrefixMessage(message) {
        return `[SQLBuilder] :: ${message}`;
    }
    uniqueFields(fields) {
        const seen = new Map();
        fields.forEach(field => {
            if (typeof field === 'string') {
                seen.set(field, field);
            }
            else if (typeof field === 'object') {
                const key = Object.keys(field)[0];
                const value = field[key];
                const fieldString = `${key}:${value}`;
                if (!seen.has(fieldString)) {
                    seen.set(fieldString, field);
                }
            }
        });
        return Array.from(seen.values());
    }
    buildWhereClause(conditions, parentOperator = 'AND') {
        const processConditions = (conditions, parentOperator = 'AND') => {
            const clauses = [];
            const localParams = [];
            for (const key in conditions) {
                const value = conditions[key];
                if (key === 'AND' || key === 'OR') {
                    if (!Array.isArray(value) || value.length === 0) {
                        throw new Error(this.printPrefixMessage(`processConditions :: ${key} :: condition must be a non-empty array`));
                    }
                    const nestedConditions = value;
                    const nestedClauses = nestedConditions.map(nestedCondition => processConditions(nestedCondition, key));
                    const nestedClauseStrings = nestedClauses.map(nestedResult => `(${nestedResult.clause})`);
                    clauses.push(nestedClauseStrings.join(` ${key} `));
                    nestedClauses.forEach(nestedResult => localParams.push(...nestedResult.params));
                }
                else {
                    const sanitizedKey = key.replace(/[^a-zA-Z0-9_.]/g, '');
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        for (const operator in value) {
                            // Handle IN, BETWEEN, NOT_BETWEEN, =, !=, <, <=, >, >=, LIKE, IS_NULL, IS_NOT_NULL
                            if (operator === 'IN' && Array.isArray(value[operator])) {
                                if (value[operator].length === 0) {
                                    throw new Error(this.printPrefixMessage(`processConditions :: IN :: condition must be a non-empty array`));
                                }
                                clauses.push(`${sanitizedKey} IN (${value[operator].map(() => '?').join(', ')})`);
                                localParams.push(...value[operator]);
                            }
                            else if (operator === 'BETWEEN' && Array.isArray(value[operator])) {
                                if (value[operator].length !== 2) {
                                    throw new Error(this.printPrefixMessage(`processConditions :: BETWEEN :: condition must be an array with exactly 2 elements`));
                                }
                                clauses.push(`${sanitizedKey} BETWEEN ? AND ?`);
                                localParams.push(value[operator][0], value[operator][1]);
                            }
                            else if (operator === 'NOT_BETWEEN' && Array.isArray(value[operator])) {
                                if (value[operator].length !== 2) {
                                    throw new Error(this.printPrefixMessage(`processConditions :: NOT_BETWEEN :: condition must be an array with exactly 2 elements`));
                                }
                                clauses.push(`${sanitizedKey} NOT BETWEEN ? AND ?`);
                                localParams.push(value[operator][0], value[operator][1]);
                            }
                            else if (['=', '!=', '<', '<=', '>', '>=', 'LIKE'].includes(operator)) {
                                clauses.push(`${sanitizedKey} ${operator} ?`);
                                localParams.push(value[operator]);
                            }
                            else if (['IS_NULL', 'IS_NOT_NULL'].includes(operator)) {
                                if (value[operator] !== true) {
                                    throw new Error(this.printPrefixMessage(`processConditions :: ${operator} :: condition must be true`));
                                }
                                clauses.push(`${sanitizedKey} ${operator.replace(/_/g, ' ')}`);
                            }
                            else {
                                throw new Error(this.printPrefixMessage(`processConditions :: Unsupported operator: ${operator}`));
                            }
                        }
                    }
                    else {
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
    count(field = '*', alias) {
        const countClause = `COUNT(${field === '*' ? '*' : '??'})`;
        this.queryParts.select.sql = `SELECT ${alias ? `${countClause} AS ??` : countClause}`;
        this.queryParts.select.params = field === '*' ? [] : [field];
        if (alias) {
            this.queryParts.select.params.push(alias);
        }
        return this;
    }
    max(field, alias) {
        this.queryParts.select.sql = `SELECT MAX(??)${alias ? ` AS ??` : ''}`;
        this.queryParts.select.params = alias ? [field, alias] : [field];
        return this;
    }
    min(field, alias) {
        this.queryParts.select.sql = `SELECT MIN(??)${alias ? ` AS ??` : ''}`;
        this.queryParts.select.params = alias ? [field, alias] : [field];
        return this;
    }
    avg(field, alias) {
        this.queryParts.select.sql = `SELECT AVG(??)${alias ? ` AS ??` : ''}`;
        this.queryParts.select.params = alias ? [field, alias] : [field];
        return this;
    }
    sum(field, alias) {
        this.queryParts.select.sql = `SELECT SUM(??)${alias ? ` AS ??` : ''}`;
        this.queryParts.select.params = alias ? [field, alias] : [field];
        return this;
    }
    select(fields = "*") {
        const _fields = Array.isArray(fields) ? this.uniqueFields(fields) : fields;
        const { sql, params } = this.processFields(_fields);
        this.queryParts.select.sql = sql;
        this.queryParts.select.params = params;
        return this;
    }
    from(table, alias) {
        this.checkTableName(table, 'from');
        const [tableName, extractedAlias] = this.extractTableAndAlias(table, alias);
        this.queryParts.from.sql = `FROM ??`;
        this.queryParts.from.params = [tableName];
        if (extractedAlias) {
            this.queryParts.from.sql += ` AS ??`;
            this.queryParts.from.params.push(alias || extractedAlias);
        }
        return this;
    }
    // Implementation of the join method
    join(joinType, table, aliasOrOnCondition, onCondition) {
        let alias;
        let actualOnCondition;
        if (onCondition) {
            alias = aliasOrOnCondition;
            actualOnCondition = onCondition;
        }
        else {
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
    where(conditions) {
        const { clause, params } = this.buildWhereClause(conditions);
        this.queryParts.where.sql = clause ? `WHERE ${clause}` : '';
        this.queryParts.where.params = params;
        return this;
    }
    groupBy(fields) {
        if (typeof fields === 'string') {
            this.queryParts.groupBy.sql = 'GROUP BY ??';
            this.queryParts.groupBy.params = [fields];
        }
        else if (Array.isArray(fields) && fields.length > 0) {
            this.queryParts.groupBy.sql = 'GROUP BY ' + fields.map(() => '??').join(', ');
            this.queryParts.groupBy.params = fields;
        }
        return this;
    }
    orderBy(fields) {
        if (!Array.isArray(fields) || fields.length === 0)
            return this;
        this.queryParts.orderBy.sql = `ORDER BY ${fields.map(({ field, direction }) => `?? ${direction || 'ASC'}`).join(', ')}`;
        this.queryParts.orderBy.params = fields.map(({ field }) => field);
        return this;
    }
    limit(limit) {
        if (isNaN(limit) || limit < 0)
            return this;
        this.queryParts.limit.sql = `LIMIT ?`;
        this.queryParts.limit.params = [limit];
        return this;
    }
    offset(offset) {
        if (isNaN(offset) || offset < 0)
            return this;
        this.queryParts.offset.sql = `OFFSET ?`;
        this.queryParts.offset.params = [offset];
        return this;
    }
    update(table, values, options) {
        this.checkTableName(table, 'update');
        const { enableTimestamps = false, utimeField = 'utime', utimeValue = this.getCurrentUnixTimestamp(), primaryKey } = options || {};
        if (enableTimestamps) {
            const currentTime = utimeValue;
            if (values) {
                values[utimeField] = currentTime;
            }
        }
        // Avoid updating the primary key
        if ((primaryKey && values) && values?.[primaryKey]) {
            delete values[primaryKey];
        }
        this.queryParts.update.sql = `UPDATE ??`;
        this.queryParts.update.params = [table];
        this.throwEmptyObjectError(values, this.printPrefixMessage('Update :: Data cannot be empty'));
        if (values) {
            this.set(values);
            return this;
        }
        return this;
    }
    set(values) {
        this.throwEmptyObjectError(values, this.printPrefixMessage('Set :: Values cannot be empty'));
        const setClauses = Object.keys(values).map(key => `?? = ?`);
        const setParams = Object.entries(values).flatMap(([key, value]) => [key, value]);
        this.queryParts.set.sql = `SET ${setClauses.join(', ')}`;
        this.queryParts.set.params = setParams;
        return this;
    }
    insert(table, values, options) {
        this.checkTableName(table, 'insert');
        const { enableTimestamps = false, ctimeField = 'ctime', utimeField = 'utime', ctimeValue = this.getCurrentUnixTimestamp(), utimeValue = this.getCurrentUnixTimestamp(), } = options || {};
        const isMultipleInsert = Array.isArray(values);
        const rows = isMultipleInsert ? values : [values];
        if (isMultipleInsert && rows.length === 0) {
            throw new Error(this.printPrefixMessage('Insert :: Values cannot be empty'));
        }
        if (enableTimestamps) {
            rows.forEach((row) => {
                row[ctimeField] = ctimeValue;
                row[utimeField] = utimeValue;
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
        this.queryParts.insert.sql = insertClause;
        this.queryParts.insert.params = [table, ...columnParams, ...valueParams];
        return this;
    }
    deleteFrom(table) {
        this.checkTableName(table, 'delete');
        this.queryParts.delete.sql = `DELETE FROM ??`;
        this.queryParts.delete.params = [table];
        return this;
    }
    buildQuery() {
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
            [Symbol.iterator]() {
                let index = 0;
                const values = [sql, params];
                return {
                    next() {
                        if (index < values.length) {
                            return { value: values[index++], done: false };
                        }
                        else {
                            return { value: undefined, done: true };
                        }
                    }
                };
            }
        };
    }
    executeQuery() {
        if (!this.queryFn)
            throw new Error(this.printPrefixMessage('executeQuery :: Query function is not defined / provided in the constructor'));
        const [sql, params] = this.buildQuery();
        return this.queryFn(sql, params);
    }
}
exports.SQLBuilder = SQLBuilder;
//# sourceMappingURL=sql-builder-class.js.map