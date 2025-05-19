# node-mysql-query-utils

A MySQL helper to provide ways to connect to the database, build SQL queries, and perform common database operations for Node.js.

[![npm version](https://badge.fury.io/js/node-mysql-query-utils.svg)](https://badge.fury.io/js/node-mysql-query-utils)

## Table of contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [DatabaseManagement](#databasemanagement)
  - [Single database connection](#single-database-connection)
  - [Multiple database connections](#multiple-database-connections)
- [SQLBuilder Class](#sqlbuilder-class)
  - [Example](#example)
  - [.select() Method](#select-method)
  - [.from() Method](#from-method)
  - [.join() Method](#join-method)
  - [.where() Method](#where-method)
  - [.orderBy() Method](#orderby-method)
  - [.limit() and .offset() Methods](#limit-and-offset-methods)
  - [.insert() Method](#insert-method)
  - [.update() Method](#update-method)
    - [Update Options](#update-options)
  - [.delete() Method](#delete-method)
  - [.buildQuery() Method](#buildquery-method)
  - [.executeQuery() Method](#executequery-method)
- [TableModel Class](#tablemodel-class)
  - [1. Using DatabaseManagement to Connect to the Database](#1-using-databasemanagement-to-connect-to-the-database)
  - [2. Using the TableModel Class Directly](#2-using-the-tablemodel-class-directly)
  - [Methods](#methods)
    - [createSelect](#createselect)
    - [createInsert](#createinsert)
    - [createDelete](#createdelete)
    - [createCount](#createcount)
    - [Common Parameters](#common-parameters)
      - [findOne](#findone)
      - [findAll](#findall)
      - [updateOne](#updateone)
      - [updateAll](#updateall)
      - [insertRecord](#insertrecord)
      - [removeOne](#removeone)
      - [remove](#remove)
      - [patchSingleField](#patchsinglefield)
      - [softDeleteOne](#softdeleteone)
      - [softDelete](#softdelete)
- [Changelog](#changelog)

## Introduction

`node-mysql-query-utils` is a MySQL query builder and helper for Node.js. It provides a simple and easy way to build and execute MySQL queries.

## Installation

```bash
npm install node-mysql-query-utils
```

or

```bash
yarn add node-mysql-query-utils
```

## Overview

This package provides three classes to help you manage and interact with your MySQL database:

1. [DatabaseManagement](#databasemanagement)
2. [SQLBuilder](#sqlbuilder-class)
3. [TableModel](#tablemodel-class)

## Quick Start

Here's a quick overview of how to make use of this library:

```typescript
import {
  DatabaseManagement,
  TableModel,
  SQLBuilder,
  sqlHelper,
} from "node-mysql-query-utils";

// entry point of the application e.g. start server
// index.ts
DatabaseManagement.connectMultipleDatabases([
  {
    identifierName: "mainDB",
    config: {
      host: "localhost",
      user: "root",
      password: "password",
      database: "test_db",
    },
    options: {
      verbose: true, // optional, default is true. If true, will log all queries to console
    },
  },
]);

//or

DatabaseManagement.connectSingleDatabase(
  "mainDB",
  {
    host: "localhost",
    user: "root",
    password: "password",
    database: "test_db",
  },
  {
    verbose: true, // optional, default is true. If true, will log all queries to console
  }
);

// model folder
// user.ts
const mainDB = DatabaseManagement.getInstance("mainDB"); // get instance of mainDB
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
    ctimeField: "ctime", // created_at column name in db
    utimeField: "utime", // updated_at column name in db
    isActiveField: "is_active", // is_active column name in db
    isDeletedField: "is_deleted", // is_deleted column name in db
    statusField: "status", // status column name in db
  },
});

// usage of userAccountModel in other files e.g. api-related files
// get user by id
```

## DatabaseManagement

The **`DatabaseManagement`** class is a singleton class that helps manage database connections. It supports connecting to single or multiple databases and provides a way to retrieve instances of the connections.

#### Single database connection

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

#### Multiple database connections

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

# SQLBuilder Class

The **`SQLBuilder`** class provides a way to build SQL queries for various operations such as SELECT, INSERT, UPDATE, DELETE, etc.

To generate the final SQL query and its parameters, you must call the `.buildQuery()` method at the end of your query-building process.

If the `SQLBuilder` constructor is provided with a `queryFn`, you can use the `.executeQuery()` method to execute the query directly.

#### Example

```typescript
import { SQLBuilder, sqlHelper } from "node-mysql-query-utils";

// Define the table name
const tableName = "user_account";

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
const sqlBuilder = new SQLBuilder<(typeof columns)[number]>();

// Javascript - no type hinting, but still works. Suggest using TableModel class for better type hinting if using Javascript
const sqlBuilder = new SQLBuilder();

// Accept QueryFunction for SQLBuilder to enable query execution
const sqlBuilder = new SQLBuilder(db.query.bind(db)); // Optional: put your own query function here if you don't connect DB by DatabaseManagement class from this package

// Accept second generic type for query function
const sqlBuilder = new SQLBuilder<(typeof columns)[number], any>(
  db.query.bind(db)
); // Optional: put your own query function here if you don't connect DB by DatabaseManagement class from this package

// Call buildQuery to get the SQL query and parameters in the end
const { sql, params } = sqlBuilder.select().from(tableName).buildQuery();
// Can also use array destructuring
const [sql, params] = sqlBuilder.select().from(tableName).buildQuery();
// BuildQuery also accepts an options object. it will return complete query with format. params will be empty array if format is true
const [sql, params] = sqlBuilder
  .select()
  .from(tableName)
  .buildQuery({ format: true });

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

// Select with raw SQL
const [sql, params] = sqlBuilder
  .select([{       
    raw: 'CASE WHEN expire_time < FROM_UNIXTIME(?) THEN 1 ELSE 0 END',
    alias: 'is_expired',
    params: [dayjs().unix()],
  }])
  .from(tableName)
  .buildQuery();

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
    email: "123@gmail.com", // equal to '
    email: { "=": "123@gmail.com" }, // equal to '
    email: { "!=": "123@gmail.com" }, // not equal to
    user_id: { ">": 123 },
    user_id: { "<": 123 },
    user_id: { ">=": 123 },
    user_id: { "<=": 123 },
    is_active: { BETWEEN: [0, 1] },
    is_active: { NOT_BETWEEN: [0, 1] },
    status: { IN: [1, 2, 3, 4] },
    status: { NOT_IN: [1, 2, 3, 4] },
    nickname: { IS_NOT_NULL: true }, // must be true, false will throw error
    nickname: { IS_NULL: true }, // must be true, false will throw error
    nickname: { LIKE: { contains: 'name' } }, // contains 'name'
    nickname: { NOT_LIKE: { startsWith: 'name' } }, // not starts with 'name'
    nickname: { LIKE: { endsWith: 'name' } }, // ends with 'name'
    nickname: { LIKE: '%_123' } // custom pattern
    nickname: { REGEXP: '^[a-zA-Z0-9]*$' } // custom pattern
    "u.user_id": { "!=": 1 }, // assume alias is set in From's second parameters (e.g. .from("user_account", "u"))
    // Raw SQL condition
    RAW: {
      sql: 'LENGTH(nickname) > ?',
      params: [5]
    }
  })
  .buildQuery();
```

```typescript
// AND example
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .where({
    AND: [
      { email: { LIKE: "%@gmail.com" } },
      { username: "jane" },
      {
        RAW: {
          sql: 'TIMESTAMPDIFF(DAY, created_at, NOW()) > ?',
          params: [30]
        }
      }
    ],
  });
```

```typescript
// OR example
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .where({
    OR: [
      { email: { LIKE: "%@gmail.com" } },
      { username: "jane" },
      {
        RAW: {
          sql: 'status = ? AND is_active = ?',
          params: [1, 1]
        }
      }
    ],
  });
```

Supported Operators:

- `=`
- `!=`
- `>`
- `<`
- `>=`
- `<=`
- `LIKE`,
- `NOT_LIKE`
- `REGEXP`,
- `IN`,
- `NOT_IN`
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

// Raw SQL in order by
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .orderBy([
    { 
      raw: 'TIMESTAMPDIFF(DAY, created_at, NOW())',
      direction: "DESC" 
    }
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
  .insert(
    "user_account",
    { email: "123@gmail.com" },
    {
      enableTimestamps = false, // if true, will add ctime and utime to insert object
      ctimeField = "ctime",
      utimeField = "utime",
      ctimeValue = Math.floor(Date.now() / 1000), // default is current unix timestamp
      utimeValue = Math.floor(Date.now() / 1000), // default is current unix timestamp
      insertIgnore = false, // if true, will add IGNORE to the insert query
    }
  )
  .buildQuery();
```

### Insert Options

The `insert` method accepts options parameter with the following properties:

| Property           | Type    | Description                                                                           |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| `enableTimestamps` | boolean | (Optional) If true, will add `ctime` and `utime` to the insert object. Default is false. |
| `ctimeField`       | string  | (Optional) The field name for the create timestamp. Default is `ctime`.               |
| `utimeField`       | string  | (Optional) The field name for the update timestamp. Default is `utime`.               |
| `ctimeValue`       | any     | (Optional) The value for the create timestamp. Default is the current Unix timestamp. |
| `utimeValue`       | any     | (Optional) The value for the update timestamp. Default is the current Unix timestamp. |
| `insertIgnore`     | boolean | (Optional) If true, will add `IGNORE` to the insert query. Default is false.          |


### .update() Method

```typescript
// Update Method 1
const [sql, params] = sqlBuilder
  .update(
    "user_account",
    { email: "123@gmail.com" },
    // Options
    {
      enableTimestamps = false, // if true, will add utime to update object
      utimeField = "utime",
      utimeValue = Math.floor(Date.now() / 1000), // default is current unix timestamp
    }
  )
  .where({ user_id: 1 })
  .buildQuery();

// Update Method 2 (Options not supported yet)
const [sql, params] = sqlBuilder
  .update("user_account")
  .set({ email: "123@gmail.com" })
  .where({ user_id: 1 })
  .buildQuery();

// Increment and Decrement (Added in version v1.0.4)
const [sql, params] = sqlBuilder
  .update("user_account")
  .set({ balance: { increment: 100 } })
  .where({ user_id: 1 })
  .buildQuery();
```

### Update Options

The `update` method accepts options parameter with the following properties:

| Property           | Type    | Description                                                                           |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| `enableTimestamps` | boolean | (Optional) If true, will add `utime` to the update object. Default is false.          |
| `primaryKey`       | string  | (Optional) The primary key field name. For removing primaryKey in update object       |
| `utimeField`       | string  | (Optional) The field name for the update timestamp. Default is `utime`.               |
| `utimeValue`       | any     | (Optional) The value for the update timestamp. Default is the current Unix timestamp. |

### .delete() Method

```typescript
// Delete Whole Table
const [sql, params] = sqlBuilder.deleteFrom("user_account").buildQuery();

// Delete with where
const [sql, params] = sqlBuilder
  .deleteFrom("user_account")
  .where({ user_id: 1 })
  .buildQuery();

// Delete with limit
const [sql, params] = sqlBuilder
  .deleteFrom("user_account")
  .where({ user_id: { ">": 1 } })
  .limit(1)
  .buildQuery();
```

### .buildQuery() Method

```typescript
// Build query with format
const sqlBuilder = new SQLBuilder<(typeof columns)[number]>();
const [sql, params] = sqlBuilder
  .select()
  .from("user_account")
  .buildQuery({ format: true });
```

### .executeQuery() Method

```typescript
// Execute query
const sqlBuilder = new SQLBuilder<(typeof columns)[number]>();
const result = await sqlBuilder.select().from("user_account").executeQuery();
```

### Without calling .buildQuery() or .executeQuery()

```typescript
// Without calling .buildQuery() or .executeQuery() as end of query building
const sqlBuilder = new SQLBuilder<(typeof columns)[number]>();
const result = sqlBuilder.select().from("user_account");

// result will be an instance of SQLBuilder
// SQLBuilder {
//   queryFn: [Function: bound executeQuery] AsyncFunction,
//   message: 'Call .buildQuery() or .executeQuery() to get the result'
// }

// To get the result, call .buildQuery() or .executeQuery()
const [sql, params] = result.buildQuery();
// or
const result = await result.executeQuery(); // if query function is provided in SQLBuilder
```

## TableModel Class

The **`TableModel`** class is a wrapper around the **`SQLBuilder`** class that provides a way to build and execute common database operations like SELECT, INSERT, UPDATE, DELETE, etc.

To generate the final SQL query and its parameters, you must call the `.buildQuery()` method at the end of your query-building process. If you have provided a query function, you can use the `.executeQuery()` method to execute the query directly.

There are two ways to define and use the `TableModel` class:

### 1. Using DatabaseManagement to Connect to the Database

Connect database by `DatabaseManagement` class can refer to the [Quick Start](#quick-start) example. This method involves connecting to multiple databases using the `DatabaseManagement` class and then retrieving instances to create table models.

### 2. Using the TableModel Class Directly

Alternatively, you can define the table model by using the `TableModel` class directly. This method is useful if you prefer to use your own query function or if you don't connect to the database using the `DatabaseManagement` class from this package.

```typescript
// Define the table model by using the TableModel class directly
const userModel = new TableModel({
  tableName: "users",
  primaryKey: "user_id",
  columns: sqlHelper.createColumns(["user_id", "name", "email", "phone"]),
  queryFn: db.query.bind(db), // Optional: put your own query function here if you don't connect DB by DatabaseManagement class from this package
});
```

### Methods

The `TableModel` class provides the following methods to perform database operations:

| Method             | Description                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createSelect`     | Creates a SELECT query. Returns a function that returns an instance of the `SQLBuilder` class. You can chain the `SQLBuilder` methods to build your desired query.  |
| `createInsert`     | Creates an INSERT query. Returns a function that returns an instance of the `SQLBuilder` class. You can chain the `SQLBuilder` methods to build your desired query. |
| `createUpdate`     | Creates an UPDATE query. Returns a function that returns an instance of the `SQLBuilder` class. You can chain the `SQLBuilder` methods to build your desired query. |
| `createDelete`     | Creates a DELETE query. Returns a function that returns an instance of the `SQLBuilder` class. You can chain the `SQLBuilder` methods to build your desired query.  |
| `createCount`      | Creates a COUNT query. Returns a function that returns an instance of the `SQLBuilder` class. You can chain the `SQLBuilder` methods to build your desired query.   |
| `findOne`          | Finds a single record. Returns an instance of the `SQLBuilder` class with the `findOne` method configured.                                                          |
| `findAll`          | Finds multiple records. Returns an instance of the `SQLBuilder` class with the `findAll` method configured.                                                         |
| `remove`           | Removes records based on conditions. Returns an instance of the `SQLBuilder` class with the `remove` method configured.                                             |
| `removeOne`        | Removes a single record based on conditions. Returns an instance of the `SQLBuilder` class with the `removeOne` method configured.                                   |
| `patchSingleField` | Updates a single field in records based on conditions. Returns an instance of the `SQLBuilder` class with the `patchSingleField` method configured.                 |
| `softDeleteOne`    | Soft deletes a single record based on conditions. Returns an instance of the `SQLBuilder` class with the `softDeleteOne` method configured.                         |
| `softDelete`       | Soft deletes multiple records based on conditions. Returns an instance of the `SQLBuilder` class with the `softDelete` method configured.                           |

The `TableModel` class provides the following methods to perform database operations.

Methods that start with `create` (e.g., `createSelect`, `createInsert`) return a function that returns an instance of the `SQLBuilder` class. You can chain the `SQLBuilder` methods to build your desired query.

Other methods, such as `findOne`, return an instance of the `SQLBuilder` class that is already configured with some chained methods. These methods act as wrapper functions for common CRUD operations and are not intended for further chaining.

#### createSelect

```typescript
const selectUser = userModel.createSelect();
const result = await selectUser({
  fields: ["user_id", "email", "nickname"],
})
  .where({ user_id: 1 })
  .executeQuery();
```

#### createInsert

```typescript
const insertUser = userModel.createInsert();
const result = await insertUser({
  data: { user_id: 1, email: "123@email.com", nickname: "John Doe" },
}).executeQuery();
```

#### createUpdate

```typescript
const updateUser = userModel.createUpdate();
const result = await updateUser({
  data: { nickname: "John Doe 2" },
  where: { user_id: { "<=": 5 } },
})
  .limit(2)
  .executeQuery();
```

#### createDelete

```typescript
const deleteUser = userModel.createDelete();
const result = await deleteUser({ where: { user_id: 1 } })
  .limit(1)
  .executeQuery();
```

#### createCount

```typescript
const countResult = await countUser("user_id")
  .where({ user_id: { "<": 2 } })
  .executeQuery();
```

### Common Parameters

The following table lists common parameters that many methods accept. Note that some parameters may be available for certain methods while others may not, as each method performs different operations. TypeScript will provide hints for the available parameters for each method.

| Parameter | Type   | Description                                                                                                    |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `fields`  | Array  | An array of strings specifying the columns to select.                                                          |
| `where`   | Object | An object specifying the conditions for the query.                                                             |
| `orderBy` | Array  | An array of objects specifying the columns to order by and the direction (ASC or DESC).                        |
| `limit`   | Number | A number specifying the maximum number of rows to return.                                                      |
| `offset`  | Number | A number specifying the offset of the first row to return.                                                     |
| `options` | Object | An object specifying additional options for the query. Can be referenced in [Update Options](#update-options). |

#### findOne

```typescript
const [user] = await userModel
  .findOne({ where: { user_id: 1 } })
  .executeQuery();
```

#### findAll

```typescript
const users = await userModel
  .findAll({
    fields: ["user_id", "email"],
    where: { is_active: true },
    orderBy: [{ column: "user_id", direction: "ASC" }],
    limit: 10,
    offset: 0,
  })
  .executeQuery();
```

#### updateOne

```typescript
const updatedOneUser = await userModel
  .updateOne({
    where: { user_id: 1 },
    data: { email: "123@gmail.com" },
  })
  .executeQuery();
```

#### updateAll

```typescript
const updateAllUsers = await userModel
  .updateAll({
    data: { nickname: "John Doe" },
    where: { user_id: { "<=": 5 } },
    options: { enableTimestamps: true, utimeField: "utime" },
  })
  .executeQuery();
```

#### insertRecord

```typescript
const insertedUser = await userModel
  .insertRecord({
    data: { user_id: 1, email: "123@gmail.com", nickname: "John Doe" },
    options: {
      enableTimestamps: true,
      ctimeField: "ctime",
      utimeField: "utime",
    },
  })
  .executeQuery();
```

#### removeOne

```typescript
const deletedOneUser = await userModel
  .removeOne({
    where: { user_id: { ">": 1 } },
    orderBy: [{ field: "user_id", direction: "ASC" }],
  })
  .executeQuery();
```

#### remove

```typescript
const deletedAllUsers = await userModel
  .remove({ where: { user_id: 1 } })
  .executeQuery();
```

#### patchSingleField

```typescript
const patchedActiveField = await userModel
  .patchSingleField({
    patchField: "is_active",
    where: { user_id: 1 },
    value: 1,
    options: { enableTimestamps: true, utimeField: "utime" },
  })
  .executeQuery();
```

#### softDeleteOne

```typescript
const softDeletedUser = await userModel
  .softDeleteOne({
    where: { user_id: 1 },
    value: 1,
    options: {
      enableTimestamps: true,
      deleteField: "is_deleted",
      utimeField: "utime",
    },
  })
  .executeQuery();
```

#### softDelete

```typescript
const softDeletedUsers = await userModel
  .softDelete({
    where: { user_id: { ">": 1 } },
    value: 1,
    options: {
      enableTimestamps: true,
      deleteField: "is_deleted",
      utimeField: "utime",
    },
  })
  .executeQuery();
```

## Changelog

Detailed changes for each version are documented in the [CHANGELOG.md](https://github.com/johntam718/node-mysql2-helper/blob/main/CHANGELOG.md) file.
