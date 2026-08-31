export function normalizeOwnedPublicId(value) {
  const publicId = String(value ?? '').trim();
  if (
    publicId.length < 8
    || publicId.length > 255
    || !/^nomnom\/(avatar|restaurant|menu|cuisine|review)\/[A-Za-z0-9_-]+$/.test(publicId)
  ) {
    const error = new Error('UPLOAD_PUBLIC_ID_INVALID');
    error.status = 400;
    error.code = 'UPLOAD_PUBLIC_ID_INVALID';
    throw error;
  }
  return publicId;
}

export function canDeleteUpload({ ownerUserId, actorUserId, actorRoles = [] }) {
  return Number(ownerUserId) === Number(actorUserId) || actorRoles.includes('admin');
}
