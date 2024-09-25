"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableModel = void 0;
const sql_builder_class_1 = require("../../dto/sql-builder-class");
const logger_1 = __importDefault(require("../../lib/logger"));
class TableModel {
    constructor(config) {
        this.tableName = config.tableName;
        this.primaryKey = config.primaryKey;
        this.columns = config.columns;
        const defaultCentralFields = {
            ctimeField: 'ctime',
            utimeField: 'utime',
            isActiveField: 'is_active',
            isDeletedField: 'is_deleted',
            statusField: 'status'
        };
        this.centralFields = Object.assign(Object.assign({}, defaultCentralFields), ((config === null || config === void 0 ? void 0 : config.centralFields) || {}));
        this.queryFn = config.queryFn;
        this.checkConfig();
    }
    checkConfig() {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }
        if (!this.primaryKey) {
            throw new Error('Primary key is required');
        }
        if (!Array.isArray(this.columns) || this.columns.length === 0) {
            throw new Error('Table Columns are required');
        }
    }
    checkEmptyObject(obj) {
        return Object.keys(obj).length === 0;
    }
    throwEmptyObjectError(obj, message) {
        if (this.checkEmptyObject(obj)) {
            throw new Error(message || 'Object cannot be empty');
        }
    }
    printPrefixMessage(message) {
        return `[Table :: ${this.tableName}] :: ${message}`;
    }
    removeExtraFieldsAndLog(structuredData) {
        const removedKeys = [];
        // Remove extra fields that are not in the columns
        Object.keys(structuredData).forEach(key => {
            if (!this.columns.includes(key)) {
                removedKeys.push(key);
                delete structuredData[key];
            }
        });
        if (removedKeys.length > 0) {
            logger_1.default.warn(this.printPrefixMessage(`Removed unknown fields: ${removedKeys.join(', ')}`));
        }
    }
    initSQLBuilder() {
        return new sql_builder_class_1.SQLBuilder(this.queryFn);
    }
    createSelect() {
        const SQLBuild = this.initSQLBuilder();
        return (values) => {
            const { fields } = values || {};
            return SQLBuild.select(fields || "*").from(this.tableName);
        };
    }
    createUpdate(options) {
        const SQLBuild = this.initSQLBuilder();
        return (values) => {
            const { data = {}, where = {} } = values || {};
            this.throwEmptyObjectError(where, this.printPrefixMessage('CreateUpdate :: Where condition cannot be empty'));
            this.throwEmptyObjectError(data, this.printPrefixMessage('CreateUpdate :: Data cannot be empty'));
            if (this.primaryKey in data)
                delete data[this.primaryKey];
            return SQLBuild.update(this.tableName, data, options)
                .where(where);
        };
    }
    createInsert(options) {
        const SQLBuild = this.initSQLBuilder();
        return (data) => {
            this.throwEmptyObjectError(data, this.printPrefixMessage('CreateInsert :: Data cannot be empty'));
            const structuredData = Object.assign({}, data);
            this.removeExtraFieldsAndLog(structuredData);
            return SQLBuild.insert(this.tableName, structuredData, options);
        };
    }
    createDelete() {
        const SQLBuild = this.initSQLBuilder();
        return (values) => {
            const { where } = values || {};
            this.throwEmptyObjectError(where, this.printPrefixMessage('CreateDelete :: Where condition cannot be empty'));
            return SQLBuild.deleteFrom(this.tableName)
                .where(where);
        };
    }
    createCount() {
        const SQLBuild = this.initSQLBuilder();
        return (field = '*', alias) => {
            return SQLBuild.count(field, alias).from(this.tableName);
        };
    }
    findOne(values) {
        const { where, orderBy = [], fields } = values || {};
        this.throwEmptyObjectError(where, this.printPrefixMessage('FindOne :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.select(fields || "*")
            .from(this.tableName)
            .where(where)
            .orderBy(orderBy)
            .limit(1);
    }
    findAll(values) {
        const { where, orderBy = [], fields, limit, offset } = values || {};
        if (where)
            this.throwEmptyObjectError(where, this.printPrefixMessage('FindAll :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.select(fields || "*")
            .from(this.tableName)
            .where(where)
            .orderBy(orderBy)
            .limit(limit || -1) // -1 means no limit
            .offset(offset || -1); // -1 means no offset
    }
    updateOne(values) {
        const { data, where, options } = values || {};
        this.throwEmptyObjectError(where, this.printPrefixMessage('UpdateOne :: Where condition cannot be empty'));
        this.throwEmptyObjectError(data, this.printPrefixMessage('UpdateOne :: Data cannot be empty'));
        if (this.primaryKey in data)
            delete data[this.primaryKey]; // For javascript type checking
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.update(this.tableName, data, options)
            .where(where)
            .limit(1);
    }
    updateAll(values) {
        const { data, where = {}, options } = values || {};
        if (this.primaryKey in data)
            delete data[this.primaryKey]; // For javascript type checking
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.update(this.tableName, data, options)
            .where(where);
    }
    insertRecord(data, options) {
        this.throwEmptyObjectError(data, this.printPrefixMessage('Create :: Data cannot be empty'));
        const structuredData = Object.assign({}, data);
        this.removeExtraFieldsAndLog(structuredData);
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.insert(this.tableName, structuredData, options);
    }
    removeOne(values) {
        const { where, orderBy = [] } = values || {};
        this.throwEmptyObjectError(where, this.printPrefixMessage('RemoveOne :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.deleteFrom(this.tableName)
            .where(where)
            .orderBy(orderBy)
            .limit(1);
    }
    remove(values) {
        const { where = {}, orderBy = [] } = values || {};
        // Prevent accidental deletion of all records
        this.throwEmptyObjectError(where, this.printPrefixMessage('Remove :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        return SQLBuild.deleteFrom(this.tableName)
            .where(where)
            .orderBy(orderBy);
    }
    patchActiveStatus(values) {
        const { where, value, options } = values || {};
        const { patchField } = options || {};
        this.throwEmptyObjectError(where, this.printPrefixMessage('PatchIsActive :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        const data = { [patchField || this.centralFields.isActiveField]: value };
        return SQLBuild.update(this.tableName, data, options)
            .where(where);
    }
    softDeleteOne(values) {
        const { where, value, options } = values || {};
        this.throwEmptyObjectError(where, this.printPrefixMessage('SoftDeleteOne :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        const data = { [(options === null || options === void 0 ? void 0 : options.deleteField) || this.centralFields.isDeletedField]: value };
        return SQLBuild.update(this.tableName, data, options)
            .where(where)
            .limit(1);
    }
    softDelete(values) {
        const { where, value, options } = values || {};
        this.throwEmptyObjectError(where, this.printPrefixMessage('SoftDelete :: Where condition cannot be empty'));
        const SQLBuild = this.initSQLBuilder();
        const data = { [(options === null || options === void 0 ? void 0 : options.deleteField) || this.centralFields.isDeletedField]: value };
        return SQLBuild.update(this.tableName, data, options)
            .where(where);
    }
}
exports.TableModel = TableModel;
