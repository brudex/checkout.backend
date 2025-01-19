const logger = require("../logger");
const db = require("../models");

module.exports = async function (req, res, next) {
   const authHeader = req.header("Authorization");
   logger.info("Auth header", authHeader);
   console.log("Auth header >>>", authHeader);
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    logger.error("Missing or invalid Authorization header");
    console.log("Missing or invalid Authorization header");
    return res.status(401).json({
      status: "401",
      message: "Missing or invalid Authorization header",
    });
  }


  // Decode the Basic Auth credentials
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8").split(":");
  const [appId, appSecret] = credentials;
   console.log("Credentials appId  >>>", appId);
   console.log("Credentials appSecret >>>", appSecret);
  if (!appId || !appSecret) {
    logger.error("Invalid credentials in Authorization header");
    console.log("Invalid credentials in Authorization header");
    return res.status(401).json({
      status: "401",
      message: "Invalid credentials in Authorization header",
    });
  }

  // Check for the x-api-key header
  const apiKey = req.header("x-api-key");
  console.log("apiKey >>>", apiKey);
  if (!apiKey) {
    logger.error("Missing x-api-key header");
    console.log("Missing x-api-key header");
    return res.status(401).json({
      status: "401",
      message: "Missing x-api-key header",
    });
  }

  try {
    // Verify the credentials against the database
    const userApp = await db.UserApp.findOne({
      where: {
        appId,
        appSecret,
        apiKey
      },
    });
    if (!userApp) {
      return res.status(401).json({
        status: "401",
        message: "Invalid credentials or API key",
      });
    }
    if(userApp.isActive !== true){
      console.log("Application not action",userApp);
      return res.status(401).json({
        status: "401",
        message: "Application not active"
      });
    }

    // Attach userApp to the request for downstream use
    req.userApp = userApp;
    next();
  } catch (error) {
    console.error("Error authenticating userApp:", error);
    res.status(500).json({
      status: "500",
      message: "Internal server error",
    });
  }
};