function pending(reason) {
  return { status: 'initiated', transactionNo: null, reason };
}

export function classifyRefundGatewayResult({ httpOk, signatureValid, response = {} }) {
  if (!httpOk || !signatureValid) {
    return pending(
      'Chưa thể xác minh kết quả hoàn tiền. Giữ trạng thái chờ đối soát để tránh hoàn tiền hai lần.',
    );
  }

  if (response.vnp_ResponseCode === '00' && response.vnp_TransactionStatus === '00') {
    return {
      status: 'succeeded',
      transactionNo: response.vnp_TransactionNo || null,
      reason: null,
    };
  }

  return {
    status: 'failed',
    transactionNo: null,
    reason: String(
      response.vnp_Message
      || response.vnp_ResponseCode
      || 'Cổng VNPay từ chối yêu cầu hoàn tiền.',
    ),
  };
}

export function classifyRefundTransportError(error) {
  const detail = error?.name === 'TimeoutError'
    ? 'Cổng VNPay hết thời gian phản hồi.'
    : 'Không thể kết nối chắc chắn tới cổng VNPay.';
  return pending(`${detail} Yêu cầu cần được đối soát trước khi thử lại.`);
}
