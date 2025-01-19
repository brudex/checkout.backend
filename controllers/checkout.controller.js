const db = require('../models');
const logger = require('../logger');
const Controller = {};
module.exports = Controller;

Controller.checkoutPage = async (req, res) => {
    console.log("Transaction ID >>>", req.params.trxId);
    logger.info("Transaction ID >>>", req.params.trxId);
    console.log("The request received CheckoutPay", req.body);
    const transaction = await db.PaymentTransaction.findOne({
        where: { transactionId: req.params.trxId },
        include: [{ model: db.UserApp }]
    });
    
    if(transaction == null){
        return res.redirect('/404');
    }
    
    if(transaction.paymentStatus === "PENDING"){
        // Parse transaction details with a fallback empty object
        const orderDetails = transaction.transactionDetails ? 
            JSON.parse(transaction.transactionDetails) : {};
            
        // Add crypto payment addresses
        const cryptoAddresses = {
            USDT: process.env.USDT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            BTC: process.env.BTC_ADDRESS || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            ETH: process.env.ETH_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        };
            
        return res.render('index', {
            transaction: transaction,
            orderDetails: orderDetails,
            trxnId: transaction.transactionId,
            paymentModes: transaction.UserApp?.paymentModes || ["card", "wallet", "crypto"],
            logoUrl: transaction.UserApp?.logoUrl || null,
            cryptoAddresses: cryptoAddresses
        });
    }
    return res.redirect(`/status/${transaction.transactionId}`);
};

Controller.transactionStatus = async (req, res) => {
    const transaction = await db.PaymentTransaction.findOne({where:{transactionId:req.params.trxId}});
    if(transaction == null){
        return res.redirect('/404');
    }
    return res.render('status',{transaction:transaction});
}

Controller.getOrderDetails = async (req, res) => {
    const transaction = await db.PaymentTransaction.findOne({where:{transactionId:req.params.trxId}});
    if(transaction == null){
        return res.status(404).json({status: "404", message : "Transaction Not Found", redirectUrl:"/404" });
    }
    if(transaction.paymentStatus !== "PENDING"){
        return res.status(302).json({status: "302", message : "Transaction Completed", redirectUrl:`/trxn-status/${transaction.transactionId}` });
    }
    const userApp = await db.UserApp.findOne({where:{appId:transaction.appId}});
    const details = JSON.parse(transaction.transactionDetails);
    const orderDetails = {
        status:"00",
        amount:transaction.amount,
        email:transaction.email,
        orderId:transaction.orderId,
        transactionId: transaction.transactionId,
        orderDescription:details.orderDescription,
        paymentStatus:transaction.paymentStatus,
    }
    if(userApp.logoUrl && userApp.logoUrl.trim()!==""){
        orderDetails.logoUrl = userApp.logoUrl;
    }
    return res.json(orderDetails);
}