import mysql, { type ConnectionOptions, type Pool } from 'mysql2/promise';
import { TableModelConstructor, DatabaseConnectionConfig, DatabaseManagementOptions } from './types';
import { TableModel } from '../src/table-model';
export declare class DatabaseManagement {
    private static instances;
    private config;
    private verbose;
    connectionName: string;
    pool: Pool | null;
    constructor(connectionName: string, config: ConnectionOptions, options?: DatabaseManagementOptions);
    private logVerbose;
    private initConnection;
    private static initializeConnection;
    static connectSingleDatabase(identifierName: string, config: ConnectionOptions, options?: DatabaseManagementOptions): void;
    static connectMultipleDatabases(configs: DatabaseConnectionConfig[]): void;
    static getInstance(identifierName: string): DatabaseManagement;
    static getInstanceList(logInstanceNames?: boolean): Map<string, DatabaseManagement> | string[];
    static formatQuery(sql: string, params?: any[]): string;
    formatQuery(sql: string, params?: any[]): string;
    createTableModel<ColumnKeys extends string, PrimaryKey extends ColumnKeys>(BuildSQLConstructor: Omit<TableModelConstructor<ColumnKeys[], PrimaryKey>, 'queryFn'>): TableModel<ColumnKeys, PrimaryKey>;
    createTransactionConnection(): Promise<{
        query: (sql: string, params?: any[]) => Promise<mysql.QueryResult>;
        commit: (options: {
            release: boolean;
        }) => Promise<void>;
        rollback: (options: {
            release: boolean;
        }) => Promise<void>;
        release: () => void;
    }>;
    destroy(): Promise<void>;
    executeQuery<T = any>(sql: string, params?: any[]): Promise<T>;
}
//# sourceMappingURL=db-management-class.d.ts.map