# node-mysql-query-utils

A MySQL query builder and helper for Node.js.

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

### Common usage

```typescript
import { DatabaseManagement, TableModel, SQLBuilder, sqlHelper } from "node-mysql-query-utils";

// entry point of the application e.g. start server
// index.ts
DatabaseManagement.connectMultipleDatabases([
  {
    identifierName: 'mainDB',
    config: {
      host: "localhost",
      user: "root",
      password: "password",
      database: "test_db",
    },
  }
]);

// model folder
// user.ts
const mainDB = DatabaseManagement.getInstance('mainDB'); // referring to the identifierName
const columns = sqlHelper.createColumns([
  "user_id",
  "ctime",
  "utime",
  "email",
  "mobile",
  "password",
  "is_active",
  "is_deleted",
]);
export const userAccountModel = mainDB.createTableModel({
  tableName: "user_account",
  primaryKey: "user_id",
  columns,
  centralFields: {
    ctimeField: 'ctime', // created_at column name in db
    utimeField: 'utime', // updated_at column name in db
    isActiveField: 'is_active', // is_active column name in db
    isDeletedField: 'is_deleted', // is_deleted column name in db
    statusField: 'status', // status column name in db
  }
});

// usage of userAccountModel in other files e.g. api-related files
// get user by id
  const [user] = await userModel.findOne({ where: { user_id: 1234 } }).executeQuery();
// get all users
  const users = await userModel.findAll().executeQuery();

// updateOne user
  const updatedOneUser = await userModel.updateOne({
    where: { user_id: 1052 }, 
    data: { email: '123@gmail.com' } 
  }).executeQuery()

// deleteOne user
  const deletedOneUser =  await userModel.removeOne({
    where: { user_id: { ">": 1234 } },
    orderBy: [{ field: 'user_id', direction: 'ASC' }]
  }).executeQuery()

// deleteAll users
  const deletedAllUsers = await userModel.remove({ where: { user_id: 1234 } }).executeQuery()

// soft delete user
// update is_deleted = 1, utime = current_timestamp
  const softDeletedUser =  await userModel.softDelete({
    where: { user_id: 1234 },
    value: 1,
    options: { enableTimestamps: true, deleteField: 'is_deleted', utimeField: 'utime' }
  }).executeQuery();

// patch single field
  const patchedActiveField = await userModel.patchSingleField({
    patchField: 'is_active',
    where: { user_id: 1234 },
    value: 1,
    options: { enableTimestamps: true, utimeField: 'utime' } // update updated_at field
  }).executeQuery();

```

### Database Management

The **`DatabaseManagement`** class is a singleton class that helps manage database connections. It supports connecting to single or multiple databases and provides a way to retrieve instances of the connections.

#### Example

Single database connection

```typescript
import { DatabaseManagement } from "node-mysql-query-utils";
import { ConnectionOptions } from "mysql2/promise";

// Define connection configurations
const config: ConnectionOptions = {
  host: "localhost",
  user: "root",
  password: "password",
  database: "test_db",
};

// Connect to a single database
DatabaseManagement.connectSingleDatabase("mainDB", config);

// Retrieve the instance and use it to perform database operations
const dbInstance = DatabaseManagement.getInstance("mainDB");
```

Multiple database connections

```typescript
import { DatabaseManagement } from "node-mysql-query-utils";
import { type DatabaseConnectionConfig } from "node-mysql-query-utils/dist/dto/types";

// Define multiple connection configurations
const configs: DatabaseConnectionConfig[] = [
  {
    identifierName: "mainDB",
    config: {
      host: "localhost",
      user: "root",
      password: "password",
      database: "main_db",
    },
  },
  {
    identifierName: "analyticsDB",
    config: {
      host: "localhost",
      user: "root",
      password: "password",
      database: "analytics_db",
    },
  },
];

// Connect to multiple databases
DatabaseManagement.connectMultipleDatabases(configs);

// Retrieve instances and use them to perform database operations
const mainDBInstance = DatabaseManagement.getInstance("mainDB");
const analyticsDBInstance = DatabaseManagement.getInstance("analyticsDB");
```

### Summary

- **Example**: Shows how to connect to a single database and retrieve the instance.
- **Connecting to Multiple Databases**: Demonstrates how to connect to multiple databases and retrieve their instances.
- **API**: Documents the main methods of the [`DatabaseManagement`] class.

### Table Model

The **`TableModel`** class provides a way to build a table model from a JSON object. The table model can be used to create a table in a database.

#### Example

```typescript
import {
  DatabaseManagement,
  TableModel,
  sqlHelper,
} from "node-mysql-query-utils";

// Connected to a database
const dbInstance = DatabaseManagement.getInstance("mainDB");

// Define the columns of the table
const columns = sqlHelper.createColumns([
  "user_id",
  "ctime",
  "utime",
  "email",
  "mobile",
  "password",
  "is_active",
  "is_deleted",
]);

// E.g. Create a table model for a user table
// Define the table model by using the DatabaseManagement instance
const userAccountModel = master.createTableModel({
  tableName: "user_account",
  primaryKey: "user_id",
  columns,
});

// or

// Define the table model by using the TableModel class directly
const userAccountModel = new TableModel({
  tableName: "user_account",
  primaryKey: "user_id",
  columns,
  queryFn: db.query.bind(db), // Optional: put your own query function here if you don't connect DB by DatabaseManagement class from this package
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
import { SQLBuilder, sqlHelper } from "node-mysql-query-utils";

// Define the table name
const tableName = "user_account";

// Javascript
const sqlBuilder = new SQLBuilder();

const columns = sqlHelper.createColumns([
  "user_id",
  "ctime",
  "utime",
  "email",
  "mobile",
  "password",
  "is_active",
  "is_deleted",
]);

// typescript
const sqlBuilder = new SQLBuilder<typeof columns[number]>();

// Accept QueryFunction for SQLBuilder to enable query execution
const sqlBuilder = new SQLBuilder(db.query.bind(db)); // Optional: put your own query function here if you don't connect DB by DatabaseManagement class from this package

// Accept second generic type for query function
const sqlBuilder = new SQLBuilder<typeof columns[number], any>(db.query.bind(db)); // Optional: put your own query function here if you don't connect DB by DatabaseManagement class from this package

// Call buildQuery to get the SQL query and parameters in the end
const { sql, params } = sqlBuilder.select().from(tableName).buildQuery();
// Can also use array destructuring
const [sql, params] = sqlBuilder.select().from(tableName).buildQuery();
// BuildQuery also accepts an options object. it will return complete query with format. params will be empty array if format is true
const [sql, params] = sqlBuilder.select().from(tableName).buildQuery({ format: true });

// run your own query function if you don't connect DB by DatabaseManagement class from this package
const result = await db.query(sql, params);

// if query function is provided in SQLBuilder, you can execute the query directly
const result = await sqlBuilder.select().from(tableName).executeQuery();
```

### .select() Method

```typescript
// Select all columns, default is '*'
const [sql, params] = sqlBuilder.select().from(tableName).buildQuery();
const [sql, params] = sqlBuilder.select("*").from(tableName).buildQuery();

// Select specific columns
const [sql, params] = sqlBuilder
  .select(["user_id", "email"])
  .from(tableName)
  .buildQuery();

// Select columns with aliases
const [sql, params] = sqlBuilder
  .select([{ user_id: "id", mobile: "user_mobile" }, { email: "user_email" }])
  .from(tableName)
  .buildQuery();

// Select a single column
const [sql, params] = sqlBuilder.select("user_id").from(tableName).buildQuery();
```

### .from() Method

```typescript
// No alias
const [sql, params] = sqlBuilder.select().from("user_account").buildQuery();

// alias example
const [sql, params] = sqlBuilder
  .select()
  .from("user_account", "u")
  .buildQuery();
const [sql, params] = sqlBuilder.select().from("user_account u").buildQuery();
```

### .join() Method

```typescript
// Inner join
const [sql, params] = sqlBuilder
  .select()
  .from("user_account", "u")
  .join(
    "INNER",
    "user_profile_pic",
    "up",
    "u.user_profile_pic_id = up.user_profile_pic_id"
  )
  .buildQuery();

// Left join
const [sql, params] = sqlBuilder
  .select()
  .from("user_account", "u")
  .join(
    "LEFT",
    "user_profile_pic",
    "up",
    "u.user_profile_pic_id = up.user_profile_pic_id"
  )
  .buildQuery();

// Right join
const [sql, params] = sqlBuilder
  .select()
  .from("user_account", "u")
  .join(
    "RIGHT",
    "user_profile_pic",
    "up",
    "u.user_profile_pic_id = up.user_profile_pic_id"
  )
  .buildQuery();
```

Only provide third argument if no alias is needed

```typescript
// Inner join
const [sql, params] = sqlBuilder
  .select()
  .from("user_account", "u")
  .join(
    "INNER",
    "user_profile_pic",
    "u.user_profile_pic_id = user_profile_pic.user_profile_pic_id"
  )
  .buildQuery();
```

### .where() Method

```typescript
// All condition examples
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .where({
    email: "123@gmail.com", // exact match
    user_id: { ">": 123 },
    user_id: { "<": 123 },
    nickname: { IS_NOT_NULL: true }, // must be true
    is_active: { BETWEEN: [0, 1] },
    status: { IN: [1, 2, 3, 4] },
    "u.user_id": { "!=": 1 }, // assume alias is set in From's second parameters
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
  .from("user_account")
  .orderBy([{ field: "email", direction: "ASC" }])
  .buildQuery();

// Multiple order by
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .orderBy([
    { field: "email", direction: "ASC" },
    { field: "user_id", direction: "DESC" },
  ])
  .buildQuery();
```

### .limit() and .offset() Methods

```typescript
// Limit
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .limit(10)
  .buildQuery();

// Limit and offset
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
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
    ctimeValue = Math.floor(Date.now() / 1000), // default is current unix timestamp
    utimeValue = Math.floor(Date.now() / 1000) // default is current unix timestamp
  })
  .buildQuery();
```

### .update() Method

```typescript
// Update Method 1
const [sql, params] = sqlBuilder
  .update('user_account', {email: '123@gmail.com'}, {
    enableTimestamps = false, // if true, will add utime to update object
    utimeField = 'utime',
    utimeValue = Math.floor(Date.now() / 1000) // default is current unix timestamp
  })
  .where({user_id: 1})
  .buildQuery();

// Update Method 2 (Options not supported yet)
const [sql, params] = sqlBuilder
  .update('user_account')
  .set({email: '123@gmail.com'})
  .where({user_id: 1})
  .buildQuery();
```

### .delete() Method

```typescript
// Delete Whole Table
const [sql, params] = sqlBuilder.deleteFrom('user_account').buildQuery();

// Delete with where
const [sql, params] = sqlBuilder.deleteFrom('user_account')
  .where({user_id: 1})
  .buildQuery();

// Delete with limit
const [sql, params] = sqlBuilder.deleteFrom('user_account')
  .where({user_id: {">": 1}})
  .limit(1)
  .buildQuery();
```

## Changelog

Detailed changes for each version are documented in the [CHANGELOG.md](https://github.com/johntam718/node-mysql2-helper/blob/main/CHANGELOG.md) file.