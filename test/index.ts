import { DatabaseManagement } from "@dto/db-management-class";
import { SQLBuilder } from "@dto/sql-builder-class";
import { createDelete, createInsert, createOrderBy, createSelect, createUpdate, createWhereCondition } from "@lib/helper";
import logger from "@lib/logger";
import { format } from "mysql2";

const masterDBInit = DatabaseManagement.initDatabaseConnection("master", {
  host: "localhost",
  port: 8082,
  user: "user",
  password: "password",
  database: "mydb",
});

const selectUser = createSelect("users");

try {
  logger.info("Starting the application...");
  const master = DatabaseManagement.getInstance("master");

  const getUser = createSelect("users");

  const updateUser = createUpdate("users", { enableTimestamps: false });

  const insertUser = createInsert("users");
  // console.log(insertUser({ username: "Jane Doe22", email: "jane@example.com" }));

  const deleteUser = createDelete("users");
  // console.log(deleteUser({ id: { "!=": 1 } }));


  // const getUserQuery = getUser().buildQuery();
  // console.log(format(getUserQuery.sql, getUserQuery.params));

  // const updateUserQuery = updateUser({ username: "Jane Doessss" })
  //   .where({ id: 11 }).buildQuery();
  // console.log(format(updateUserQuery.sql, updateUserQuery.params));

  // const insertUserQuery = insertUser({
  //   username: "Jane Doe4",
  //   email: "hello.gg@gmail.com",
  //   password: "password123"
  // }).buildQuery();
  // console.log(insertUserQuery);
  // console.log(format(insertUserQuery.sql, insertUserQuery.params));

  const deleteUserQuery = deleteUser().buildQuery();
  console.log(deleteUserQuery);
  console.log(format(deleteUserQuery.sql, deleteUserQuery.params));


  // const whereCondition = createWhereCondition({ id: 1, username: "John Doe" });
  // const orderBy = createOrderBy([{ field: 'id', direction: 'DESC' }, { field: 'username', direction: 'ASC' }]);
  // const { sql, params } = new SQLBuilder()
  //   // .count("*")
  //   // .from("users")
  //   .select("*")
  //   .from("users")
  //   .where(whereCondition)
  //   .orderBy(orderBy)
  //   // .limit(1)
  //   // .offset(1)
  //   // .update("users", { username: "John Doe" }).where({ id: 1 })
  //   // .update("users")
  //   // .set({ username: "John Doess" })
  //   // .where({ id: 1 })
  //   // .deleteFrom("users").where({ id: 1 }).limit(1)
  //   // .deleteFrom("users").where({ id: { "!=": 1 } }).limit(1)
  //   // .select(["u.*", { 'u.user_id': 'id' }])
  //   // // .count('user_id', 'count')
  //   // // .select("*")
  //   // // .select(["u.*", "usdt.*", "eth.*"])
  //   // .from('user_account', 'u')
  //   // .orderBy([{ field: 'u.user_id', direction: 'DESC' }])
  //   // // .join('LEFT', 'usdt_account', 'usdt', 'u.user_id = usdt.user_id')
  //   // // .join('INNER', 'eth_account', 'eth', 'u.user_id = eth.user_id')
  //   // .where({ 'u.email': { "IS_NULL": true } })
  //   .buildQuery();

  // console.log(sql, params);
  // console.log(format(sql, params));

  master.executeQuery(deleteUserQuery.sql, deleteUserQuery.params).then((result) => {
    console.log(result);
  });

  // const masterTesting = DatabaseManagement.getInstance('master');

  // masterTesting.executeQuery(sql, params).then((result) => {
  //   console.log(result);
  // });
} catch (error) {
  console.error(error);
}
