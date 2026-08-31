export function resolveContentTab(searchParams) {
  return searchParams.get('tab') === 'cuisines' ? 'cuisines' : 'home';
}

export function shouldLoadContentSection(activeTab, section, hasLoaded) {
  return activeTab === section && !hasLoaded;
}
