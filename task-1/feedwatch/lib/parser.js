import { XMLParser } from 'fast-xml-parser';

function asArray(maybeArrayOrSingle) {
  if (maybeArrayOrSingle === undefined || maybeArrayOrSingle === null) return [];
  return Array.isArray(maybeArrayOrSingle) ? maybeArrayOrSingle : [maybeArrayOrSingle];
}

function textOf(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value['#text'] === 'string') return value['#text'];
    return '';
  }
  return '';
}

function normalizeString(value) {
  const s = textOf(value);
  return s == null ? '' : String(s).trim();
}

function toISODate(value) {
  const s = normalizeString(value);
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

function getFirstAtomHref(linkNode) {
  if (!linkNode) return '';
  if (Array.isArray(linkNode)) {
    for (const l of linkNode) {
      const href = l?.['@_href'];
      if (typeof href === 'string') return href;
    }
    return '';
  }
  if (typeof linkNode === 'object') {
    const href = linkNode['@_href'];
    return typeof href === 'string' ? href : '';
  }
  return '';
}

export function parseXML(xml) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      trimValues: true,
    });

    const parsed = parser.parse(xml);
    if (!parsed || typeof parsed !== 'object') return [];

    // RSS root usually `rss`, Atom root usually `feed`.
    if (parsed.rss && parsed.rss.channel) {
      const channel = parsed.rss.channel;
      const items = asArray(channel.item);
      return items.map((item) => {
        const title = normalizeString(item.title);
        const link = normalizeString(item.link);
        const pubDate = toISODate(item.pubDate);
        const description = normalizeString(item.description);
        const guidRaw = normalizeString(item.guid);
        const guid = guidRaw || link || title;
        return { title, link, pubDate, description, guid };
      });
    }

    if (parsed.feed && parsed.feed.entry) {
      const entries = asArray(parsed.feed.entry);
      return entries.map((entry) => {
        const title = normalizeString(entry.title);
        const link = getFirstAtomHref(entry.link);
        const pubDate = toISODate(entry.published || entry.updated);
        const description =
          normalizeString(entry.summary) || normalizeString(entry.content) || '';
        const guidRaw = normalizeString(entry.id);
        const guid = guidRaw || link || title;
        return { title, link, pubDate, description, guid };
      });
    }

    return [];
  } catch {
    return [];
  }
}

