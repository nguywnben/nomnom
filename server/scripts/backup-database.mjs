import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pool from '../src/db/pool.js';
import { getInsertableColumnNames, serializeBackupValue } from '../src/lib/databaseBackup.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const backupDirectory = path.join(repositoryRoot, 'backups');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const outputPath = path.join(backupDirectory, `nomnom-${stamp}.sql`);
const temporaryPath = `${outputPath}.tmp`;

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function insertStatements(table, rows, escape) {
  if (!rows.length) return [];
  const columns = Object.keys(rows[0]);
  const prefix = `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES\n`;
  const statements = [];
  for (let offset = 0; offset < rows.length; offset += 200) {
    const values = rows.slice(offset, offset + 200).map((row) => (
      `(${columns.map((column) => escape(row[column])).join(', ')})`
    ));
    statements.push(`${prefix}${values.join(',\n')};`);
  }
  return statements;
}

fs.mkdirSync(backupDirectory, { recursive: true });
const connection = await pool.getConnection();
let transactionStarted = false;

try {
  await connection.query('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');
  await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
  transactionStarted = true;

  const [tableRows] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tableNames = tableRows.map((row) => Object.values(row)[0]).sort();
  const sql = [
    '-- NomNom consistent database backup',
    `-- Created: ${new Date().toISOString()}`,
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    'START TRANSACTION;',
  ];
  let totalRows = 0;

  for (const table of tableNames) {
    const [[createRow]] = await connection.query(`SHOW CREATE TABLE ${quoteIdentifier(table)}`);
    const createStatement = createRow['Create Table'];
    const [columnRows] = await connection.query(`SHOW COLUMNS FROM ${quoteIdentifier(table)}`);
    const insertableColumns = getInsertableColumnNames(columnRows);
    const selectColumns = insertableColumns.map(quoteIdentifier).join(', ');
    const [rows] = await connection.query(`SELECT ${selectColumns} FROM ${quoteIdentifier(table)}`);
    totalRows += rows.length;
    sql.push('', `DROP TABLE IF EXISTS ${quoteIdentifier(table)};`, `${createStatement};`);
    sql.push(...insertStatements(table, rows, (value) => serializeBackupValue(value, connection.escape.bind(connection))));
  }

  sql.push('', 'COMMIT;', 'SET FOREIGN_KEY_CHECKS = 1;', '');
  await connection.commit();
  transactionStarted = false;

  const contents = sql.join('\n');
  fs.writeFileSync(temporaryPath, contents, { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryPath, outputPath);
  const digest = crypto.createHash('sha256').update(contents).digest('hex');
  console.log(JSON.stringify({ outputPath, tables: tableNames.length, rows: totalRows, sha256: digest }, null, 2));
} catch (error) {
  if (transactionStarted) await connection.rollback();
  if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
  throw error;
} finally {
  connection.release();
  await pool.end();
}
