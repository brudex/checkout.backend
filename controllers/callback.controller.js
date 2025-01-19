"use strict";
const logger = require('../logger');
const db = require('../models');
const utils = require('../utils');
const axios = require('axios');
const async = require("async");
const Controller = {};
module.exports = Controller;

Controller.transactionCallback = function(paymentTransaction){
    if(paymentTransaction.paymentStatus==="PENDING"){
        return; //Don't send status on pending transactions;
    }
    const payload ={};
    payload["appId"] = paymentTransaction.appId ;
    payload["transactionId"] = paymentTransaction.transactionId ;
    payload["amount"] = paymentTransaction.amount ;
    payload["mobileNumber"] = utils.formatMobile(paymentTransaction.mobile) ;
    payload["paymentStatus"] =  paymentTransaction.paymentStatus==="COMPLETED"? 'SUCCESS':'FAILED' ;
    async.waterfall([function (done) {
        let callBackUrl = paymentTransaction.appCallBackUrl;
        if (callBackUrl == null || callBackUrl.trim() === "") {
            db.UserApp.findOne({where:{appId:paymentTransaction.appId}}).then(function (app) {
                if(app && app.callbackUrl && app.callbackUrl.trim()!==""){
                    callBackUrl=app.callbackUrl;
                    return done(null,callBackUrl)
                }else{
                    paymentTransaction.appCallBackSent=true;
                    return done(true)
                }
            })
        }else{
            return done(null,callBackUrl)
        }
    },function (callbackUrl,done) {
        if (callbackUrl == null || callbackUrl.trim() === "") {
            return done("Callback URL is null or empty")
        }
        const requestConfig = {headers:{'Content-Type':'application/json'}};
        console.log("Sending callback to >>",callbackUrl);
        console.log("Sending callback payload >>",payload);
        console.log("Sending callback json >>",JSON.stringify(payload));
        logger.info("Sending callback to >>", callbackUrl);
        logger.info("Sending callback payload >>", payload);
        axios.post(callbackUrl, payload,requestConfig)
            .then(function (response) {
                paymentTransaction.appCallBackResponse=JSON.stringify(response.data);
                paymentTransaction.appCallBackSent=true;
                console.log( `Response from app with Id ${payload.appId} >>`, response.data);
                paymentTransaction.save();
            })
            .catch(function (error) {
                console.log("There was an error transactionCallback>>",error);
                logger.error("There was an error transactionCallback>>",error);
                paymentTransaction.appCallBackSent=true;
                paymentTransaction.appCallBackResponse="--Error--"+error;
                console.log("There was an error transactionCallback>>",error);
                paymentTransaction.save();
            });
    },function (done) {
        console.log("transactionCallback Completed Processing >>");
        paymentTransaction.save();
    }],function (err) {
        console.log("transactionCallback Completed Processing with error>>"+err);
    });
};


Controller.processUnsentCallbacks = function () {
    async.waterfall([function(done){
        db.PaymentTransaction.findAll({
            where: {
                appCallBackSent: {
                    [db.Sequelize.Op.not]: true
                },
                paymentStatus: {
                    [db.Sequelize.Op.in]: ["FAILED", "SUCCESS", "COMPLETED"]
                }
            }
    })
            .then(function (transactions){
                console.log("processUnsentCallbacks The transactions count are >>",transactions.length);
                logger.info("processUnsentCallbacks The transactions count are >>",transactions.length);
                done(null,transactions)
            }).catch(function (err) {
            console.log("Error fetching unsent callbacks",err);
            done(err,[]);
        });
    },function(transactions,innerDone){
        console.log("Processing async.each The transaction count >>"+transactions.length);
        async.each(transactions,function (transaction,callback) {
            try {
                console.log("Processing unsent callback for transaction >>",transaction.transactionId);
                Controller.transactionCallback(transaction);
                console.log("Processed unsent callback for transaction >>",transaction.transactionId);
            }catch (err) {
                console.log("Error processing unsent callbacks",err);
            }
            callback();
        },function (err) {
            if(err){
                console.log("Error processing unsent callbacks",err);
            }
            console.log("Processed all unsent callbacks Async Each completed")
            innerDone();
        });
    }])
}
