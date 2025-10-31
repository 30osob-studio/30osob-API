const express = require("express");
const router = express.Router();
const reposRouter = require("./repos");
const ownerRouter = require("./owner");
const aboutRouter = require("./about");
const { getLastFetchTime, hasCacheData, getLastError, isDataFromCache } = require("../utils/cache");

router.get("/", (req, res) => res.send("Hello World"));

router.get("/status", (req, res) => {
  const tokenLoaded = !!process.env.API_TOKEN;
  const lastFetch = getLastFetchTime();

  let formattedTime = null;
  if (lastFetch) {
    const date = new Date(lastFetch);
    formattedTime = date.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
  }
  
  res.json({
    token: tokenLoaded ? "loaded" : "not_loaded",
    working: hasCacheData() ? "yes" : "no",
    up_to_date: tokenLoaded && !isDataFromCache() ? "yes" : "no",
    last_fetch: formattedTime,
    last_error: getLastError() || null
  });
});

router.use("/repos", reposRouter);
router.use("/owner", ownerRouter);
router.use("/about", aboutRouter);

module.exports = router;
