export function serializeBackupValue(value, escape) {
  const isStructuredJson = value !== null
    && typeof value === 'object'
    && !(value instanceof Date)
    && !Buffer.isBuffer(value);

  return escape(isStructuredJson ? JSON.stringify(value) : value);
}

export function getInsertableColumnNames(columns) {
  return columns
    .filter((column) => !/^(VIRTUAL|STORED) GENERATED$/i.test(String(column.Extra).trim()))
    .map((column) => column.Field);
}
