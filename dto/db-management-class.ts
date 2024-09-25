import mysql, {
  format,
  type ConnectionOptions,
  type Pool,
} from 'mysql2/promise';
import { TableModelConstructor, DatabaseConnectionConfig, DatabaseManagementOptions } from './types';
import logger from '@lib/logger';
import { TableModel } from '@src/helper';

// Singleton class to manage database connections
export class DatabaseManagement {
  private static instances: Map<string, DatabaseManagement> = new Map();
  connectionName: string;
  config: ConnectionOptions
  pool: Pool | null;
  verbose: boolean;

  constructor(connectionName: string, config: ConnectionOptions, options: DatabaseManagementOptions = {}) {
    this.connectionName = `[db::${connectionName}]`;
    this.config = config;
    this.pool = null;
    this.verbose = options.verbose ?? true;
  }

  private logVerbose(message: string) {
    if (this.verbose) logger.log(message);
  }

  private async initConnection() {
    try {
      this.pool = mysql.createPool(this.config);
      if (this.verbose) {
        logger.info(`Connection pool created for ${this.connectionName}`);
      }

      // Test the connection, and release it back to the pool
      const connection = await this.pool.getConnection();
      connection.release();
      // if (this.verbose) {
      //   logger.log(`Connection tested and released for ${this.connectionName}`);
      // }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to connect database: ${error.message}`);
        throw error; // Re-throw the error after logging it
      }
      logger.error(`Failed to connect database begin`);
      console.log(error);
      logger.error(`Failed to connect database end`);
      throw error; // Re-throw the error after logging it
    }
  }

  private static async initializeConnection(identifierName: string, config: ConnectionOptions, options?: DatabaseManagementOptions) {
    if (!DatabaseManagement.instances.has(identifierName)) {
      try {
        const instance = new DatabaseManagement(identifierName, config, options);
        await instance.initConnection(); // Initialize the connection
        logger.info(`db.connection :: <${identifierName}> :: host >> ${config.host}, database >> ${config.database}`);
        DatabaseManagement.instances.set(identifierName, instance);
      } catch (error) {
        console.error(`Failed to initialize database connection for identifier ${identifierName}:`, error);
        throw error; // Re-throw the error after logging it
      }
    }
  }

  static async connectSingleDatabase(identifierName: string, config: ConnectionOptions, options?: DatabaseManagementOptions) {
    await DatabaseManagement.initializeConnection(identifierName, config, options);
  }

  static async connectMultipleDatabases(configs: DatabaseConnectionConfig[]): Promise<void> {
    for (const { identifierName, config, options } of configs) {
      await DatabaseManagement.initializeConnection(identifierName, config, options);
    }
  }

  static getInstance(identifierName: string): DatabaseManagement {
    const instance = DatabaseManagement.instances.get(identifierName);
    if (!instance) {
      throw new Error(`No instance found for identifierName: ${identifierName}`);
    }
    return instance;
  }

  static getInstanceList(logInstanceNames: boolean = true): Map<string, DatabaseManagement> | string[] {
    if (logInstanceNames) {
      const instanceNames = Array.from(DatabaseManagement.instances.keys());
      logger.log('Instance Name List: ', instanceNames);
      return instanceNames
    }
    return DatabaseManagement.instances;
  }

  static formatQuery(sql: string, params?: any[]) {
    return format(sql, params);
  }

  formatQuery(sql: string, params?: any[]) {
    return DatabaseManagement.formatQuery(sql, params);
  }

  createTableModel<ColumnKeys extends string, PrimaryKey extends ColumnKeys>(BuildSQLConstructor: TableModelConstructor<ColumnKeys[], PrimaryKey>) {
    return new TableModel(BuildSQLConstructor);
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
      query: async (sql: string, params?: any[]) => {
        this.logVerbose(`${this.connectionName} :: query :: stmt >> ${this.formatQuery(sql, params)}`);
        const [result, mysqlFieldMetaData] = await connection.query(sql, params);
        return result;
      },
      commit: async (release: boolean = false) => {
        try {
          this.logVerbose(`${this.connectionName} :: transaction :: committing`);
          await connection.commit();
        } finally {
          if (release) {
            this.logVerbose(`${this.connectionName} :: transaction :: connection released`);
            connection.release();
          }
        }
      },
      rollback: async (release: boolean = false) => {
        try {
          this.logVerbose(`${this.connectionName} :: transaction :: rolling back`);
          await connection.rollback();
        } finally {
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
    }
  }

  async destroy() {
    if (this.pool) {
      await this.pool.end();
      DatabaseManagement.instances.delete(this.connectionName);
      logger.log(`Database connection <${this.connectionName}> has been destroyed.`);
    } else {
      throw new Error('Connection pool has not been initialized.');
    }
  }

  async executeQuery<T = any>(sql: string, params?: any[]): Promise<T> {
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
    return result as T;
  }
}

