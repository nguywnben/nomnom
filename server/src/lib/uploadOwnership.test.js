import assert from 'node:assert/strict';
import test from 'node:test';

import { canDeleteUpload, normalizeOwnedPublicId } from './uploadOwnership.js';

test('only NomNom public ids are accepted', () => {
  assert.equal(normalizeOwnedPublicId('nomnom/menu/123_image'), 'nomnom/menu/123_image');
  assert.throws(() => normalizeOwnedPublicId('../other/image'), /UPLOAD_PUBLIC_ID_INVALID/);
  assert.throws(() => normalizeOwnedPublicId('foreign/image'), /UPLOAD_PUBLIC_ID_INVALID/);
});

test('upload deletion is limited to owner or admin', () => {
  assert.equal(canDeleteUpload({ ownerUserId: 7, actorUserId: 7, actorRoles: ['merchant'] }), true);
  assert.equal(canDeleteUpload({ ownerUserId: 7, actorUserId: 8, actorRoles: ['merchant'] }), false);
  assert.equal(canDeleteUpload({ ownerUserId: 7, actorUserId: 1, actorRoles: ['admin'] }), true);
});
