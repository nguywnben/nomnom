import crypto from 'node:crypto';

const PAYMENT_VERSION = '2.1.0';
const REFUND_RESPONSE_FIELDS = [
  'vnp_ResponseId',
  'vnp_Command',
  'vnp_ResponseCode',
  'vnp_Message',
  'vnp_TmnCode',
  'vnp_TxnRef',
  'vnp_Amount',
  'vnp_BankCode',
  'vnp_PayDate',
  'vnp_TransactionNo',
  'vnp_TransactionType',
  'vnp_TransactionStatus',
  'vnp_OrderInfo',
];

function hmacSha512(value, secret) {
  return crypto.createHmac('sha512', secret).update(value, 'utf8').digest('hex');
}

function encodedEntries(params) {
  return Object.entries(params)
    .filter(([key, value]) => !['vnp_SecureHash', 'vnp_SecureHashType'].includes(key) && value !== undefined && value !== null)
    .map(([key, value]) => [
      encodeURIComponent(key),
      encodeURIComponent(String(value)).replace(/%20/g, '+'),
    ])
    .sort(([left], [right]) => left.localeCompare(right));
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function formatVnpayDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return value.year + value.month + value.day + value.hour + value.minute + value.second;
}

export function signQueryParams(params, secret) {
  const signData = encodedEntries(params)
    .map(([key, value]) => key + '=' + value)
    .join('&');
  return hmacSha512(signData, secret);
}

export function verifyQuerySignature(params, secret) {
  if (!secret || !params?.vnp_SecureHash) return false;
  return safeEqual(signQueryParams(params, secret), params.vnp_SecureHash);
}

export function signPipeFields(payload, fields, secret) {
  const signData = fields.map((field) => String(payload[field] ?? '')).join('|');
  return hmacSha512(signData, secret);
}

export function buildPaymentUrl({
  paymentUrl,
  secret,
  tmnCode,
  txnRef,
  amount,
  returnUrl,
  ipAddress,
  orderInfo,
  now = new Date(),
  expireAt,
}) {
  const calculatedExpireAt = expireAt || new Date(now.getTime() + 15 * 60 * 1000);
  const params = {
    vnp_Version: PAYMENT_VERSION,
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo || 'Thanh toan don hang ' + txnRef,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddress,
    vnp_CreateDate: formatVnpayDate(now),
    vnp_ExpireDate: formatVnpayDate(calculatedExpireAt),
  };
  const query = encodedEntries(params)
    .map(([key, value]) => key + '=' + value)
    .join('&');
  const secureHash = hmacSha512(query, secret);
  return {
    paymentUrl: paymentUrl + '?' + query + '&vnp_SecureHash=' + secureHash,
    params: { ...params, vnp_SecureHash: secureHash },
  };
}

export function buildRefundPayload({
  secret,
  tmnCode,
  requestId,
  txnRef,
  amount,
  transactionNo,
  transactionDate,
  createBy,
  ipAddress,
  orderInfo,
  now = new Date(),
}) {
  const payload = {
    vnp_RequestId: requestId,
    vnp_Version: PAYMENT_VERSION,
    vnp_Command: 'refund',
    vnp_TmnCode: tmnCode,
    vnp_TransactionType: '02',
    vnp_TxnRef: txnRef,
    vnp_Amount: String(Math.round(Number(amount) * 100)),
    vnp_TransactionNo: transactionNo || '',
    vnp_TransactionDate: transactionDate,
    vnp_CreateBy: String(createBy),
    vnp_CreateDate: formatVnpayDate(now),
    vnp_IpAddr: ipAddress,
    vnp_OrderInfo: orderInfo || 'Hoan tien don hang ' + txnRef,
  };
  payload.vnp_SecureHash = signPipeFields(payload, [
    'vnp_RequestId',
    'vnp_Version',
    'vnp_Command',
    'vnp_TmnCode',
    'vnp_TransactionType',
    'vnp_TxnRef',
    'vnp_Amount',
    'vnp_TransactionNo',
    'vnp_TransactionDate',
    'vnp_CreateBy',
    'vnp_CreateDate',
    'vnp_IpAddr',
    'vnp_OrderInfo',
  ], secret);
  return payload;
}

export function verifyRefundResponse(response, secret) {
  if (!secret || !response?.vnp_SecureHash) return false;
  return safeEqual(signPipeFields(response, REFUND_RESPONSE_FIELDS, secret), response.vnp_SecureHash);
}
