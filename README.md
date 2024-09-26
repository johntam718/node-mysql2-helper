# node-mysql-query-utils

A MySQL query builder and helper for Node.js, written in TypeScript.

[![npm version](https://badge.fury.io/js/node-mysql-query-utils.svg)](https://badge.fury.io/js/node-mysql-query-utils)
<!-- [![npm downloads](https://img.shields.io/npm/dm/node-mysql-query-utils.svg)](https://www.npmjs.com/package/node-mysql-query-utils) -->

## Installation

```bash
npm install node-mysql-query-utils
```

or

```bash
yarn add node-mysql-query-utils
```

## Usage

### Database Management

The **`DatabaseManagement`** class is a singleton class that helps manage database connections. It supports connecting to single or multiple databases and provides a way to retrieve instances of the connections.

#### Example

Single database connection

```typescript
import { DatabaseManagement } from 'node-mysql-query-utils';
import { ConnectionOptions } from 'mysql2/promise';

// Define connection configurations
const config: ConnectionOptions = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'test_db'
};

// Connect to a single database
DatabaseManagement.connectSingleDatabase('mainDB', config);

// Retrieve the instance and use it to perform database operations
const dbInstance = DatabaseManagement.getInstance('mainDB');

```

Multiple database connections

```typescript
import { DatabaseManagement } from 'node-mysql-query-utils';
import { type DatabaseConnectionConfig } from 'node-mysql-query-utils/dist/dto/types';

// Define multiple connection configurations
const configs: DatabaseConnectionConfig[]  = [
  {
    identifierName: 'mainDB',
    config: {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'main_db'
    }
  },
  {
    identifierName: 'analyticsDB',
    config: {
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'analytics_db'
    }
  }
];

// Connect to multiple databases
DatabaseManagement.connectMultipleDatabases(configs);

// Retrieve instances and use them to perform database operations
const mainDBInstance = DatabaseManagement.getInstance('mainDB');
const analyticsDBInstance = DatabaseManagement.getInstance('analyticsDB');

```


### Summary

- **Example**: Shows how to connect to a single database and retrieve the instance.
- **Connecting to Multiple Databases**: Demonstrates how to connect to multiple databases and retrieve their instances.
- **API**: Documents the main methods of the [`DatabaseManagement`] class.


### Table Model

The **`TableModel`** class provides a way to build a table model from a JSON object. The table model can be used to create a table in a database.

#### Example

```typescript
import { DatabaseManagement, TableModel, sqlHelper } from 'node-mysql-query-utils';

// Connected to a database
const dbInstance = DatabaseManagement.getInstance('mainDB');

// Define the columns of the table
const columns = sqlHelper.createColumns([
  'user_id',
  'ctime',
  'utime',
  'email',
  'mobile',
  'password',
  'is_active',
  'is_deleted',
]);

// E.g. Create a table model for a user table
// Define the table model by using the DatabaseManagement instance
const userAccountModel = master.createTableModel({
  tableName: 'user_account',
  primaryKey: 'user_id',
  columns,
});

// or

// Define the table model by using the TableModel class directly
const userAccountModel = new TableModel({
  tableName: 'user_account',
  primaryKey: 'user_id',
  columns,
  queryFn: db.query.bind(db) // Optional: put your own query function here if you don't connect DB by DatabaseManagement class
});
```

#### Query Function

The **queryFn** is an optional function that should match the following type definition:

```typescript
type QueryFunction = <T>(sql: string, params?: any[]) => Promise<T>;
```

### Summary

- **Example**: Shows how to create a table model for a user table.
- **API**: Documents the main methods of the [`TableModel`] class.


### SQL Builder

The **`SQLBuilder`** class provides a way to build SQL queries for CRUD operations.

#### Example

```typescript
import { SQLBuilder } from 'node-mysql-query-utils';

// Define the table name
const tableName = 'user_account';

// Create an instance of the SQLBuilder class
const sqlBuilder = new SQLBuilder();

// Call buildQuery to get the SQL query and parameters
const { sql, params } = sqlBuilder.select().from(tableName).buildQuery();
// Can also use array destructuring
const [sql, params] = sqlBuilder.select().from(tableName).buildQuery();

```
### .select() Method

```typescript
// Select all columns, default is '*'
const [sql, params] = sqlBuilder.select().from(tableName).buildQuery();
const [sql, params] = sqlBuilder.select('*').from(tableName).buildQuery();

// Select specific columns
const [sql, params] = sqlBuilder.select(['user_id', 'email'])
  .from(tableName)
  .buildQuery();

// Select columns with aliases
const [sql, params] = sqlBuilder
  .select([{ user_id: 'id', mobile: 'user_mobile' }, { email: 'user_email' }])
  .from(tableName)
  .buildQuery();

// Select a single column
const [sql, params] = sqlBuilder.select('user_id').from(tableName).buildQuery();
```

### .from() Method

```typescript
// No alias
const [sql, params] = sqlBuilder.select().from('user_account').buildQuery();

// alias example
const [sql, params] = sqlBuilder.select().from('user_account', 'u').buildQuery();
const [sql, params] = sqlBuilder.select().from('user_account u',).buildQuery();
```

### .join() Method

```typescript
// Inner join
const [sql, params] = sqlBuilder
  .select()
  .from('user_account', 'u')
  .join('INNER', 'user_profile_pic', 'up', 'u.user_profile_pic_id = up.user_profile_pic_id')
  .buildQuery();

// Left join
const [sql, params] = sqlBuilder
  .select()
  .from('user_account', 'u')
  .join('LEFT', 'user_profile_pic', 'up', 'u.user_profile_pic_id = up.user_profile_pic_id')
  .buildQuery();

// Right join
const [sql, params] = sqlBuilder
  .select()
  .from('user_account', 'u')
  .join('RIGHT', 'user_profile_pic', 'up', 'u.user_profile_pic_id = up.user_profile_pic_id')
  .buildQuery();
```

Only provide third argument if no alias is needed

```typescript
// Inner join
const [sql, params] = sqlBuilder
  .select()
  .from('user_account', 'u')
  .join('INNER', 'user_profile_pic', 'u.user_profile_pic_id = up.user_profile_pic_id')
  .buildQuery();
```

### .where() Method

```typescript
// All condition examples
const [sql, params] = sqlBuilder
  .select()
  .from('user_account')
  .where({
    email: '123@gmail.com', // exact match
    user_id: { ">": 123 },
    user_id: { "<": 123 },
    nickname: { IS_NOT_NULL: true }, // must be true
    is_active: { BETWEEN: [0, 1] },
    status: { IN: [1, 2, 3, 4] },
    'u.user_id': { "!=": 1 } // assume alias is set in From's second parameters
  })
  .buildQuery();
```

Supported Operators:

- `=`
- `!=`
- `>`
- `<`
- `>=`
- `<=`
- `LIKE`
- `IN`
- `BETWEEN`
- `NOT_BETWEEN`
- `IS_NULL`
- `IS_NOT_NULL`

### .orderBy() Method

```typescript
// Single order by
const [sql, params] = sqlBuilder
  .select()
  .from('user_account')
  .orderBy([{ field: 'email', direction: 'ASC' }])
  .buildQuery();

// Multiple order by
const [sql, params] = sqlBuilder
  .select()
  .from('user_account')
  .orderBy([
    { field: 'email', direction: 'ASC' },
    { field: 'user_id', direction: 'DESC' }
  ])
  .buildQuery();
```

### .limit() and .offset() Methods

```typescript
// Limit
const [sql, params] = sqlBuilder
  .select()
  .from('user_account')
  .limit(10)
  .buildQuery();

// Limit and offset
const [sql, params] = sqlBuilder
  .select()
  .from('user_account')
  .limit(10)
  .offset(5)
  .buildQuery();
```

### .insert() Method

```typescript
// Insert single row
const [sql, params] = sqlBuilder
  .insert('user_account', {email: '123@gmail.com'}, {
    enableTimestamps = false, // if true, will add ctime and utime to insert object
    ctimeField = 'ctime',
    utimeField = 'utime',
    ctimeValue = this.getCurrentUnixTimestamp(), // default is current unix timestamp
    utimeValue = this.getCurrentUnixTimestamp(), // default is current unix timestamp
  })
  .buildQuery();
```

### .update() Method

```typescript
// // Update single row
// const [sql, params] = sqlBuilder
//   .update('user_account', {email: '

