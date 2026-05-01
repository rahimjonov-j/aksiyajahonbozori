import crypto from "crypto";
import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "analytics.json");
const BLOB_PATH = "analytics/store.json";
const RECENT_EVENTS_LIMIT = 150;
export const ANALYTICS_VISITOR_COOKIE = "ajb_vid";
export const ANALYTICS_VISITOR_PUBLIC_COOKIE = "ajb_vid_public";
let memoryStore = null;
const PLATFORM_KEYS = ["telegram", "instagram", "facebook", "direct", "other"];
const PLATFORM_LABELS = {
  telegram: "Telegram",
  instagram: "Instagram",
  facebook: "Facebook",
  direct: "To'g'ridan-to'g'ri",
  other: "Boshqa",
};

function createEmptyPlatformStats() {
  return {
    visits: 0,
    uniqueVisitors: 0,
  };
}

function createEmptySourceBreakdown() {
  return {
    telegram: createEmptyPlatformStats(),
    instagram: createEmptyPlatformStats(),
    facebook: createEmptyPlatformStats(),
    direct: createEmptyPlatformStats(),
    other: createEmptyPlatformStats(),
  };
}

function mergeSourceBreakdown(value = {}) {
  return {
    telegram: {
      ...createEmptyPlatformStats(),
      ...(value.telegram ?? {}),
    },
    instagram: {
      ...createEmptyPlatformStats(),
      ...(value.instagram ?? {}),
    },
    facebook: {
      ...createEmptyPlatformStats(),
      ...(value.facebook ?? {}),
    },
    direct: {
      ...createEmptyPlatformStats(),
      ...(value.direct ?? {}),
    },
    other: {
      ...createEmptyPlatformStats(),
      ...(value.other ?? {}),
    },
  };
}

function createEmptySeenSources() {
  return {
    telegram: false,
    instagram: false,
    facebook: false,
    direct: false,
    other: false,
  };
}

function createEmptyDay() {
  return {
    visits: 0,
    uniqueVisitors: 0,
    telegramClicks: 0,
    uniqueTelegramClickers: 0,
    telegramOpenSignals: 0,
    uniqueTelegramOpenVisitors: 0,
    telegramConfirmedStarts: 0,
    uniqueTelegramConfirmedVisitors: 0,
    sourceBreakdown: createEmptySourceBreakdown(),
  };
}

function createEmptyStore() {
  return {
    summary: {
      totalVisits: 0,
      uniqueVisitors: 0,
      totalTelegramClicks: 0,
      uniqueTelegramClickers: 0,
      totalTelegramOpenSignals: 0,
      uniqueTelegramOpenVisitors: 0,
      totalTelegramConfirmedStarts: 0,
      uniqueTelegramConfirmedVisitors: 0,
      lastVisitAt: null,
      lastTelegramClickAt: null,
      lastTelegramOpenAt: null,
      lastTelegramConfirmedAt: null,
      sourceBreakdown: createEmptySourceBreakdown(),
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
      sourceBreakdown: mergeSourceBreakdown(parsed.summary?.sourceBreakdown),
    },
    daily: parsed.daily ?? {},
    visitors: Object.fromEntries(
      Object.entries(parsed.visitors ?? {}).map(([visitorId, visitor]) => [
        visitorId,
        {
          firstSeenAt: visitor.firstSeenAt ?? null,
          lastSeenAt: visitor.lastSeenAt ?? null,
          pageViews: visitor.pageViews ?? 0,
          telegramClicks: visitor.telegramClicks ?? 0,
          telegramOpenSignals: visitor.telegramOpenSignals ?? 0,
          telegramConfirmedStarts: visitor.telegramConfirmedStarts ?? 0,
          firstReferrer: visitor.firstReferrer ?? "direct",
          lastReferrer: visitor.lastReferrer ?? "direct",
          lastPathname: visitor.lastPathname ?? "/",
          firstSourceType: visitor.firstSourceType ?? "direct",
          firstSourceLabel:
            visitor.firstSourceLabel ?? PLATFORM_LABELS.direct,
          lastSourceType: visitor.lastSourceType ?? "direct",
          lastSourceLabel: visitor.lastSourceLabel ?? PLATFORM_LABELS.direct,
          seenSources: {
            ...createEmptySeenSources(),
            ...(visitor.seenSources ?? {}),
          },
          seenSourcesByDay: visitor.seenSourcesByDay ?? {},
        },
      ]),
    ),
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
  } else {
    store.daily[dayKey] = {
      ...createEmptyDay(),
      ...store.daily[dayKey],
      sourceBreakdown: mergeSourceBreakdown(store.daily[dayKey].sourceBreakdown),
    };
  }

  return store.daily[dayKey];
}

function sanitizeText(value) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function getSearchParams(meta = {}) {
  const rawSearch = sanitizeText(meta.search);

  if (!rawSearch) {
    return new URLSearchParams();
  }

  return new URLSearchParams(rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`);
}

function getPlatformFromText(value) {
  const normalizedValue = sanitizeText(value).toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue === "tg" ||
    normalizedValue.includes("telegram") ||
    normalizedValue.includes("t.me") ||
    normalizedValue.includes("telegram.me")
  ) {
    return "telegram";
  }

  if (
    normalizedValue === "ig" ||
    normalizedValue.includes("instagram") ||
    normalizedValue.includes("instagr.am") ||
    normalizedValue.includes("igshid") ||
    normalizedValue.includes("igsh")
  ) {
    return "instagram";
  }

  if (
    normalizedValue === "fb" ||
    normalizedValue.includes("facebook") ||
    normalizedValue.includes("fbclid") ||
    normalizedValue.includes("fbav") ||
    normalizedValue.includes("fban") ||
    normalizedValue.includes("meta")
  ) {
    return "facebook";
  }

  return null;
}

function getSourceInfo(meta = {}) {
  const referrer = sanitizeText(meta.referrer);
  const userAgent = sanitizeText(meta.userAgent);
  const searchParams = getSearchParams(meta);
  const querySourceValues = [
    searchParams.get("utm_source"),
    searchParams.get("source"),
    searchParams.get("ref"),
    searchParams.get("from"),
  ].filter(Boolean);

  for (const querySourceValue of querySourceValues) {
    const platform = getPlatformFromText(querySourceValue);

    if (platform) {
      return {
        sourceType: platform,
        sourceLabel: PLATFORM_LABELS[platform],
      };
    }
  }

  if (searchParams.has("fbclid")) {
    return {
      sourceType: "facebook",
      sourceLabel: PLATFORM_LABELS.facebook,
    };
  }

  if (searchParams.has("igshid") || searchParams.has("igsh")) {
    return {
      sourceType: "instagram",
      sourceLabel: PLATFORM_LABELS.instagram,
    };
  }

  const referrerPlatform = getPlatformFromText(referrer);

  if (referrerPlatform) {
    return {
      sourceType: referrerPlatform,
      sourceLabel: PLATFORM_LABELS[referrerPlatform],
    };
  }

  const userAgentPlatform = getPlatformFromText(userAgent);

  if (userAgentPlatform) {
    return {
      sourceType: userAgentPlatform,
      sourceLabel: PLATFORM_LABELS[userAgentPlatform],
    };
  }

  if (!referrer) {
    return {
      sourceType: "direct",
      sourceLabel: PLATFORM_LABELS.direct,
    };
  }

  try {
    const hostname = new URL(referrer).hostname.replace(/^www\./, "");
    return {
      sourceType: "other",
      sourceLabel: hostname,
    };
  } catch {
    return {
      sourceType: "other",
      sourceLabel: referrer,
    };
  }
}

function createEvent(type, visitorId, meta, happenedAt) {
  const { sourceType, sourceLabel } = getSourceInfo(meta);

  return {
    type,
    visitorId,
    happenedAt,
    pathname: sanitizeText(meta.pathname) || "/",
    referrer: sanitizeText(meta.referrer) || "direct",
    userAgent: sanitizeText(meta.userAgent) || "unknown",
    sourceType,
    sourceLabel,
  };
}

function pushRecentEvent(store, event) {
  store.recentEvents.unshift(event);
  store.recentEvents = store.recentEvents.slice(0, RECENT_EVENTS_LIMIT);
}

function ensureVisitor(store, visitorId, meta, happenedAt) {
  const dayBucket = getDayBucket(store, getDayKey(new Date(happenedAt)));
  let visitor = store.visitors[visitorId];
  const { sourceType, sourceLabel } = getSourceInfo(meta);

  if (!visitor) {
    visitor = {
      firstSeenAt: happenedAt,
      lastSeenAt: happenedAt,
      pageViews: 0,
      telegramClicks: 0,
      telegramOpenSignals: 0,
      telegramConfirmedStarts: 0,
      firstReferrer: sanitizeText(meta.referrer) || "direct",
      lastReferrer: sanitizeText(meta.referrer) || "direct",
      lastPathname: sanitizeText(meta.pathname) || "/",
      firstSourceType: sourceType,
      firstSourceLabel: sourceLabel,
      lastSourceType: sourceType,
      lastSourceLabel: sourceLabel,
      seenSources: createEmptySeenSources(),
      seenSourcesByDay: {},
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

export function isValidVisitorId(visitorId) {
  return /^[a-z0-9-]{8,64}$/i.test(sanitizeText(visitorId));
}

export function buildTelegramStartPayload(basePrefix, visitorId) {
  const prefix = sanitizeText(basePrefix) || "ref";
  const cleanedVisitorId = sanitizeText(visitorId);

  if (!cleanedVisitorId) {
    return prefix;
  }

  return `${prefix}_v_${cleanedVisitorId}`;
}

export function extractVisitorIdFromTelegramStart(startPayload) {
  const value = sanitizeText(startPayload);
  const marker = "_v_";
  const markerIndex = value.lastIndexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const visitorId = value.slice(markerIndex + marker.length).trim();

  if (!isValidVisitorId(visitorId)) {
    return null;
  }

  return visitorId;
}

export async function trackVisit(visitorId, meta = {}) {
  const store = await readStore();
  const happenedAt = new Date().toISOString();
  const { visitor, dayBucket } = ensureVisitor(store, visitorId, meta, happenedAt);
  const { sourceType, sourceLabel } = getSourceInfo(meta);
  const dayKey = getDayKey(new Date(happenedAt));

  visitor.pageViews += 1;
  visitor.lastSeenAt = happenedAt;
  visitor.lastReferrer = sanitizeText(meta.referrer) || visitor.lastReferrer;
  visitor.lastPathname = sanitizeText(meta.pathname) || visitor.lastPathname;
  visitor.lastSourceType = sourceType;
  visitor.lastSourceLabel = sourceLabel;

  store.summary.totalVisits += 1;
  store.summary.lastVisitAt = happenedAt;
  dayBucket.visits += 1;
  store.summary.sourceBreakdown[sourceType].visits += 1;
  dayBucket.sourceBreakdown[sourceType].visits += 1;

  if (!visitor.seenSources[sourceType]) {
    visitor.seenSources[sourceType] = true;
    store.summary.sourceBreakdown[sourceType].uniqueVisitors += 1;
  }

  if (!visitor.seenSourcesByDay[dayKey]) {
    visitor.seenSourcesByDay[dayKey] = createEmptySeenSources();
  }

  if (!visitor.seenSourcesByDay[dayKey][sourceType]) {
    visitor.seenSourcesByDay[dayKey][sourceType] = true;
    dayBucket.sourceBreakdown[sourceType].uniqueVisitors += 1;
  }

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

export async function trackTelegramOpenLikely(visitorId, meta = {}) {
  const store = await readStore();
  const happenedAt = new Date().toISOString();
  const { visitor, dayBucket } = ensureVisitor(store, visitorId, meta, happenedAt);
  const isFirstOpenSignal = visitor.telegramOpenSignals === 0;

  visitor.telegramOpenSignals += 1;
  visitor.lastSeenAt = happenedAt;
  visitor.lastReferrer = sanitizeText(meta.referrer) || visitor.lastReferrer;
  visitor.lastPathname = sanitizeText(meta.pathname) || visitor.lastPathname;

  store.summary.totalTelegramOpenSignals += 1;
  store.summary.lastTelegramOpenAt = happenedAt;
  dayBucket.telegramOpenSignals += 1;

  if (isFirstOpenSignal) {
    store.summary.uniqueTelegramOpenVisitors += 1;
    dayBucket.uniqueTelegramOpenVisitors += 1;
  }

  pushRecentEvent(
    store,
    createEvent("telegram_open", visitorId, meta, happenedAt),
  );
  await writeStore(store);

  return store.summary;
}

export async function trackTelegramConfirmedStart(visitorId, meta = {}) {
  const store = await readStore();
  const happenedAt = new Date().toISOString();
  const { visitor, dayBucket } = ensureVisitor(store, visitorId, meta, happenedAt);
  const isFirstConfirmedStart = visitor.telegramConfirmedStarts === 0;

  visitor.telegramConfirmedStarts += 1;
  visitor.lastSeenAt = happenedAt;
  visitor.lastReferrer = sanitizeText(meta.referrer) || visitor.lastReferrer;
  visitor.lastPathname = sanitizeText(meta.pathname) || visitor.lastPathname;

  store.summary.totalTelegramConfirmedStarts += 1;
  store.summary.lastTelegramConfirmedAt = happenedAt;
  dayBucket.telegramConfirmedStarts += 1;

  if (isFirstConfirmedStart) {
    store.summary.uniqueTelegramConfirmedVisitors += 1;
    dayBucket.uniqueTelegramConfirmedVisitors += 1;
  }

  pushRecentEvent(
    store,
    createEvent("telegram_start", visitorId, meta, happenedAt),
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
    const bucket = {
      ...createEmptyDay(),
      ...(store.daily[key] ?? {}),
    };

    result.push({
      day: key,
      ...bucket,
    });
  }

  return result;
}

function buildTopReferrers(store) {
  return PLATFORM_KEYS.map((platformKey) => ({
    key: platformKey,
    label: PLATFORM_LABELS[platformKey],
    visits: store.summary.sourceBreakdown[platformKey].visits,
    uniqueVisitors: store.summary.sourceBreakdown[platformKey].uniqueVisitors,
  })).sort((left, right) => right.visits - left.visits);
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
    platformBreakdown: buildTopReferrers(store),
    recentEvents: store.recentEvents.slice(0, 12),
    recentVisitors: buildRecentVisitors(store),
  };
}
