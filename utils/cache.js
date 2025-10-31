const fs = require("fs");
const path = require("path");

const memoryCache = {
  data: {},
  lastFetch: null,
  lastError: null,
  isFromCache: false
};

const CACHE_FILE = path.join(__dirname, "../cache.json");

function getCachedData(key) {
  return memoryCache.data[key] || null;
}

function setCachedData(key, value, updateLastFetch = true) {
  memoryCache.data[key] = value;
  if (updateLastFetch) {
    memoryCache.lastFetch = new Date().toISOString();
    memoryCache.lastError = null;
  }
  memoryCache.isFromCache = false;
  persistCacheToFile();
}

function getLastFetchTime() {
  return memoryCache.lastFetch;
}

function hasCacheData() {
  return Object.keys(memoryCache.data).length > 0;
}

function setLastError(error) {
  memoryCache.lastError = error;
}

function getLastError() {
  return memoryCache.lastError;
}

function setDataFromCache(value) {
  memoryCache.isFromCache = value;
}

function isDataFromCache() {
  return memoryCache.isFromCache;
}

function isCacheUpToDate() {
  if (!memoryCache.lastFetch) {
    return false;
  }
  const lastFetchTime = new Date(memoryCache.lastFetch);
  const now = new Date();
  const hoursSinceLastFetch = (now - lastFetchTime) / (1000 * 60 * 60);
  return hoursSinceLastFetch < 24;
}

function persistCacheToFile() {
  try {
    const cacheToSave = {
      data: memoryCache.data,
      lastFetch: memoryCache.lastFetch,
      lastError: memoryCache.lastError
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheToSave, null, 2));
  } catch (error) {
    console.error("Error persisting cache to file:", error.message);
  }
}

function loadCacheFromFile() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      const cached = JSON.parse(data);
      memoryCache.data = cached.data || {};
      memoryCache.lastFetch = cached.lastFetch;
      memoryCache.lastError = cached.lastError;
      console.log("Cache loaded from file");
      return true;
    }
  } catch (error) {
    console.error("Error loading cache from file:", error.message);
  }
  return false;
}

module.exports = {
  getCachedData,
  setCachedData,
  getLastFetchTime,
  hasCacheData,
  setLastError,
  getLastError,
  loadCacheFromFile,
  persistCacheToFile,
  isCacheUpToDate,
  setDataFromCache,
  isDataFromCache
};