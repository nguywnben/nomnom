import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveContentTab,
  shouldLoadContentSection,
} from './contentTabs.js';

test('resolveContentTab uses the URL as the single source of truth', () => {
  assert.equal(resolveContentTab(new URLSearchParams('tab=cuisines')), 'cuisines');
  assert.equal(resolveContentTab(new URLSearchParams('tab=home')), 'home');
  assert.equal(resolveContentTab(new URLSearchParams('tab=unknown')), 'home');
});

test('shouldLoadContentSection does not reload an already loaded tab', () => {
  assert.equal(shouldLoadContentSection('home', 'home', false), true);
  assert.equal(shouldLoadContentSection('home', 'home', true), false);
  assert.equal(shouldLoadContentSection('cuisines', 'home', false), false);
});
