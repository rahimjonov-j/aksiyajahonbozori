import crypto from "crypto";
import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "analytics.json");
const BLOB_PATH = "analytics/store.json";
const RECENT_EVENTS_LIMIT = 150;
export const ANALYTICS_VISITOR_COOKIE = "ajb_vid";
let memoryStore = null;

function createEmptyDay() {
  return {
    visits: 0,
    uniqueVisitors: 0,
    telegramClicks: 0,
    uniqueTelegramClickers: 0,
  };
}

function createEmptyStore() {
  return {
    summary: {
      totalVisits: 0,
      uniqueVisitors: 0,
      totalTelegramClicks: 0,
      uniqueTelegramClickers: 0,
      lastVisitAt: null,
      lastTelegramClickAt: null,
    },
    daily: {},
    visitors: {},
    recentEvents: [],
  };
}

function cloneStore(store) {
  return JSON.parse(JSON.stringify(store));
}

function getMemoryStore() {
  if (!memoryStore) {
    memoryStore = createEmptyStore();
  }

  return cloneStore(memoryStore);
}

function setMemoryStore(store) {
  memoryStore = cloneStore(store);
}

function normalizeStore(parsed) {
  return {
    ...createEmptyStore(),
    ...parsed,
    summary: {
      ...createEmptyStore().summary,
      ...parsed.summary,
    },
    daily: parsed.daily ?? {},
    visitors: parsed.visitors ?? {},
    recentEvents: parsed.recentEvents ?? [],
  };
}

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlobText(pathname) {
  const response = await get(pathname, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    useCache: false,
  });

  if (!response || response.statusCode !== 200 || !response.stream) {
    return null;
  }

  return new Response(response.stream).text();
}

async function readStoreFromBlob() {
  try {
    const text = await readBlobText(BLOB_PATH);

    if (!text) {
      const emptyStore = createEmptyStore();
      await writeStoreToBlob(emptyStore);
      return emptyStore;
    }

    const normalized = normalizeStore(JSON.parse(text));
    setMemoryStore(normalized);
    return normalized;
  } catch {
    return null;
  }
}

async function writeStoreToBlob(store) {
  try {
    await put(BLOB_PATH, JSON.stringify(store, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    setMemoryStore(store);
    return true;
  } catch {
    return false;
  }
}

function ensureFileStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(createEmptyStore(), null, 2));
    }

    return true;
  } catch {
    return false;
  }
}

function readStoreFromFile() {
  if (!ensureFileStore()) {
    return getMemoryStore();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const normalized = normalizeStore(parsed);
    setMemoryStore(normalized);
    return normalized;
  } catch {
    const fallback = createEmptyStore();

    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2));
    } catch {
      setMemoryStore(fallback);
      return fallback;
    }

    setMemoryStore(fallback);
    return fallback;
  }
}

function writeStoreToFile(store) {
  setMemoryStore(store);

  if (!ensureFileStore()) {
    return;
  }

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {}
}

async function readStore() {
  if (isBlobConfigured()) {
    const blobStore = await readStoreFromBlob();

    if (blobStore) {
      return blobStore;
    }
  }

  return readStoreFromFile();
}

async function writeStore(store) {
  if (isBlobConfigured()) {
    const saved = await writeStoreToBlob(store);

    if (saved) {
      return;
    }
  }

  writeStoreToFile(store);
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDayBucket(store, dayKey) {
  if (!store.daily[dayKey]) {
    store.daily[dayKey] = createEmptyDay();
  }

  return store.daily[dayKey];
}

function sanitizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function createEvent(type, visitorId, meta, happenedAt) {
  return {
    type,
    visitorId,
    happenedAt,
    pathname: sanitizeText(meta.pathname) || "/",
    referrer: sanitizeText(meta.referrer) || "direct",
    userAgent: sanitizeText(meta.userAgent) || "unknown",
  };
}

function pushRecentEvent(store, event) {
  store.recentEvents.unshift(event);
  store.recentEvents = store.recentEvents.slice(0, RECENT_EVENTS_LIMIT);
}

function ensureVisitor(store, visitorId, meta, happenedAt) {
  const dayBucket = getDayBucket(store, getDayKey(new Date(happenedAt)));
  let visitor = store.visitors[visitorId];

  if (!visitor) {
    visitor = {
      firstSeenAt: happenedAt,
      lastSeenAt: happenedAt,
      pageViews: 0,
      telegramClicks: 0,
      firstReferrer: sanitizeText(meta.referrer) || "direct",
      lastReferrer: sanitizeText(meta.referrer) || "direct",
      lastPathname: sanitizeText(meta.pathname) || "/",
    };

    store.visitors[visitorId] = visitor;
    store.summary.uniqueVisitors += 1;
    dayBucket.uniqueVisitors += 1;
  }

  return { visitor, dayBucket };
}

export function createVisitorId() {
  return crypto.randomUUID();
}

export async function trackVisit(visitorId, meta = {}) {
  const store = await readStore();
  const happenedAt = new Date().toISOString();
  const { visitor, dayBucket } = ensureVisitor(store, visitorId, meta, happenedAt);

  visitor.pageViews += 1;
  visitor.lastSeenAt = happenedAt;
  visitor.lastReferrer = sanitizeText(meta.referrer) || visitor.lastReferrer;
  visitor.lastPathname = sanitizeText(meta.pathname) || visitor.lastPathname;

  store.summary.totalVisits += 1;
  store.summary.lastVisitAt = happenedAt;
  dayBucket.visits += 1;

  pushRecentEvent(store, createEvent("visit", visitorId, meta, happenedAt));
  await writeStore(store);

  return store.summary;
}

export async function trackTelegramClick(visitorId, meta = {}) {
  const store = await readStore();
  const happenedAt = new Date().toISOString();
  const { visitor, dayBucket } = ensureVisitor(store, visitorId, meta, happenedAt);
  const isFirstTelegramClick = visitor.telegramClicks === 0;

  visitor.telegramClicks += 1;
  visitor.lastSeenAt = happenedAt;
  visitor.lastReferrer = sanitizeText(meta.referrer) || visitor.lastReferrer;
  visitor.lastPathname = sanitizeText(meta.pathname) || visitor.lastPathname;

  store.summary.totalTelegramClicks += 1;
  store.summary.lastTelegramClickAt = happenedAt;
  dayBucket.telegramClicks += 1;

  if (isFirstTelegramClick) {
    store.summary.uniqueTelegramClickers += 1;
    dayBucket.uniqueTelegramClickers += 1;
  }

  pushRecentEvent(
    store,
    createEvent("telegram_click", visitorId, meta, happenedAt),
  );
  await writeStore(store);

  return store.summary;
}

function buildLastDays(store, days = 7) {
  const result = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = getDayKey(date);
    const bucket = store.daily[key] ?? createEmptyDay();

    result.push({
      day: key,
      ...bucket,
    });
  }

  return result;
}

function buildTopReferrers(store) {
  const counts = new Map();

  for (const visitor of Object.values(store.visitors)) {
    const referrer = visitor.firstReferrer || "direct";
    counts.set(referrer, (counts.get(referrer) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function buildRecentVisitors(store) {
  return Object.entries(store.visitors)
    .map(([visitorId, visitor]) => ({
      visitorId,
      ...visitor,
    }))
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
    .slice(0, 8);
}

export async function getAnalyticsSnapshot() {
  const store = await readStore();
  const conversionRate =
    store.summary.uniqueVisitors > 0
      ? Number(
          (
            (store.summary.uniqueTelegramClickers / store.summary.uniqueVisitors) *
            100
          ).toFixed(1),
        )
      : 0;

  return {
    summary: {
      ...store.summary,
      conversionRate,
    },
    last7Days: buildLastDays(store),
    topReferrers: buildTopReferrers(store),
    recentEvents: store.recentEvents.slice(0, 12),
    recentVisitors: buildRecentVisitors(store),
  };
}
