import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Wrapper that mimics mysql2's db.query() returning [rows, fields]
// - For SELECT: returns the rows array directly (like mysql2's [rows])
// - For INSERT: returns { rows, insertId } for compatibility
// - For UPDATE/DELETE: returns { rowCount }
const db = {
    async query(sql, params = []) {
        // Replace MySQL ? placeholders with PostgreSQL $1, $2, ... placeholders
        let paramIndex = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);

        const result = await pool.query(pgSql, params);

        // Handle INSERT ... SET style (no longer used but for safety)
        // Handle START TRANSACTION, COMMIT, ROLLBACK
        if (sql.trim().toUpperCase() === 'START TRANSACTION') {
            await pool.query('BEGIN');
            return { affectedRows: 0 };
        }
        if (sql.trim().toUpperCase() === 'COMMIT') {
            await pool.query('COMMIT');
            return { affectedRows: 0 };
        }
        if (sql.trim().toUpperCase() === 'ROLLBACK') {
            await pool.query('ROLLBACK');
            return { affectedRows: 0 };
        }

        // For SELECT queries, return rows (mimics mysql2's [rows] format)
        if (result.command === 'SELECT') {
            return [result.rows];
        }

        // For INSERT, provide insertId compatibility via RETURNING
        if (result.command === 'INSERT' && result.rows.length > 0 && result.rows[0].id !== undefined) {
            return [{ insertId: result.rows[0].id, rows: result.rows }];
        }
        if (result.command === 'INSERT') {
            return [{ insertId: 0, rows: result.rows }];
        }

        // For UPDATE/DELETE, provide affectedRows compatibility
        return [{ affectedRows: result.rowCount, rows: result.rows }];
    }
};

export default db;
