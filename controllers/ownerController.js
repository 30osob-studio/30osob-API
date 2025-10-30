const { fetchOwner, fetchOwnerReposWithLanguages, fetchOwnerReadme, getOwnerReposWithTopicsCount, mapUserData, mapRepoData, mapLanguagesData, convertEmptyToNull } = require("../utils/githubApi");
const { getCachedData, setDataFromCache } = require("../utils/cache");

const getOwner = async (req, res) => {
  setDataFromCache(false);
  try {
    const owner = await fetchOwner("30osob-studio");
    const readme = await fetchOwnerReadme("30osob-studio");
    const reposWithTopicsCount = await getOwnerReposWithTopicsCount("30osob-studio");

    const ownerWithReadme = {
      ...owner,
      public_repos: reposWithTopicsCount,
      readme: readme
    };

    const { fields } = req.query;

    if (fields) {
      const fieldList = fields.split(',').map(field => field.trim());
      const filteredOwner = {};

      fieldList.forEach(field => {
        if (ownerWithReadme.hasOwnProperty(field)) {
          filteredOwner[field] = ownerWithReadme[field];
        }
      });

      return res.json(convertEmptyToNull(filteredOwner));
    }

    res.json(convertEmptyToNull(ownerWithReadme));
  } catch (error) {
    console.error("Error in /owner endpoint:", error.message);
    
    if (error.message.includes("401")) {
      return res.status(401).json({ 
        error: "Unauthorized - API token is invalid or expired",
        details: error.message
      });
    }
    
    const cachedOwner = getCachedData("owner");
    if (cachedOwner && typeof cachedOwner === 'object') {
      console.log("Using cached owner data as fallback");
      setDataFromCache(true);
      return res.json(convertEmptyToNull(cachedOwner));
    }
    
    res.status(500).json({ 
      error: "Failed to fetch owner data",
      details: error.message
    });
  }
};

const getOwnerRepos = async (req, res) => {
  setDataFromCache(false);
  try {
    const repos = await fetchOwnerReposWithLanguages("30osob-studio");

    const { fields, repoFields, languageFields } = req.query;

    let filteredRepos = repos.filter(repo =>
      repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0
    );

    if (repoFields) {
      const repoFieldList = repoFields.split(',').map(field => field.trim());
      filteredRepos = repos.map(repo => {
        const filteredRepo = {};
        repoFieldList.forEach(field => {
          if (field !== 'languages' && field !== 'readme' && field !== 'repo_image' && repo.hasOwnProperty(field)) {
            filteredRepo[field] = repo[field];
          }
        });

        if (repoFieldList.includes('languages')) {
          if (languageFields) {
            const languageFieldList = languageFields.split(',').map(field => field.trim());
            const filteredLanguages = {};
            languageFieldList.forEach(field => {
              if (repo.languages && repo.languages.hasOwnProperty(field)) {
                filteredLanguages[field] = repo.languages[field];
              }
            });
            filteredRepo.languages = filteredLanguages;
          } else {
            filteredRepo.languages = repo.languages;
          }
        }

        if (repoFieldList.includes('readme')) {
          filteredRepo.readme = repo.readme;
        }

        if (repoFieldList.includes('repo_image')) {
          filteredRepo.repo_image = repo.repo_image;
        }

        return filteredRepo;
      });
    }

    if (fields && !repoFields) {
      const fieldList = fields.split(',').map(field => field.trim());
      filteredRepos = repos.map(repo => {
        const filteredRepo = {};
        fieldList.forEach(field => {
          if (repo.hasOwnProperty(field)) {
            filteredRepo[field] = repo[field];
          }
        });
        return filteredRepo;
      });
    }

    res.json(convertEmptyToNull(filteredRepos));
  } catch (error) {
    console.error("Error in /owner/repos endpoint:", error.message);
    
    if (error.message.includes("401")) {
      return res.status(401).json({ 
        error: "Unauthorized - API token is invalid or expired",
        details: error.message
      });
    }
    
    const cachedOwnerRepos = getCachedData("ownerRepos");
    if (cachedOwnerRepos && Array.isArray(cachedOwnerRepos)) {
      console.log("Using cached owner repos as fallback");
      setDataFromCache(true);
      return res.json(convertEmptyToNull(cachedOwnerRepos));
    }
    
    res.status(500).json({ 
      error: "Failed to fetch owner repositories",
      details: error.message
    });
  }
};

module.exports = { getOwner, getOwnerRepos };
