const express = require("express");
const router = express.Router();
const { fetchOrganization, fetchOrgProfileReadme, getReposWithTopicsCount, convertEmptyToNull } = require("../utils/githubApi");
const { getCachedData, setDataFromCache } = require("../utils/cache");

router.get("/", async (req, res) => {
    setDataFromCache(false);
    try {
        const orgData = await fetchOrganization("30osob-studio");
        const profileReadme = await fetchOrgProfileReadme("30osob-studio");
        const reposWithTopicsCount = await getReposWithTopicsCount("30osob-studio");

        const orgWithReadme = {
            ...orgData,
            public_repos: reposWithTopicsCount,
            readme: profileReadme
        };

        const { fields } = req.query;

        if (fields) {
            const fieldList = fields.split(',').map(field => field.trim());
            const filteredOrg = {};

            fieldList.forEach(field => {
                if (orgWithReadme.hasOwnProperty(field)) {
                    filteredOrg[field] = orgWithReadme[field];
                }
            });

            return res.json(convertEmptyToNull(filteredOrg));
        }

        res.json(convertEmptyToNull(orgWithReadme));
    } catch (error) {
        console.error("Error in /about endpoint:", error.message);
        
        if (error.message.includes("401")) {
            return res.status(401).json({ 
                error: "Unauthorized - API token is invalid or expired",
                details: error.message
            });
        }
        
        const cachedOrg = getCachedData("organization");
        if (cachedOrg && typeof cachedOrg === 'object') {
            console.log("Using cached organization data as fallback");
            setDataFromCache(true);
            return res.json(convertEmptyToNull(cachedOrg));
        }
        
        res.status(500).json({ 
            error: "Failed to fetch organization data",
            details: error.message
        });
    }
});

module.exports = router;
