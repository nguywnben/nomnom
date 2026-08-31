import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveContentTab,
  resolveQueryTab,
  shouldShowInitialLoader,
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

test('resolveQueryTab accepts only declared URL tabs', () => {
  const allowedTabs = ['config', 'logs'];

  assert.equal(resolveQueryTab(new URLSearchParams('tab=logs'), allowedTabs, 'config'), 'logs');
  assert.equal(resolveQueryTab(new URLSearchParams('tab=unknown'), allowedTabs, 'config'), 'config');
  assert.equal(resolveQueryTab(new URLSearchParams(), allowedTabs, 'config'), 'config');
});

test('shouldShowInitialLoader keeps populated tab content visible while refreshing', () => {
  assert.equal(shouldShowInitialLoader(true, []), true);
  assert.equal(shouldShowInitialLoader(true, [{ id: 1 }]), false);
  assert.equal(shouldShowInitialLoader(false, []), false);
});
