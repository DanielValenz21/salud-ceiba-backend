import { pool } from '../config/db.js';

export default {
  execute: (sql, params) => pool.execute(sql, params),
  getConnection: () => pool.getConnection()
};
