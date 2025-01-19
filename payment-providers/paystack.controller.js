const providerId ='paystack';
const crypto = require('crypto');
const configProvider = require("../config/payment.config.provider");
const callbackController = require('../controllers/callback.controller');
const db = require('../models');
const axios = require('axios');
const async = require("async");
const Controller = {};


Controller.initiatePaymentIntent = async (transaction,callback)=>{
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    const payload ={};
    const orderDetails = transaction.getOrderDetails();
    //------------Optional-----------------
    payload["name"] = orderDetails.payeeName || "ShortCodefrica";
    payload["email"] = orderDetails.email  || "info@cachetechs.com";
    payload["mobile"] = orderDetails.mobile ;
    payload["callback_url"] = "https://payments.shortcodeafrica.com/paymentResult/paystack";
    payload["currency"] = transaction.currency;
    payload["channels"] = ['card', 'ussd', 'qr', 'mobile_money'];
    payload["amount"] = Number(transaction.amount) *100;
    payload["reference"] = transaction.pageId;
    payload["metadata"] = JSON.stringify(orderDetails);
    let paymentUrl = config.payStackBaseUrl + "/transaction/initialize";
    let headerConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.payStackAppSecret}`,
        }
    };
    axios.post(paymentUrl, payload,headerConfig)
        .then(function (response) {
            console.log(response.data);
            console.log(typeof  response.data);
            console.log( "Response data status code >>"+ response.data.status);
           let result  ={};
            transaction.paymentStatus="PENDING";
            transaction.responseText= JSON.stringify(response.data);
            if(response.data && response.data.status === true){
                transaction.paymentStatus="PENDING";
                transaction.paymentReference = response.data.data.access_code;
                transaction.providerReference = response.data.data.access_code;
                transaction.save();
                result = { status: "01", redirectUrl : response.data.data.authorization_url,reference:transaction.pageId };
            }else if(response && response.data.status===false){
                transaction.paymentStatus="FAILED";
                transaction.save();
                result = {status: "03", reference:transaction.pageId};
             }
            console.log('Transaction Response >>',response.data);
            return callback(result);
        })
        .catch(function (error) {
            console.log("There was an error initiatePaymentIntent>>",error);
            return callback({ status: "04", message : error});
        });
};



Controller.handlePaymentCallback = async function(req,res){
    console.log('Callback req body',req.body);
    let reference = req.body.data.reference;
    async.waterfall([function (done) {
        db.PaymentTransaction.findOne({where:{pageId:reference}})
            .then(function (transaction) {
               done(null,transaction)
            })
    },function (transaction,done){
        configProvider.getConfigByAppId(transaction.appId,providerId).then(function (config) {
            done(null,transaction,config)
        })
    },function (transaction,config,done) {
        const hash = crypto.createHmac('sha512',config.payStackAppSecret).update(JSON.stringify(req.body)).digest('hex');
        if (hash === req.headers['x-paystack-signature']) {
            const data = req.body;  // Retrieve the request's body
            if(transaction){
                if(data.data.status==='success'){
                    console.log('Marking transaction as success>>');
                    transaction.paymentStatus="COMPLETED";
                }else if(data.data.status==='failed'){
                    console.log('Marking transaction as failed>>');
                    transaction.paymentStatus="FAILED";
                }
                transaction.statusMessage =data.data.gateway_response;
                transaction.responseText=JSON.stringify(data);
                transaction.save();
                callbackController.transactionCallback(transaction);
            }
        }
        res.json({status:"00",message:"Received"});
    }]);
};


Controller.paymentResult = async (req, res) => {
    const pageId = req.query['reference'];
    db.PaymentTransaction.findOne({where:{pageId:pageId}})
        .then(function (transaction) {
            if(transaction){
                transaction.paymentStatus="COMPLETED";
                transaction.statusMessage ="Success";
                transaction.responseText=JSON.stringify(req.query);
                transaction.save();
                let orderDetails = transaction.getOrderDetails();
                let returnUrl = orderDetails.returnUrl || "https://shortcodeafrica.com/account-billing";
                callbackController.transactionCallback(transaction);
                return res.status(301).redirect(returnUrl)
            }
            return res.send({message:"Payment Success",status:"success"});
        });
};


Controller.checkTransactionStatus = async (transaction,callback)=>{
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    let headerConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.payStackAppSecret}`,
        }
    };
    console.log('The header config >>>',headerConfig);
    const requestConfig = {headers:{}};
    requestConfig.url = `${config.payStackBaseUrl}/transaction/verify/${transaction.pageId}`;
    axios.get(requestConfig.url,headerConfig).then(function (response) {
        console.log('Paystack response >>>', response.data);
        transaction.callbackRetries += 1;
        if(transaction.callbackRetries >= 15){
            transaction.paymentStatus="FAILED";
        }
        if(response.data && response.data.status_code===1){
            transaction.paymentStatus="COMPLETED";
        }else if(response.data && response.data.status_code===0){
            transaction.paymentStatus="FAILED";
        }else if(response.data && response.data.data.status==='abandoned'){
            transaction.paymentStatus="FAILED";
        }
        transaction.callbackResponseText = JSON.stringify(response.data);
        transaction.statusMessage= response.data.data?.gateway_response;
        transaction.save().then(function (trxn) {
            console.log('The transaction response >>', response.data);
            callbackController.transactionCallback(trxn);
            if(callback){
                return callback();
            }
        });
    }).catch(e =>{
        console.log('There was an error checkTransactionStatus for Paystack>>',e);
        transaction.callbackRetries += 1;
        if(transaction.callbackRetries >= 15){
            transaction.paymentStatus="FAILED";
        }
        transaction.callbackResponseText = JSON.stringify(e);
        transaction.statusMessage= ""+e;
        transaction.save().then(function (trxn) {
            console.log('The transaction response >>', e);
            callbackController.transactionCallback(trxn);
            if(callback){
                return callback();
            }
        });
    });
};



module.exports = {
    provider : providerId,
    actions : Controller
};

