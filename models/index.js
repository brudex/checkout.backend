const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/config");
const db = {};


let sequelize = new Sequelize(config.db, config.dbuser, config.dbpass, {
  host: config.dbhost,
  dialect: "postgres",
});


sequelize.authenticate().then(() => {
    console.log("Connection has been established successfully.");
    loadModels(sequelize, Sequelize);
}).catch((err) => {
    console.error("Unable to connect to the database:", err);
    if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to SQLite in-memory database...');
        sequelize = new Sequelize('sqlite::memory:', {
            logging: true
        });
        console.log('SQLite connection established successfully.');
        loadModels(sequelize, Sequelize);
    }
});

function loadModels(sequelize, Sequelize) {
    fs.readdirSync(__dirname)
        .filter((file) => file.indexOf(".") !== 0 && file !== "index.js")
        .forEach((file) => {
            const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
            db[model.name] = model;
        });

    Object.keys(db).forEach((modelName) => {
        if ("associate" in db[modelName]) {
            db[modelName].associate(db);
        }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
    return db;
}

module.exports = db;







//
//
//
//
//
//
//
//
// const sequelize = new Sequelize(config.db, config.dbuser, config.dbpass, {
//   host: config.dbhost,
//   dialect: "postgres",
// });
//
// fs.readdirSync(__dirname)
//   .filter((file) => file.indexOf(".") !== 0 && file !== "index.js")
//   .forEach((file) => {
//     // const model = sequelize["import"](path.join(__dirname, file));
//       const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//
//       db[model.name] = model;
//   });
//
// Object.keys(db).forEach((modelName) => {
//   if ("associate" in db[modelName]) {
//     db[modelName].associate(db);
//   }
// });
//
// db.sequelize = sequelize;
// db.Sequelize = Sequelize;
//
// module.exports = db;
