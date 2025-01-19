const providerId ='interpay';
const configProvider = require("../config/payment.config.provider");
const callbackController = require('../controllers/callback.controller');
const db = require('../models');
const axios = require('axios');
const async = require("async");
const Controller = {};


Controller.initiatePaymentIntent = async (transaction,callback)=>{
    const data =transaction;
    if(data.mobile.indexOf("233")===0){
        data.mobile= "+" + data.mobile;
    }
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    const payload = {
        "app_id": config.interPayAppId,
        "app_key": config.interPayAppKey,
        "name": config.interPayUserName ||  "CACHETECH",
        "mobile_network": transaction.mobileNetwork,
        "email":  transaction.email,
        "mobile":   transaction.mobile,
        "currency":"GHS",
        "feetypecode":"GENERALPAYMENT",
        "amount": transaction.amount,
        "order_id":transaction.transactionId,
        "order_desc": transaction.orderDescription
    };
    const requestConfig = {headers:{}};
    requestConfig.url = config.interPayBaseUrl + "/v3/Interapi.svc/CreateMMPayment";
    console.log('The payment message payload', payload);
    console.log('The payment url', requestConfig.url);
    setTimeout(function () {
        axios.post(requestConfig.url,payload)
            .then(function (response) {
            transaction.paymentStatus = "PENDING";
            transaction.responseText = JSON.stringify(response.data);
            if(response.data){
                if(response.data.status_code===1){
                    transaction.statusMessage=response.data.status_message;
                    transaction.paymentStatus="PENDING";
                    transaction.paymentReference= ""+response.data.transaction_no;
                    transaction.providerReference= ""+response.data.transaction_no;
                }else{
                    transaction.statusMessage=response.data.status_message;
                    transaction.paymentStatus="FAILED";
                    transaction.paymentReference= ""+response.data.transaction_no;
                    transaction.providerReference= ""+response.data.transaction_no;
                }
            }else{
                transaction.paymentStatus="FAILED";
            }
            transaction.save();
        })
    },5000);
    return callback({status:"00"})
};

Controller.renderPaymentPage = async function(transaction,res){
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    const payload ={};
    const orderDetails = transaction.getOrderDetails();
    payload["app_id"] = config.interPayAppId ;
    payload["app_key"] =  config.interPayAppKey ;
    //------------Optional-----------------
    payload["name"] = orderDetails.fullName;
    payload["email"] = orderDetails.email  || "info@shortcodeafrica.com";
    payload["mobile"] = orderDetails.mobile ;
    payload["return_url"] = "";
    //------------Optional-----------------
    payload["currency"] = "GHS";
    payload["amount"] = transaction.amount;
    payload["order_id"] = transaction.pageId;
    payload["order_desc"] = (orderDetails.orderDescription || "Bezo Money :")+transaction.orderId;
    let paymentUrl = config.interPayBaseUrl + "/interapi/ProcessPayment";
    axios.post(paymentUrl, payload)
        .then(function (response) {
            console.log(response.data);
            console.log(typeof  response.data);
            console.log( "Response data status code >>"+ response.data.status_code );
            if(response.data && response.data.status_code === 1){
                transaction.responseText= JSON.stringify(response.data);
                transaction.providerReference= response.data.trans_ref_no;
                transaction.save();
                console.log("Returning >>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                return res.json({ status: "00", paymentUrl : response.data.redirect_url,reference:transaction.pageId });
            }else if(response && response.data){
                transaction.responseText= JSON.stringify(response.data);
                transaction.save();
                console.log("Just Saving >>>>g >>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
            }
            return res.json({ status: "03", paymentUrl : "/paymentPage/"+transaction.pageId,reference:transaction.pageId });
         })
        .catch(function (error) {
            console.log("There was an error >>",error);
            //return res.render("payment-not-found",{layout:"payment-layout",title:"Payment Error"});
            return res.json({ status: "04", paymentUrl : "/paymentPage/"+transaction.pageId,reference:transaction.pageId });
        });
};


Controller.handlePaymentCallback = function(req,res){
    const response =req.body;
    db.PaymentTransaction.findOne({where:{pageId:req.body.order_id}})
        .then(function (transaction) {
            if(transaction){
                if(req.body.status_code===1){
                    transaction.paymentStatus="COMPLETED";
                }else if(req.body.status_code===0){
                    transaction.paymentStatus="FAILED";
                }
                transaction.callbackResponseText=JSON.stringify(response);
                transaction.save().then(function (trxn) {
                    callbackController.transactionCallback(trxn);
                });
            }
            res.json({message:"Received"})
        });
};


Controller.checkTransactionStatus = async (transaction,callback)=>{
    console.log('Checking transaction status');
    async.waterfall([function (done) {
        configProvider.getConfigByAppId(transaction.appId,providerId).then(function (config) {
            done(null,config)
        });
    },function (config, done) {
        const payload = {
            "app_id": config.interPayAppId,
            "app_key": config.interPayAppKey,
            "order_id": transaction.transactionId,
        };
        const requestConfig = {headers:{}};
        requestConfig.url = `${config.interPayBaseUrl}/v3/Interapi.svc/GetInvoiceStatus`;
        axios.post( requestConfig.url,payload).then(function (response) {
            transaction.callbackRetries += 1;
            if(transaction.callbackRetries >= 15){
                transaction.paymentStatus="FAILED";
            }
            if(response.data && response.data.status_code===1){
                transaction.paymentStatus="COMPLETED";
            }else if(response.data && response.data.status_code===0){
                transaction.paymentStatus="FAILED";
            }
            transaction.callbackResponseText=JSON.stringify(response.data);
            transaction.save().then(function (trxn) {
                callbackController.transactionCallback(trxn);
                if(callback){
                    return callback();
                }
            });
            return done();
        });
    }])

};

module.exports = {
    provider : providerId,
    actions : Controller
};