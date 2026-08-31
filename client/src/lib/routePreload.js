function scheduleWhenIdle(task) {
  if (typeof window === 'undefined') return () => {};

  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => { void task(); }, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(() => { void task(); }, 250);
  return () => window.clearTimeout(id);
}

export function scheduleRoutePreload(loaders, scheduler = scheduleWhenIdle) {
  const cancel = scheduler(async () => {
    await Promise.allSettled(loaders.map((load) => load()));
  });

  return typeof cancel === 'function' ? cancel : () => {};
}
