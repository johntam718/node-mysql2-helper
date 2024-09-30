# Changelog

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
