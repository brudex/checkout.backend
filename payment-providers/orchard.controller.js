const providerId ='orchard';
const logger = require('../logger');
const crypto = require('crypto');
const configProvider = require("../config/payment.config.provider");
const callbackController = require('../controllers/callback.controller');
const db = require('../models');
const axios = require('axios');
const _async = require("async");
const dateFns = require("date-fns");
const Controller = {};


Controller.initiatePaymentIntent = async (transaction,callback)=>{
    const data =transaction;
    if(data.mobileNumber.indexOf("233")===0){
        data.mobileNumber= "+" + data.mobileNumber;
    }
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    let baseUrl =  config.orchardBaseUrl;
    let serviceId =  config.orchardServiceId;
    let clientId =  config.orchardClientId;
    let clientSecret =  config.orchardClientSecret;
    console.log("Orchard config values>>>",config)
    let networkTypes = {
        "MTN":"MTN",
        "TELECEL":"VOD",
        "AT":"AIR",
        "TIGO":"TIG",
        "VODAFONE":"VOD",
        "VODA":"VOD",
        "AIRTEL":"AIR",
        "AIRTELTIGO":"AIR",
    }
    let network = networkTypes[transaction.mobileNetwork.toUpperCase()];
    const date = new Date() // or your date string
    const timeStamp = dateFns.format(date, 'yyyy-MM-dd HH:mm:ss')

    let payload = {"amount": transaction.amount,
        "callback_url": "https://checkout.cachetechs.com/api/paymentCallback/orchard",
        "customer_number":  transaction.mobileNumber,
        "exttrid": transaction.pageId,
        "nw": network,
        "reference": transaction.orderDescription,
        "service_id": serviceId,
        "trans_type": "CTM",
        "ts": timeStamp
    }
    let auth = getAuthorization(payload,clientId,clientSecret);
    const requestConfig = {headers:{'Authorization':auth}};
    console.log("The orchard request Config>>",requestConfig);
    let requestUrl =baseUrl + "/sendRequest";
    console.log('The payment message payload', payload);
    console.log('The payment url', requestUrl);
    setTimeout(function () {
        axios.post(requestUrl,payload,requestConfig)
            .then(function (response) {
            transaction.paymentStatus = "PENDING";
            transaction.responseText = JSON.stringify(response.data);
            console.log("Initial Payment response from orchard",response.data);
            if(response.data){
                if(response.data.resp_code==="015"){
                    transaction.statusMessage=response.data.resp_desc;
                    transaction.paymentStatus="PENDING";
                    transaction.paymentReference= "" ;
                    transaction.providerReference= "";
                }else{
                    transaction.statusMessage=response.data.resp_desc;
                    transaction.paymentStatus="FAILED";
                    transaction.paymentReference= "" ;
                    transaction.providerReference= "" ;
                }
            }else{
                transaction.paymentStatus="FAILED";
            }
            transaction.save();
        }).catch(function(err){
            console.log('There was and error',err);
            transaction.paymentStatus="FAILED";
            transaction.paymentReference= "" ;
            if(err.data){
                transaction.statusMessage= err.data.resp_desc;
                transaction.responseText=JSON.stringify(err.data);
            }
            transaction.save();
        });
    },5000);
    return callback({status:"00"})
};

Controller.renderPaymentPage = async function(transaction,res){

};


Controller.handlePaymentCallback = function(req,res){
    const response =req.body;
    db.PaymentTransaction.findOne({where:{pageId:req.body.trans_ref}})
        .then(function (transaction) {
            if(transaction){
                if(req.body.trans_status==="000"){
                    transaction.paymentStatus="COMPLETED";
                    transaction.paymentReference= req.body.trans_id;
                    transaction.providerReference=  req.body.trans_id;
                    if(req.body.message){
                        transaction.statusMessage=req.body.message;
                    }
                }else if(req.body.status_code==="001"){
                    transaction.paymentStatus="FAILED";
                    transaction.paymentReference= req.body.trans_id;
                    transaction.providerReference=  req.body.trans_id;
                    if(req.body.message){
                        transaction.statusMessage=req.body.message;
                    }
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
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    console.log("Config Data for check Orchard transaction Status >>",config);
    logger.info("Config Data for check Orchard transaction Status >>",config);
    let baseUrl =  config.orchardBaseUrl;
    let serviceId =  config.orchardServiceId;
    let clientId =  config.orchardClientId;
    let clientSecret =  config.orchardClientSecret;
    _async.waterfall([function (done) {
        configProvider.getConfigByAppId(transaction.appId,providerId).then(function (config) {
            done(null,config)
        });
    },function (config, done) {
        const payload = {"exttrid":transaction.pageId,"trans_type": "TSC", "service_id": serviceId};
        let auth = getAuthorization(payload,clientId,clientSecret);
        const requestConfig = {headers:{'Authorization':auth}};
        const requestUrl = `${baseUrl}/checkTransaction`;
        axios.post(requestUrl,payload,requestConfig).then(function (response) {
            console.log("Orchard Check Transaction status response >>>",response.data);
            logger.info("Orchard Check Transaction status response >>>",response.data)
            transaction.callbackRetries += 1;
            if(transaction.callbackRetries >= 15){
                transaction.paymentStatus="FAILED";
            }
            if(response.data && (response.data.trans_status==="000" || response.data.trans_status==="000/01" || response.data.trans_status.indexOf("SUCCESS") > -1 )){
                transaction.paymentStatus="COMPLETED";
                transaction.paymentReference= response.data.trans_id;
                transaction.providerReference= response.data.trans_ref;
                if(response.data.message){
                    transaction.statusMessage=response.data.message;
                }
            }else if(response.data && response.data.trans_status.indexOf("FAILED") > -1){
                transaction.paymentStatus="FAILED";
                if(response.data.message){
                    transaction.statusMessage=response.data.message;
                }
            }else{
                transaction.paymentStatus="FAILED";
                if(response.data.message){
                    transaction.statusMessage=response.data.message;
                }
            }
            transaction.callbackResponseText=JSON.stringify(response.data);
            transaction.save().then(function (trxn) {
                callbackController.transactionCallback(trxn);
                if(callback){
                    return callback();
                }
            });
            return done();
        }).catch(e =>{
            console.log('There was an error checkTransactionStatus for Orchard>>',e);
            transaction.callbackRetries += 1;
            if(transaction.callbackRetries >= 15){
                transaction.paymentStatus="FAILED";
            }
            transaction.callbackResponseText = JSON.stringify(e);
            transaction.statusMessage= ""+e;
            transaction.save().then(function (trxn) {
                console.log('The transaction response >>', );
                callbackController.transactionCallback(trxn);
                if(callback){
                    return callback();
                }
            });
        });
    }])

};


function getAuthorization(payload,clientId,clientSecret){
    let json = JSON.stringify(payload);
    let signature=hmac(json,clientSecret);
    return `${clientId}:${signature}`
}

function hmac(json,clientSecret){
    return crypto
        .createHmac('sha256', clientSecret)
        .update(json)
        .digest('hex');
}

module.exports = {
    provider : providerId,
    actions : Controller
};