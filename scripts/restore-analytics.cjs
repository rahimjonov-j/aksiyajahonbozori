const fs = require("fs");
const path = require("path");
const { get, put } = require("@vercel/blob");
const { Pool } = require("pg");

const BLOB_PATH = "analytics/store.json";
const DATA_FILE = path.join(process.cwd(), "data", "analytics.json");
const DATABASE_TABLE = "analytics_store";
const envFiles = [
  ".env.local",
  ".env.production.local",
  ".env.production.remote",
  ".env.development.remote",
];

function loadEnvFiles() {
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([^=]+)=(.*)$/);

      if (!match) {
        continue;
      }

      const key = match[1].trim();

      if (process.env[key]) {
        continue;
      }

      let value = match[2].trim();

      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function summarizeStore(store) {
  const summary = store.summary ?? {};

  return {
    totalVisits: summary.totalVisits ?? 0,
    uniqueVisitors: summary.uniqueVisitors ?? 0,
    totalTelegramClicks: summary.totalTelegramClicks ?? 0,
    totalTelegramOpenSignals: summary.totalTelegramOpenSignals ?? 0,
    totalTelegramConfirmedStarts: summary.totalTelegramConfirmedStarts ?? 0,
    visitorCount: Object.keys(store.visitors ?? {}).length,
    dayCount: Object.keys(store.daily ?? {}).length,
    recentEvents: (store.recentEvents ?? []).length,
  };
}

function compareSummaries(left, right) {
  const keys = [
    "totalVisits",
    "uniqueVisitors",
    "totalTelegramClicks",
    "totalTelegramOpenSignals",
    "totalTelegramConfirmedStarts",
    "visitorCount",
    "dayCount",
    "recentEvents",
  ];

  for (const key of keys) {
    if ((left[key] ?? 0) !== (right[key] ?? 0)) {
      return (left[key] ?? 0) - (right[key] ?? 0);
    }
  }

  return 0;
}

async function readRemoteStore() {
  const result = await get(BLOB_PATH, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    useCache: false,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

function getDatabaseConnectionString() {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();
}

async function writeDatabaseStore(store) {
  const connectionString = getDatabaseConnectionString();

  if (!connectionString) {
    return false;
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${DATABASE_TABLE} (
        store_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(
      `
        INSERT INTO ${DATABASE_TABLE} (store_key, payload, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (store_key)
        DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      `,
      ["main", JSON.stringify(store)],
    );
    return true;
  } finally {
    await pool.end();
  }
}

async function main() {
  loadEnvFiles();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN topilmadi.");
  }

  const sourcePath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DATA_FILE;

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Local analytics file topilmadi: ${sourcePath}`);
  }

  const localStore = readJson(sourcePath);
  const localSummary = summarizeStore(localStore);

  console.log("Local analytics summary:");
  console.log(JSON.stringify(localSummary, null, 2));

  let remoteStore = null;

  try {
    remoteStore = await readRemoteStore();
  } catch (error) {
    console.log("Remote analytics read failed:");
    console.log(error.message || String(error));
  }

  if (remoteStore) {
    const remoteSummary = summarizeStore(remoteStore);

    console.log("Remote analytics summary:");
    console.log(JSON.stringify(remoteSummary, null, 2));

    if (compareSummaries(remoteSummary, localSummary) > 0) {
      throw new Error(
        "Remote Blob analytics lokaldan boyroq ko'rinadi. Tasodifiy ustiga yozishni to'xtatdim.",
      );
    }
  }

  if (await writeDatabaseStore(localStore)) {
    console.log("Analytics store database'ga ham muvaffaqiyatli yozildi.");
  } else {
    console.log("Database connection string topilmadi, database restore skip qilindi.");
  }

  await put(BLOB_PATH, JSON.stringify(localStore, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  console.log("Analytics store Blob'ga muvaffaqiyatli qayta yozildi.");
}

main().catch((error) => {
  console.error("Analytics restore failed.");
  console.error(error && error.stack ? error.stack : String(error));
  process.exit(1);
});
