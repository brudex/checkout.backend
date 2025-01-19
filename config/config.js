const path = require("path");
const rootPath = path.normalize(__dirname + "/..");
const env = process.env.NODE_ENV || "development";

const config = {
    development: {
        root: rootPath,
        app: {
            name: "checkout.cachetechs",
        },
        port: process.env.PORT ,
        dbhost: process.env.DBHOST ,
        db: process.env.DBNAME ,
        dbuser: process.env.DBUSER ,
        dbpass: process.env.DBPASS,
        siteurl: "http://localhost:3000",
    },
    production: {
        root: rootPath,
        app: {
            name: "checkout.cachetechs",
        },
        port: process.env.PORT ,
        dbhost: process.env.DBHOST ,
        db: process.env.DBNAME ,
        dbuser: process.env.DBUSER ,
        dbpass: process.env.DBPASS,
        siteurl: "https://checkout.cachetechs.com"
    },
};




module.exports = config[env];
