module.exports = (sequelize, DataTypes) => {
    const PaymentProviderConfig = sequelize.define(
        "PaymentProviderConfig",
        {
            appId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            providerId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            settingName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            settingValue: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isDefault: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            tableName: "payment_provider_config",
            classMethods: {
                associate: (models) => {

                },
            },
        }
    );
    return PaymentProviderConfig;
};
