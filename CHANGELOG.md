# Changelog

## [1.0.8] - 2025-11-17

### Added
- **TableModel**: Added `enablePrimaryKey` option to allow tables without primary keys (useful for junction tables)
  - Defaults to `true` for backward compatibility
  - When `false`, primary key validation is skipped
  - Example: `new TableModel({ enablePrimaryKey: false, ... })`

- **TableModel**: Added shallow data cloning to prevent mutation of input data
  - All update and insert methods now clone data before processing
  - Uses native JavaScript spread operator (no dependencies)
  - Prevents accidental side effects from data mutation

- **SQLBuilder**: Added support for `IncrementDecrementValue` in `onDuplicateKeyUpdate`
  - Can now use `{ points: { increment: 10 } }` syntax in `onDuplicateKeyUpdate`
  - Supports increment, decrement, and regular values
  - Example: `insertRecord(data, { onDuplicateKeyUpdate: { views: { increment: 1 }, email: 'new@example.com' } })`

- **Types**: Improved type hints for `WhereCondition`
  - `.AND` and `.OR` properties now show proper type hints even when using `RAW` conditions
  - Better autocomplete support for nested conditions

- **Types**: Made `InsertOptions` generic with `ColumnKeys` parameter
  - `onDuplicateKeyUpdate` now has proper type hints based on column keys
  - Better autocomplete and type safety for `onDuplicateKeyUpdate` values

### Changed
- **TableModel**: Updated type signatures for update methods
  - `createUpdate()`, `updateOne()`, and `updateAll()` now accept `UpdateValue<ColumnKeys>` instead of `Omit<UpdateValue<ColumnKeys>, PrimaryKey>`
  - Primary key can be included in data and will be automatically removed
  - Better type safety and accuracy

- **SQLBuilder**: Refactored increment/decrement logic into reusable methods
  - Extracted `validateIncrementDecrement()` helper method
  - Extracted `buildUpdateClausesAndParams()` helper method
  - Eliminated code duplication between `set()` and `onDuplicateKeyUpdate`
  - Improved maintainability and consistency

### Removed
- **TableModel**: Removed `createOrderbyObject()` method (breaking change)
  - Use `createOrderByObject()` instead (correct spelling)
  - The typo method name has been completely removed for consistency

### Fixed
- **Types**: Fixed type hints for `WhereCondition.AND` and `WhereCondition.OR`
  - Type hints now work correctly even when `RawWhereCondition` is present
  - Improved developer experience with better autocomplete

## [1.0.7] - 2025-05-19
### Added
- **Enhanced Type System:**
  - Updated `LimitOffset` type to support more flexible limit and offset combinations
  - Added `RawWhereCondition` type to support raw SQL conditions in where clauses
  - Added `OrderByField` type to support both regular field ordering and raw SQL expressions

- **SQL Builder Improvements:**
  - Added support for raw SQL conditions in where clauses using the `RAW` operator
  - Enhanced order by functionality to support raw SQL expressions

- **Table Model Helper Functions:**
  - Added `createOrderByObject` helper function to create order by objects with default values
  - Added `createOrderByArray` helper function to create empty order by arrays

## [1.0.6] - 2024-12-06
### Added
- **Enhanced `SQLBuilder` Class:**
  - Added logic to determine if the value is an array for `IN` condition in the `buildWhereClause` method.
    - Example: `{ user_id: [1, 2, 3] }` translates to `user_id IN (1, 2, 3)`.
  - Improved handling of `ctime` and `utime` values to avoid caching the value when the server starts.
    - Ensured that `ctimeValue` and `utimeValue` are functions and called them for each row to set the current time if not provided.


## [1.0.5] - 2024-11-28
### Added
- **Raw SQL Support in Fields:**
  - Introduced the ability to include raw SQL expressions within the `fields` parameter of the `SQLBuilder` class.
  - Allows users to specify complex SQL snippets using the `RawField` type, enabling greater flexibility in query construction.
  - Supports adding aliases and custom parameters for raw SQL expressions.

- **Default Table Alias in `TableModel` Class:**
  - Introduced the `tableNameAlias` property in the `TableModel` constructor to set a default alias for the table.
  
### Fixed
- **`createXXXXXX()` Methods in `TableModel` Class:**
  - Resolved an issue where all `createXXXXXX()` methods (`createSelect`, `createUpdate`, `createInsert`, etc.) were using the same instance of `SQLBuilder`.
  - Ensured that each method initializes a new instance of `SQLBuilder`, preventing SQL query misconstruction and ensuring thread safety.
  - Improved reliability of SQL query generation by isolating builder instances per operation.

## [1.0.4] - 2024-10-07
### Added
- Support for increment and decrement operations in the `update` method of the `SQLBuilder` class.
  - Allows specifying `{ increment: number }` or `{ decrement: number }` for fields to increment or decrement their values.
  - Throws an error if both `increment` and `decrement` are provided for the same field.
- Enhanced `LIKE` and `NOT LIKE` operators handling in the `SQLBuilder` class.
  - Throws an error if more than one of `contains`, `startsWith`, or `endsWith` are provided for the same field.

## [1.0.3] - 2024-10-01
### Improved
- Enhanced parameter checking and error messages for `TableModel` class return methods.

### Added
- Added `NOT IN`, `NOT LIKE`, and `REGEXP` operators to the `where` condition parameter in the `SQLBuilder` class.
- For `LIKE` and `NOT LIKE` operators, previously only accepted strings. Now added support for `contains`, `startsWith`, and `endsWith` for more flexible use cases.

## [1.0.2] - 2024-09-30
### Added
- Added `options` parameter to `buildQuery` method to support query formatting.
- Made `queryParts` private to prevent accidental exposure. `queryParts` is an internal structure used to build SQL queries and should not be accessed directly.

## [1.0.1] - 2024-09-27
### Fixed
- Fixed dist folder not aligned with the source code.

## [1.0.0] - 2024-09-27
### Added
- Initial release of `node-mysql-query-utils`.

### Known Issues
- There was an issue with the dist folder not being aligned with the source code, causing discrepancies between the source and the built files.
- The `patchSingleField` function was not working as expected due to the misalignment between the dist folder and the source code.