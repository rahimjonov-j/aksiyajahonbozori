const PUBLIC_COOKIE_NAME = "ajb_vid_public";
const STORAGE_KEY = "ajb_vid_public";

function readCookie(name) {
  const prefix = `${name}=`;

  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();

    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length));
    }
  }

  return "";
}

function persistVisitorId(visitorId) {
  localStorage.setItem(STORAGE_KEY, visitorId);
  document.cookie = `${PUBLIC_COOKIE_NAME}=${encodeURIComponent(visitorId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function getOrCreateClientVisitorId() {
  const cookieValue = readCookie(PUBLIC_COOKIE_NAME);

  if (cookieValue) {
    localStorage.setItem(STORAGE_KEY, cookieValue);
    return cookieValue;
  }

  const storageValue = localStorage.getItem(STORAGE_KEY) ?? "";

  if (storageValue) {
    persistVisitorId(storageValue);
    return storageValue;
  }

  const created = crypto.randomUUID();
  persistVisitorId(created);
  return created;
}
