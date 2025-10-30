const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("Token loaded:", !!process.env.API_TOKEN);

const express = require("express");
const routes = require("./routes");
const { 
  fetchOrgReposWithLanguages, 
  fetchOwner, 
  fetchOwnerReposWithLanguages, 
  fetchOrgProfileReadme 
} = require("./utils/githubApi");
const { loadCacheFromFile, setLastError } = require("./utils/cache");

const app = express();
const PORT = process.env.PORT || 3000;

async function initializeCache() {
  console.log("Initializing cache...");
  
  loadCacheFromFile();
  
  if (process.env.API_TOKEN) {
    console.log("Attempting initial cache refresh from GitHub...");
    try {
      const [orgRepos, owner, ownerRepos, orgReadme] = await Promise.all([
        fetchOrgReposWithLanguages("30osob-studio"),
        fetchOwner("30osob-studio"),
        fetchOwnerReposWithLanguages("30osob-studio"),
        fetchOrgProfileReadme("30osob-studio")
      ]);
      
      const { setCachedData } = require("./utils/cache");
      setCachedData("orgRepos", orgRepos);
      setCachedData("owner", owner);
      setCachedData("ownerRepos", ownerRepos);
      
      const { fetchOrganization, getReposWithTopicsCount } = require("./utils/githubApi");
      const orgData = await fetchOrganization("30osob-studio");
      const reposCount = await getReposWithTopicsCount("30osob-studio");
      const orgWithReadme = {
        ...orgData,
        public_repos: reposCount,
        readme: orgReadme
      };
      setCachedData("organization", orgWithReadme);
      
      console.log("Initial cache refresh completed successfully");
    } catch (error) {
      console.error("Could not refresh cache from GitHub:", error.message);
      setLastError(error.message);
      console.log("Using cached data from file as fallback");
    }
  } else {
    console.log("No GitHub token available - will use cached data only");
  }
}

app.use("/", routes);

const server = app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeCache();
});