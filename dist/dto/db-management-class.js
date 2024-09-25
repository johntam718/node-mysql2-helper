"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManagement = void 0;
const promise_1 = __importStar(require("mysql2/promise"));
const logger_1 = __importDefault(require("../lib/logger"));
const helper_1 = require("../src/helper");
// Singleton class to manage database connections
class DatabaseManagement {
    static instances = new Map();
    connectionName;
    config;
    pool;
    verbose;
    constructor(connectionName, config, options = {}) {
        this.connectionName = `[db::${connectionName}]`;
        this.config = config;
        this.pool = null;
        this.verbose = options.verbose ?? true;
    }
    logVerbose(message) {
        if (this.verbose)
            logger_1.default.log(message);
    }
    async initConnection() {
        try {
            this.pool = promise_1.default.createPool(this.config);
            if (this.verbose) {
                logger_1.default.info(`Connection pool created for ${this.connectionName}`);
            }
            // Test the connection, and release it back to the pool
            const connection = await this.pool.getConnection();
            connection.release();
            // if (this.verbose) {
            //   logger.log(`Connection tested and released for ${this.connectionName}`);
            // }
        }
        catch (error) {
            if (error instanceof Error) {
                logger_1.default.error(`Failed to connect database: ${error.message}`);
                throw error; // Re-throw the error after logging it
            }
            logger_1.default.error(`Failed to connect database begin`);
            console.log(error);
            logger_1.default.error(`Failed to connect database end`);
            throw error; // Re-throw the error after logging it
        }
    }
    static async initializeConnection(identifierName, config, options) {
        if (!DatabaseManagement.instances.has(identifierName)) {
            try {
                const instance = new DatabaseManagement(identifierName, config, options);
                await instance.initConnection(); // Initialize the connection
                logger_1.default.info(`db.connection :: <${identifierName}> :: host >> ${config.host}, database >> ${config.database}`);
                DatabaseManagement.instances.set(identifierName, instance);
            }
            catch (error) {
                console.error(`Failed to initialize database connection for identifier ${identifierName}:`, error);
                throw error; // Re-throw the error after logging it
            }
        }
    }
    static async connectSingleDatabase(identifierName, config, options) {
        await DatabaseManagement.initializeConnection(identifierName, config, options);
    }
    static async connectMultipleDatabases(configs) {
        for (const { identifierName, config, options } of configs) {
            await DatabaseManagement.initializeConnection(identifierName, config, options);
        }
    }
    static getInstance(identifierName) {
        const instance = DatabaseManagement.instances.get(identifierName);
        if (!instance) {
            throw new Error(`No instance found for identifierName: ${identifierName}`);
        }
        return instance;
    }
    static getInstanceList(logInstanceNames = true) {
        if (logInstanceNames) {
            const instanceNames = Array.from(DatabaseManagement.instances.keys());
            logger_1.default.log('Instance Name List: ', instanceNames);
            return instanceNames;
        }
        return DatabaseManagement.instances;
    }
    static formatQuery(sql, params) {
        return (0, promise_1.format)(sql, params);
    }
    formatQuery(sql, params) {
        return DatabaseManagement.formatQuery(sql, params);
    }
    createTableModel(BuildSQLConstructor) {
        return new helper_1.TableModel(BuildSQLConstructor);
    }
    async createTransactionConnection() {
        if (!this.pool) {
            throw new Error('Connection pool has not been initialized.');
        }
        const connection = await this.pool.getConnection();
        this.logVerbose(`${this.connectionName} :: transaction :: connection created`);
        await connection.beginTransaction();
        this.logVerbose(`${this.connectionName} :: transaction :: transaction started`);
        return {
            query: async (sql, params) => {
                this.logVerbose(`${this.connectionName} :: query :: stmt >> ${this.formatQuery(sql, params)}`);
                const [result, mysqlFieldMetaData] = await connection.query(sql, params);
                return result;
            },
            commit: async (release = false) => {
                try {
                    this.logVerbose(`${this.connectionName} :: transaction :: committing`);
                    await connection.commit();
                }
                finally {
                    if (release) {
                        this.logVerbose(`${this.connectionName} :: transaction :: connection released`);
                        connection.release();
                    }
                }
            },
            rollback: async (release = false) => {
                try {
                    this.logVerbose(`${this.connectionName} :: transaction :: rolling back`);
                    await connection.rollback();
                }
                finally {
                    if (release) {
                        this.logVerbose(`${this.connectionName} :: transaction :: connection released`);
                        connection.release();
                    }
                }
            },
            release: () => {
                this.logVerbose(`${this.connectionName} :: transaction :: connection released`);
                connection.release();
            },
        };
    }
    async destroy() {
        if (this.pool) {
            await this.pool.end();
            DatabaseManagement.instances.delete(this.connectionName);
            logger_1.default.log(`Database connection <${this.connectionName}> has been destroyed.`);
        }
        else {
            throw new Error('Connection pool has not been initialized.');
        }
    }
    async executeQuery(sql, params) {
        // Log the constructed SQL query and parameters
        // if (this.verbose) {
        //   console.log('Output SQL:', sql);
        //   console.log('With parameters:', params);
        // }
        // Use mysql2 to format the query with parameters
        const formattedQuery = this.formatQuery(sql, params);
        this.logVerbose(`${this.connectionName} :: query :: stmt >> ${formattedQuery}`);
        if (!this.pool) {
            throw new Error('Connection pool is not initialized.');
        }
        const connection = await this.pool.getConnection();
        const [result, mysqlFieldMetaData] = await connection.query(sql, params);
        connection.release();
        return result;
    }
}
exports.DatabaseManagement = DatabaseManagement;
