

module.exports = (sequelize, DataTypes) => {
  const PaymentTransaction = sequelize.define(
    "PaymentTransaction",
    {
      appId: DataTypes.STRING,
      userUuid: DataTypes.STRING,
      email: DataTypes.STRING,
      pageId: DataTypes.STRING,
      amount: DataTypes.DECIMAL,
      currency: DataTypes.STRING, //USD,GHS
      paymentProvider: DataTypes.STRING, // stripe,orchard,
      paymentMode: DataTypes.STRING,  //card, wallet, crypto
      mobileNumber: DataTypes.STRING,
      mobileNetwork :  DataTypes.STRING, //mtn, vodafone
      orderId: DataTypes.STRING, // Order ID
      transactionId: DataTypes.STRING, // Transaction ID
      providerReference: DataTypes.STRING, // reference sent from payment provider
      paymentStatus: DataTypes.STRING, //PENDING, COMPLETED, FAILED, CANCELLED
      orderDescription: DataTypes.STRING,
      statusMessage: DataTypes.STRING,
      transactionDetails: DataTypes.TEXT,
      providerCallReceived: DataTypes.BOOLEAN, //true if we have received callback from provider
      providerResponse: DataTypes.TEXT, //response from provider
      appCallBackUrl: DataTypes.STRING,
      appCallBackResponse: DataTypes.TEXT, //callback response sent to app
      appCallBackSent: DataTypes.BOOLEAN, //true if callback has been sent to app
      settlementStatus: DataTypes.STRING, //PENDING, COMPLETED
      paymentReference: DataTypes.STRING, //Provider's reference
      responseText: DataTypes.TEXT,
      callbackRetries: DataTypes.INTEGER,  //no of times we call vendor to check transaction status
      callbackResponseText: DataTypes.TEXT
    },
    {
      tableName: "payment_transaction",
      classMethods: {},
    }
  );

  PaymentTransaction.prototype.getOrderDetails = function(){
    let details={};
    if(this.transactionDetails!=null || this.transactionDetails!==''){
        try{
            details = JSON.parse(this.transactionDetails);
        }catch(e){
            console.log("Error parser order details",e);
        }
    }
    return details;
  };

  return PaymentTransaction;
};
