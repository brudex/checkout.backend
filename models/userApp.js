module.exports = (sequelize, DataTypes) => {
    const UserApp = sequelize.define(
        "UserApp",
        {
            uuid: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userUuid: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            appName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            logoUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            paymentModes: {
                type: DataTypes.JSONB,
                allowNull: false,
                defaultValue: ["card"], //card,wallet,crypto
            },
            appId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            apiKey: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            appSecret: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            alias: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            shouldSendClientCallback:{
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            tableName: "user_apps",
            classMethods: {
                associate: (models) => {
                    // Define associations here
                },
            },
        }
    );


    return UserApp;
};