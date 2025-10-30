const { fetchOrgReposWithLanguages, mapRepoData, mapLanguagesData, convertEmptyToNull } = require("../utils/githubApi");
const { getCachedData, setDataFromCache } = require("../utils/cache");

const getOrgRepos = async (req, res) => {
  setDataFromCache(false);
  try {
    const reposWithLanguages = await fetchOrgReposWithLanguages("30osob-studio");

    const { fields, repoFields, languageFields } = req.query;

    let filteredRepos = reposWithLanguages.filter(repo =>
      repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0
    );

    if (repoFields) {
      const repoFieldList = repoFields.split(',').map(field => field.trim());
      filteredRepos = reposWithLanguages.map(repo => {
        const filteredRepo = {};
        repoFieldList.forEach(field => {
          if (field !== 'languages' && field !== 'readme' && field !== 'contributors' && field !== 'repo_image' && repo.hasOwnProperty(field)) {
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

        if (repoFieldList.includes('contributors')) {
          filteredRepo.contributors = repo.contributors;
        }

        if (repoFieldList.includes('repo_image')) {
          filteredRepo.repo_image = repo.repo_image;
        }

        return filteredRepo;
      });
    }

    if (fields && !repoFields) {
      const fieldList = fields.split(',').map(field => field.trim());
      filteredRepos = reposWithLanguages.map(repo => {
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
    console.error("Error in /repos endpoint:", error.message);
    
    if (error.message.includes("401")) {
      return res.status(401).json({ 
        error: "Unauthorized - API token is invalid or expired",
        details: error.message
      });
    }
    
    const cachedRepos = getCachedData("orgRepos");
    if (cachedRepos && Array.isArray(cachedRepos)) {
      console.log("Using cached org repos as fallback");
      setDataFromCache(true);
      return res.json(convertEmptyToNull(cachedRepos));
    }
    
    res.status(500).json({ 
      error: "Failed to fetch organization repositories",
      details: error.message
    });
  }
};

module.exports = { getOrgRepos };
