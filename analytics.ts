import { API } from './api';

function getSessionId(): string {
  let id = sessionStorage.getItem('_chv_sid');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_chv_sid', id);
  }
  return id;
}

export function track(event: string, props: Record<string, unknown> = {}) {
  const sid = getSessionId();
  fetch(`${API}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-ID': sid },
    body: JSON.stringify({ event, path: location.pathname + location.search, referrer: document.referrer, props }),
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(title?: string) {
  track('page_view', {
    title: title || document.title,
    screen: `${window.screen.width}x${window.screen.height}`,
    lang: navigator.language,
  });
}
