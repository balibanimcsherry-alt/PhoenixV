import { useEffect } from 'react';
import { PROPERTY } from './property';

const SITE = PROPERTY.domain;
const DEFAULT_OG_IMAGE = `${SITE}/images/balcony.jpg`;

interface MetaProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  schema?: object | object[];
}

export default function SEOMeta({ title, description, canonical, ogImage, noindex, schema }: MetaProps) {
  const fullCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${SITE}${canonical}`) : undefined;
  const image = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow');
    setOg('title', title);
    setOg('description', description);
    setOg('image', image);
    setOg('type', 'website');
    setOg('site_name', 'Coastal Haven at Phoenix V');
    setTwitter('card', 'summary_large_image');
    setTwitter('title', title);
    setTwitter('description', description);
    setTwitter('image', image);
    if (fullCanonical) setCanonical(fullCanonical);
    if (schema) setSchema(schema);

    return () => {
      if (schema) removeSchema();
    };
  }, [title, description, fullCanonical, image, noindex]);

  return null;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
  el.content = content;
}

function setOg(prop: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="og:${prop}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', `og:${prop}`); document.head.appendChild(el); }
  el.content = content;
}

function setTwitter(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="twitter:${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = `twitter:${name}`; document.head.appendChild(el); }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.href = href;
}

const SCHEMA_ID = 'ld-json-dynamic';
function setSchema(data: object | object[]) {
  let el = document.getElementById(SCHEMA_ID) as HTMLScriptElement | null;
  if (!el) { el = document.createElement('script'); el.id = SCHEMA_ID; el.type = 'application/ld+json'; document.head.appendChild(el); }
  el.textContent = JSON.stringify(Array.isArray(data) ? data : [data]);
}
function removeSchema() {
  document.getElementById(SCHEMA_ID)?.remove();
}
