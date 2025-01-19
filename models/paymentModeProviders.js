module.exports = (sequelize, DataTypes) => {
    const PaymentModeProviders = sequelize.define(
        "PaymentModeProviders",
        {
            paymentMode: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            providerId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isDefault: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            tableName: "payment_mode_providers",
            classMethods: {
                associate: (models) => {

                },
            },
        }
    );
    return PaymentModeProviders;
};
