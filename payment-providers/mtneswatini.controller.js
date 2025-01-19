const providerId ='mtneswatini';
const logger = require('../logger');
const crypto = require('crypto');
const configProvider = require("../config/payment.config.provider");
const callbackController = require('../controllers/callback.controller');
const db = require('../models');
const axios = require('axios');
const _async = require("async");
const dateFns = require("date-fns");
const Controller = {};

function base64EncodeBasicAuth(username,password){
    const str =`${username}:${password}`;
    return Buffer.from(str).toString('base64')
}


async function  getAccessToken(url,primaryKey,basicAuth){
    const headers = {
        "Ocp-Apim-Subscription-Key": primaryKey,
        "Authorization": "Basic "  + basicAuth
    };
    const requestConfig = {headers:headers};
    const result = await axios.get(url,requestConfig);
    return result.data.access_token;
}

Controller.initiatePaymentIntent = async (transaction,callback)=> {
    const config = await configProvider.getConfigByAppId(transaction.appId, providerId);
    const basicAuthUsername = config.basicAuthUsername || "56258e2a-a47e-46bf-89c0-51251a7441a8";//"1e42a5dc-f7bb-4578-b5ea-593340b0d746"
    const basicPassword = config.basicPassword || "d433723366364caca52e6a69af992459";//"7325bec0765e407e8a6fcd49a1494074";
    const currencyCode = 'SZL';
    const baseUrl = config.baseUrl || "https://proxy.momoapi.mtn.com"
    const basicAuth = base64EncodeBasicAuth(basicAuthUsername, basicPassword);
    const primaryKey =config.primaryKey || "6d912021c2724e44a9e900dbcd98929b";
    const accessTokenUrl = baseUrl + "/collection/token/";
    const requestUrl = baseUrl + "/collection/v1_0/requesttopay";
    const payload = {
        "amount": transaction.amount,
        "currency": currencyCode,
        "externalId": transaction.pageId,
        "payer": {
            "partyIdType": "msisdn",
            "partyId":  transaction.mobile
        },
        "payerMessage": transaction.orderDescription,
        "payeeNote": transaction.orderDescription
    }
    const accessToken = await getAccessToken(accessTokenUrl, primaryKey, basicAuth);
    const headers = {
        "X-Reference-Id": transaction.pageId,
        "X-Target-Environment": "mtnswaziland",
        "Ocp-Apim-Subscription-Key":  primaryKey,
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json",
        "X-Callback-Url":"https://integrations.shortcodeafrica.com/api/etopup/debitCallback"
    };
    const requestConfig = {headers:headers};
    console.log("The mtnEswatini request Config>>",requestConfig);
    logger.info("The mtnEswatini request Config>>",requestConfig);
    console.log('The mtneswatinini payment  payload', payload);
    logger.info('The mtneswatinini payment url', requestUrl);
    console.log('The mtneswatinini payment url', requestUrl);
    logger.info('The mtneswatinini payment url', requestUrl);
    setTimeout(function () {
        axios.post(requestUrl,payload,requestConfig)
            .then(function (response) {
                transaction.currency = currencyCode;
                transaction.paymentStatus = "PENDING";
                transaction.responseText = JSON.stringify(response.data);
                console.log("Response data from mtneswatini",response.data);
                if(response.status === 202){
                    transaction.statusMessage="PENDING";
                    transaction.paymentStatus="PENDING";
                    transaction.paymentReference= "" ;
                    transaction.providerReference= "";
                }else{
                    transaction.statusMessage="FAILED"
                    transaction.paymentStatus="FAILED";
                    transaction.paymentReference= "" ;
                    transaction.providerReference= "" ;
                }
                transaction.save();
            }).catch(function(err){
            console.log('There was and error',err);
            transaction.paymentStatus="FAILED";
            transaction.paymentReference= "" ;
            if(err.data){
                transaction.statusMessage= err.data?.message;
                transaction.responseText=JSON.stringify(err.data);
            }
            transaction.save();
        });
    },5000);
    return callback({status:"00"}) ;

};

Controller.renderPaymentPage = async function(transaction,res){

};


Controller.handlePaymentCallback = async function(req,res){
    console.log('Payment callback request',req.body);
    const response = req.body;
    const transactionStatus= req.body.status;
    db.PaymentTransaction.findOne({where:{pageId:req.body.externalId}})
        .then(function (transaction) {
            if(transaction){
                if( transactionStatus === "PENDING"){
                    console.log("Transaction still pending>>>")
                    transaction.paymentStatus="PENDING";
                }
                else if(transactionStatus === "SUCCESSFUL"){
                    console.log("Transaction successful>>>");
                    transaction.paymentStatus="COMPLETED";
                    transaction.paymentReference= req.body.trans_id;
                    transaction.providerReference=  req.body.trans_id;
                    if(req.body.message){
                        transaction.statusMessage=req.body.message;
                    }
                }else if(transactionStatus === "FAILED"){
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

    const basicAuthUsername = config.basicAuthUsername || "56258e2a-a47e-46bf-89c0-51251a7441a8";//"1e42a5dc-f7bb-4578-b5ea-593340b0d746"
    const basicPassword = config.basicPassword || "d433723366364caca52e6a69af992459";//"7325bec0765e407e8a6fcd49a1494074";
    const baseUrl = config.baseUrl || "https://proxy.momoapi.mtn.com"
    const basicAuth = base64EncodeBasicAuth(basicAuthUsername, basicPassword);
    const primaryKey =config.primaryKey || "6d912021c2724e44a9e900dbcd98929b";
    const accessTokenUrl = baseUrl + "/collection/token/";
    const requestUrl = baseUrl +  "/collection/v1_0/requesttopay/";
    const  targetEnvironment= "mtnswaziland";
    _async.waterfall([function (done) {
        configProvider.getConfigByAppId(transaction.appId,providerId).then(function (config) {
            done(null,config)
        });
    },function (done){
        getAccessToken(accessTokenUrl, primaryKey, basicAuth).then(function (accessToken) {
           done(null,accessToken) ;
        });
    },function (accessToken, done) {
        const headers = {
            "X-Target-Environment": "mtnswaziland",
            "Ocp-Apim-Subscription-Key":  primaryKey,
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json",
        };
        const transactionStatusUrl = requestUrl + transaction.pageId;
        const requestConfig = {headers:headers};
        axios.get(transactionStatusUrl,requestConfig).then(function (response) {
            transaction.callbackRetries += 1;
            console.log("Transaction status response >>",response.data);
            logger.info("Transaction status response >>",response.data);
            const transactionStatus= response.data.status;
            if(transaction.callbackRetries >= 15){
                transaction.paymentStatus="FAILED";
            }
            if( transactionStatus === "PENDING"){
                console.log("Transaction still pending>>>")
                transaction.paymentStatus="PENDING";
            }
            else if(transactionStatus === "SUCCESSFUL"){
                console.log("Transaction successful>>>");
                transaction.paymentStatus="COMPLETED";
                transaction.paymentReference= req.body.trans_id;
                transaction.providerReference=  req.body.trans_id;
                if(response.data.message){
                    transaction.statusMessage=response.data.message;
                }
            }else if(transactionStatus === "FAILED"){
                transaction.paymentStatus="FAILED";
                transaction.paymentReference= req.body.trans_id;
                transaction.providerReference=  req.body.trans_id;
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
        });
    }])

};



module.exports = {
    provider : providerId,
    actions : Controller
};