import { WhereCondition, OrderByField, FieldAlias } from "../dto/types";
export declare function createWhereCondition<T extends string>(conditions: WhereCondition<T>): WhereCondition<T>;
export declare function createOrderBy<T extends string>(fields: OrderByField<T>[]): OrderByField<T>[];
export declare function createColumns<T extends string>(columns: T[]): T[];
export declare function createFieldAlias<T extends string>(fieldObj: FieldAlias<T>): FieldAlias<T>;
//# sourceMappingURL=helper.d.ts.map