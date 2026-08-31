export function resolveQueryTab(searchParams, allowedTabs, fallback) {
  const requestedTab = searchParams.get('tab');
  return allowedTabs.includes(requestedTab) ? requestedTab : fallback;
}

export function resolveContentTab(searchParams) {
  return resolveQueryTab(searchParams, ['home', 'cuisines'], 'home');
}

export function shouldLoadContentSection(activeTab, section, hasLoaded) {
  return activeTab === section && !hasLoaded;
}

export function shouldShowInitialLoader(loading, items) {
  return loading && items.length === 0;
}
