import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';
import mysql from 'mysql2/promise';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const backupDirectory = path.join(repositoryRoot, 'backups');

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function connectionConfig() {
  const databaseUrl = process.env.MYSQL_URL?.trim();
  if (databaseUrl?.startsWith('mysql://')) {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      ssl: parsed.searchParams.get('ssl') === 'true' ? {} : undefined,
    };
  }

  return {
    host: process.env.MYSQLHOST?.trim() || process.env.DB_HOST?.trim(),
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQLUSER?.trim() || process.env.DB_USER?.trim(),
    password: process.env.MYSQLPASSWORD ?? process.env.DB_PASSWORD,
  };
}

function resolveBackupPath(argument) {
  if (argument) {
    const resolved = path.resolve(repositoryRoot, argument);
    if (path.dirname(resolved) !== backupDirectory) {
      throw new Error('Backup phải nằm trực tiếp trong thư mục backups/.');
    }
    if (!/^nomnom-\d{8}T\d{6}Z\.sql$/.test(path.basename(resolved))) {
      throw new Error('Tên backup không đúng định dạng nomnom-YYYYMMDDTHHMMSSZ.sql.');
    }
    return resolved;
  }

  const backups = fs.readdirSync(backupDirectory)
    .filter((name) => /^nomnom-\d{8}T\d{6}Z\.sql$/.test(name))
    .sort();
  if (!backups.length) throw new Error('Không tìm thấy backup NomNom để kiểm chứng.');
  return path.join(backupDirectory, backups.at(-1));
}

const backupPath = resolveBackupPath(process.argv[2]);
const sql = fs.readFileSync(backupPath, 'utf8');
if (!sql.startsWith('-- NomNom consistent database backup')) {
  throw new Error('File không có chữ ký backup NomNom hợp lệ.');
}

const temporaryDatabase = `nomnom_restore_verify_${crypto.randomBytes(6).toString('hex')}`;
const connection = await mysql.createConnection({
  ...connectionConfig(),
  charset: 'utf8mb4',
  multipleStatements: true,
});
let temporaryDatabaseCreated = false;

try {
  await connection.query(`CREATE DATABASE ${quoteIdentifier(temporaryDatabase)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  temporaryDatabaseCreated = true;
  await connection.query(`USE ${quoteIdentifier(temporaryDatabase)}`);
  await connection.query(sql);

  const [tables] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  let rows = 0;
  for (const tableRow of tables) {
    const table = Object.values(tableRow)[0];
    const [[countRow]] = await connection.query(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`);
    rows += Number(countRow.count);
  }

  console.log(JSON.stringify({
    backupPath,
    sha256: crypto.createHash('sha256').update(sql).digest('hex'),
    tables: tables.length,
    rows,
    restoredIntoTemporaryDatabase: true,
  }, null, 2));
} finally {
  if (temporaryDatabaseCreated) {
    await connection.query('USE information_schema');
    await connection.query(`DROP DATABASE ${quoteIdentifier(temporaryDatabase)}`);
  }
  await connection.end();
}
