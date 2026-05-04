import crypto from "crypto";
import fs from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { Pool } from "pg";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "analytics.json");
const BLOB_PATH = "analytics/store.json";
const DATABASE_TABLE = "analytics_store";
const RECENT_EVENTS_LIMIT = 150;
const IS_VERCEL_RUNTIME = process.env.VERCEL === "1";

export const ANALYTICS_VISITOR_COOKIE = "ajb_vid";
export const ANALYTICS_VISITOR_PUBLIC_COOKIE = "ajb_vid_public";

let memoryStore = null;
let lastStorageState = null;
let databasePool = null;
let databaseTableReady = false;

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

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStorageState() {
  return {
    mode: getAnalyticsStorageMode(),
    degraded: false,
    selectedSource: "empty",
    primarySource: getPrimaryStorageSource(),
    warnings: [],
    database: {
      configured: isDatabaseConfigured(),
      healthy: null,
      missing: false,
      reason: null,
    },
    blob: {
      configured: isBlobConfigured(),
      healthy: null,
      missing: false,
      reason: null,
    },
    file: {
      healthy: null,
      missing: false,
      path: DATA_FILE,
      reason: null,
    },
    updatedAt: null,
  };
}

function getMemoryStore() {
  if (!memoryStore) {
    memoryStore = createEmptyStore();
  }

  return cloneValue(memoryStore);
}

function setMemoryStore(store) {
  memoryStore = cloneValue(store);
}

function setLastStorageState(state) {
  lastStorageState = cloneValue({
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

export function getAnalyticsStorageStatus() {
  return cloneValue(lastStorageState ?? createStorageState());
}

function normalizeStore(parsed) {
  return {
    ...createEmptyStore(),
    ...parsed,
    summary: {
      ...createEmptyStore().summary,
      ...(parsed.summary ?? {}),
      sourceBreakdown: mergeSourceBreakdown(parsed.summary?.sourceBreakdown),
    },
    daily: Object.fromEntries(
      Object.entries(parsed.daily ?? {}).map(([dayKey, day]) => [
        dayKey,
        {
          ...createEmptyDay(),
          ...(day ?? {}),
          sourceBreakdown: mergeSourceBreakdown(day?.sourceBreakdown),
        },
      ]),
    ),
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

function getAnalyticsStorageMode() {
  const value = String(
    process.env.ANALYTICS_STORAGE_MODE ?? "auto",
  ).toLowerCase();

  if (value === "blob" || value === "file") {
    return value;
  }

  if (value === "database" || value === "db") {
    return "database";
  }

  return "auto";
}

function getDatabaseConnectionString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
}

function isDatabaseConfigured() {
  return Boolean(getDatabaseConnectionString());
}

function getPrimaryStorageSource() {
  if (isDatabaseConfigured()) {
    return "database";
  }

  if (isBlobConfigured()) {
    return "blob";
  }

  return "file";
}

function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function describeError(error) {
  if (!error) {
    return "unknown_error";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDatabasePool() {
  if (!databasePool) {
    const connectionString = getDatabaseConnectionString();

    databasePool = new Pool({
      connectionString,
      max: 1,
      ssl: connectionString.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }

  return databasePool;
}

async function ensureDatabaseTable() {
  if (databaseTableReady) {
    return;
  }

  const pool = getDatabasePool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${DATABASE_TABLE} (
      store_key TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  databaseTableReady = true;
}

async function readStoreFromDatabaseDetailed() {
  try {
    await ensureDatabaseTable();
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT payload FROM ${DATABASE_TABLE} WHERE store_key = $1 LIMIT 1`,
      ["main"],
    );

    if (!result.rows.length) {
      return { store: null, missing: true, error: null };
    }

    return {
      store: normalizeStore(result.rows[0].payload),
      missing: false,
      error: null,
    };
  } catch (error) {
    return { store: null, missing: false, error };
  }
}

async function writeStoreToDatabaseDetailed(store) {
  try {
    await ensureDatabaseTable();
    const pool = getDatabasePool();
    await pool.query(
      `
        INSERT INTO ${DATABASE_TABLE} (store_key, payload, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (store_key)
        DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      `,
      ["main", JSON.stringify(store)],
    );

    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

function readStoreFromFilePath(filePath, { createIfMissing = false } = {}) {
  try {
    ensureDataDir();

    if (!fs.existsSync(filePath)) {
      if (!createIfMissing) {
        return { store: null, missing: true, error: null };
      }

      fs.writeFileSync(filePath, JSON.stringify(createEmptyStore(), null, 2));
    }

    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { store: normalizeStore(parsed), missing: false, error: null };
  } catch (error) {
    return { store: null, missing: false, error };
  }
}

function writeStoreToFileDetailed(store) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
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

async function readStoreFromBlobDetailed() {
  try {
    const text = await readBlobText(BLOB_PATH);

    if (!text) {
      return { store: null, missing: true, error: null };
    }

    return {
      store: normalizeStore(JSON.parse(text)),
      missing: false,
      error: null,
    };
  } catch (error) {
    return { store: null, missing: false, error };
  }
}

async function writeStoreToBlobDetailed(store) {
  try {
    await put(BLOB_PATH, JSON.stringify(store, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error };
  }
}

function getStoreRank(store) {
  const summary = store.summary ?? {};

  return [
    summary.totalVisits ?? 0,
    summary.uniqueVisitors ?? 0,
    summary.totalTelegramClicks ?? 0,
    summary.totalTelegramOpenSignals ?? 0,
    summary.totalTelegramConfirmedStarts ?? 0,
    Object.keys(store.visitors ?? {}).length,
    Object.keys(store.daily ?? {}).length,
    (store.recentEvents ?? []).length,
  ];
}

function compareStoreRanks(leftStore, rightStore) {
  const leftRank = getStoreRank(leftStore);
  const rightRank = getStoreRank(rightStore);

  for (let index = 0; index < leftRank.length; index += 1) {
    if (leftRank[index] !== rightRank[index]) {
      return leftRank[index] - rightRank[index];
    }
  }

  return 0;
}

function pickBestStore(candidates) {
  const available = candidates.filter((candidate) => candidate.store);

  if (!available.length) {
    return {
      source: "empty",
      store: createEmptyStore(),
    };
  }

  return available.reduce((best, candidate) => {
    if (!best) {
      return candidate;
    }

    return compareStoreRanks(candidate.store, best.store) > 0
      ? candidate
      : best;
  }, null);
}

async function readStore() {
  const storageState = createStorageState();
  const mode = storageState.mode;
  const candidates = [];
  const shouldUseDatabase = mode !== "blob" && isDatabaseConfigured();
  const shouldUseBlob = mode !== "file" && isBlobConfigured();
  const shouldUseFile = mode !== "blob";

  if (mode === "database" && !isDatabaseConfigured()) {
    storageState.database.healthy = false;
    storageState.database.reason =
      "POSTGRES_URL yoki DATABASE_URL topilmadi";
    storageState.warnings.push(
      "Database majburiy yoqilgan, lekin connection string topilmadi.",
    );
  }

  if (mode === "blob" && !isBlobConfigured()) {
    storageState.blob.healthy = false;
    storageState.blob.reason = "BLOB_READ_WRITE_TOKEN is not configured";
    storageState.warnings.push(
      "Blob majburiy yoqilgan, lekin BLOB_READ_WRITE_TOKEN topilmadi.",
    );
  }

  if (shouldUseDatabase) {
    const databaseResult = await readStoreFromDatabaseDetailed();

    storageState.database.missing = databaseResult.missing;
    storageState.database.healthy = databaseResult.error ? false : true;
    storageState.database.reason = databaseResult.error
      ? describeError(databaseResult.error)
      : databaseResult.missing
        ? "analytics_store jadvalida main yozuvi topilmadi"
        : null;

    if (databaseResult.store) {
      candidates.push({ source: "database", store: databaseResult.store });
    }
  }

  if (shouldUseBlob) {
    const blobResult = await readStoreFromBlobDetailed();

    storageState.blob.missing = blobResult.missing;
    storageState.blob.healthy = blobResult.error ? false : true;
    storageState.blob.reason = blobResult.error
      ? describeError(blobResult.error)
      : blobResult.missing
        ? "analytics/store.json not found in Blob"
        : null;

    if (blobResult.store) {
      candidates.push({ source: "blob", store: blobResult.store });
    }
  }

  if (shouldUseFile) {
    const fileResult = readStoreFromFilePath(DATA_FILE, {
      createIfMissing: !IS_VERCEL_RUNTIME,
    });

    storageState.file.missing = fileResult.missing;
    storageState.file.healthy = fileResult.error ? false : true;
    storageState.file.reason = fileResult.error
      ? describeError(fileResult.error)
      : fileResult.missing
        ? "analytics.json not found locally"
        : null;

    if (fileResult.store) {
      candidates.push({ source: "file", store: fileResult.store });
    }
  }

  if (memoryStore) {
    candidates.push({ source: "memory", store: getMemoryStore() });
  }

  const selected = pickBestStore(candidates);
  const hasUsefulData =
    selected.store &&
    compareStoreRanks(selected.store, createEmptyStore()) > 0;

  if (
    shouldUseDatabase &&
    selected.source !== "database" &&
    hasUsefulData
  ) {
    const syncResult = await writeStoreToDatabaseDetailed(selected.store);

    if (syncResult.ok) {
      storageState.warnings.push(
        "Fallback store ichidagi tarixiy ma'lumot database'ga qayta yozildi.",
      );
      storageState.database.healthy = true;
      storageState.database.missing = false;
      storageState.database.reason = null;
    } else {
      storageState.warnings.push(
        `Database storage tiklanmadi: ${describeError(syncResult.error)}`,
      );
      storageState.database.healthy = false;
      storageState.database.reason = describeError(syncResult.error);
    }
  }

  if (
    shouldUseBlob &&
    selected.source !== "blob" &&
    hasUsefulData
  ) {
    const syncResult = await writeStoreToBlobDetailed(selected.store);

    if (syncResult.ok) {
      storageState.warnings.push(
        "Fallback store ichidagi tarixiy ma'lumot Blob storage'ga qayta yozildi.",
      );
      storageState.blob.healthy = true;
      storageState.blob.missing = false;
      storageState.blob.reason = null;
    } else {
      storageState.warnings.push(
        `Blob storage tiklanmadi: ${describeError(syncResult.error)}`,
      );
      storageState.blob.healthy = false;
      storageState.blob.reason = describeError(syncResult.error);
    }
  }

  storageState.selectedSource = selected.source;
  const primarySource = storageState.primarySource;
  const primaryStatus =
    primarySource === "database"
      ? storageState.database
      : primarySource === "blob"
        ? storageState.blob
        : storageState.file;

  storageState.degraded =
    selected.source === "memory" ||
    selected.source === "empty" ||
    (primarySource === "file" && IS_VERCEL_RUNTIME) ||
    primaryStatus.healthy === false ||
    (hasUsefulData && selected.source !== primarySource);

  if (storageState.degraded) {
    const primaryReason =
      primarySource === "database"
        ? storageState.database.reason
        : primarySource === "blob"
          ? storageState.blob.reason
          : storageState.file.reason;

    if (primaryReason) {
      storageState.warnings.push(
        `Asosiy analytics storage muammosi: ${primaryReason}`,
      );
    }
  }

  setMemoryStore(selected.store);
  setLastStorageState(storageState);

  return selected.store;
}

function createStorageWriteError(message, details = {}) {
  const error = new Error(message);
  error.code = "ANALYTICS_STORAGE_UNAVAILABLE";
  error.details = details;
  return error;
}

async function writeStore(store) {
  const mode = getAnalyticsStorageMode();
  const shouldUseDatabase = mode !== "blob" && isDatabaseConfigured();
  const shouldUseBlob = mode !== "file" && isBlobConfigured();
  const shouldUseFile = mode !== "blob";
  let databaseFailure = null;
  let blobFailure = null;

  if (shouldUseDatabase) {
    const databaseResult = await writeStoreToDatabaseDetailed(store);

    if (databaseResult.ok) {
      setMemoryStore(store);

      if (shouldUseBlob) {
        const blobResult = await writeStoreToBlobDetailed(store);
        blobFailure = blobResult.ok ? null : blobResult.error;
      }

      if (shouldUseFile) {
        writeStoreToFileDetailed(store);
      }

      setLastStorageState({
        ...createStorageState(),
        degraded: false,
        selectedSource: "database",
        database: {
          configured: true,
          healthy: true,
          missing: false,
          reason: null,
        },
        blob: {
          configured: isBlobConfigured(),
          healthy: shouldUseBlob ? !blobFailure : null,
          missing: false,
          reason: blobFailure ? describeError(blobFailure) : null,
        },
        file: {
          healthy: shouldUseFile ? true : null,
          missing: false,
          path: DATA_FILE,
          reason: null,
        },
        warnings: blobFailure
          ? [
              `Blob backup ishlamadi, lekin analytics database'ga saqlandi: ${describeError(blobFailure)}`,
            ]
          : [],
      });
      return;
    }

    databaseFailure = databaseResult.error;
  }

  if (shouldUseBlob) {
    const blobResult = await writeStoreToBlobDetailed(store);

    if (blobResult.ok) {
      setMemoryStore(store);

      if (shouldUseFile) {
        writeStoreToFileDetailed(store);
      }

      setLastStorageState({
        ...createStorageState(),
        degraded: Boolean(databaseFailure),
        selectedSource: "blob",
        database: {
          configured: isDatabaseConfigured(),
          healthy: databaseFailure ? false : null,
          missing: false,
          reason: databaseFailure ? describeError(databaseFailure) : null,
        },
        blob: {
          configured: true,
          healthy: true,
          missing: false,
          reason: null,
        },
        file: {
          healthy: shouldUseFile ? true : null,
          missing: false,
          path: DATA_FILE,
          reason: null,
        },
        warnings: databaseFailure
          ? [
              `Database ishlamadi, analytics Blob'ga saqlandi: ${describeError(databaseFailure)}`,
            ]
          : [],
      });
      return;
    }

    blobFailure = blobResult.error;
  }

  const fileResult = shouldUseFile
    ? writeStoreToFileDetailed(store)
    : { ok: false, error: null };

  if (shouldUseFile && fileResult.ok && !IS_VERCEL_RUNTIME) {
    setMemoryStore(store);

    setLastStorageState({
      ...createStorageState(),
      degraded: shouldUseBlob || shouldUseDatabase,
      selectedSource: "file",
      database: {
        configured: isDatabaseConfigured(),
        healthy: databaseFailure ? false : null,
        missing: false,
        reason: databaseFailure ? describeError(databaseFailure) : null,
      },
      blob: {
        configured: isBlobConfigured(),
        healthy: blobFailure ? false : null,
        missing: false,
        reason: blobFailure ? describeError(blobFailure) : null,
      },
      file: {
        healthy: true,
        missing: false,
        path: DATA_FILE,
        reason: null,
      },
      warnings: blobFailure
        ? [
            `Blob storage ishlamadi, lokal faylga saqlandi: ${describeError(blobFailure)}`,
          ]
        : databaseFailure
          ? [
              `Database ishlamadi, lokal faylga saqlandi: ${describeError(databaseFailure)}`,
            ]
          : [],
    });
    return;
  }

  const reason = databaseFailure
    ? describeError(databaseFailure)
    : blobFailure
      ? describeError(blobFailure)
    : fileResult.error
      ? describeError(fileResult.error)
      : "unknown analytics storage failure";

  setLastStorageState({
    ...createStorageState(),
    degraded: true,
    selectedSource: fileResult.ok ? "file" : "memory",
    database: {
      configured: isDatabaseConfigured(),
      healthy: databaseFailure ? false : null,
      missing: false,
      reason: databaseFailure ? describeError(databaseFailure) : null,
    },
    blob: {
      configured: isBlobConfigured(),
      healthy: blobFailure ? false : null,
      missing: false,
      reason: blobFailure ? describeError(blobFailure) : null,
    },
    file: {
      healthy: shouldUseFile ? fileResult.ok : null,
      missing: false,
      path: DATA_FILE,
      reason: fileResult.error ? describeError(fileResult.error) : null,
    },
    warnings: [`Analytics saqlanmadi: ${reason}`],
  });

  throw createStorageWriteError("Analytics storage is unavailable", {
    mode,
    databaseConfigured: isDatabaseConfigured(),
    databaseReason: databaseFailure ? describeError(databaseFailure) : null,
    blobConfigured: isBlobConfigured(),
    blobReason: blobFailure ? describeError(blobFailure) : null,
    fileReason: fileResult.error ? describeError(fileResult.error) : null,
    fileFallbackUsed: fileResult.ok,
    vercelRuntime: IS_VERCEL_RUNTIME,
  });
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
      sourceBreakdown: mergeSourceBreakdown(store.daily[key]?.sourceBreakdown),
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
    storage: getAnalyticsStorageStatus(),
  };
}
