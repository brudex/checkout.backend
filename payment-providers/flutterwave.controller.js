const providerId ='flutterwave';
const configProvider = require("../config/payment.config.provider");
const callbackController = require('../controllers/callback.controller');
const db = require('../models');
const axios = require('axios');
const _async = require("async");
const dateFns = require("date-fns");
const Controller = {};


Controller.initiatePaymentIntent = async (transaction,callback)=>{
    const data =transaction;
    if(data.mobile.indexOf("233")===0){
        data.mobile = "+" + data.mobile;
    }
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    let baseUrl =  config.flutterwaveBaseUrl;
    let flutterWaveSecretKey =  config.flutterwaveSecretKey;
    console.log("Flutter Wave config values>>>",config)
    let orderDetails = transaction.getOrderDetails();
    let payload = {
        tx_ref:  transaction.pageId,
        amount: transaction.amount,
        currency: transaction.currency || "NGN",
        redirect_url: "https://checkout.sovereignpaysolutions.com/paymentCallback/flutterwave",
        meta: {...orderDetails},
        customer: {
            email: orderDetails.email || "info@sovereignpaysolutions.com",
            phonenumber:  transaction.mobile,
            name: orderDetails.customerName || "SovereignPayment Solutions"
        },
        customizations: {
            title:  transaction.orderDescription,
            logo: "https://dashboard.sovereignpaysolutions.com/assets/images/logo.jpg"
        }
    }
    const requestConfig = {headers:{'Authorization':flutterWaveSecretKey}};
    console.log("The flutter request Config>>",requestConfig);
    let requestUrl =baseUrl + "/v3/payments";
    console.log('The payment message payload', payload);
    console.log('The payment url', requestUrl);
    axios.post(requestUrl,payload,requestConfig)
        .then(function (response) {
            console.log("Flutterwave intiate response>>>",response.data);
            console.log(typeof  response.data);
            console.log( "Flutterwave intiate Response data flutter status code >>"+ response.data.status);
            let result  ={};
            if(response.data && response.data.status==="success"){
                transaction.paymentStatus="PENDING";
                transaction.statusMessage=response.data.message;
                 transaction.providerReference =""+response.data.data.id;
                transaction.save();
                result = { status: "01", redirectUrl : response.data.data.link,reference:transaction.pageId };
            }else if(response && response.data.status===false){
                transaction.paymentStatus="FAILED";
                transaction.statusMessage=response.data.message;
                transaction.save();
                result = {status: "03", reference:transaction.pageId};
            }
            console.log('Transaction Response >>',response.data);
            return callback(result);
        }).catch(function(err){
            console.log('Flutterwave There was and error',err);
            transaction.paymentStatus="FAILED";
            transaction.paymentReference= "" ;
            if(err.data){
                transaction.statusMessage = err.data.resp_desc;
                transaction.responseText = JSON.stringify(err.data);
            }
            transaction.save();
        });
    return callback({status:"00"})
};

Controller.renderPaymentPage = async function(transaction,res){

};

/*
WebHook callback
 */
Controller.handlePaymentCallback = async function(req,res){
    const config = await configProvider.getConfigByAppId(null,providerId);
    const secretHash = config.flutterwaveSecretHash;
    const signature = req.headers["verif-hash"];
    if (!signature || (signature !== secretHash)) {
        // This request isn't from Flutterwave; discard
       return  res.status(401).end();
    }
    const payload =req.body;
    if(payload.event==="charge.completed"){
        let trans_ref = payload.tx_ref;
        db.PaymentTransaction.findOne({where:{pageId:trans_ref}})
            .then(function (transaction) {
                if(transaction){
                    if(req.body.status==="successful"){
                        transaction.paymentStatus="COMPLETED";
                        transaction.paymentReference= req.body.flw_ref;
                        transaction.providerReference=  req.body.flw_ref;
                        if(req.body.message){
                            transaction.statusMessage=req.body.processor_response;
                        }
                    }else{
                        transaction.paymentStatus="FAILED";
                        transaction.paymentReference= req.body.flw_ref;
                        transaction.providerReference=  req.body.flw_ref;
                        if(req.body.message){
                            transaction.statusMessage=req.body.processor_response;
                        }
                    }
                    transaction.callbackResponseText=JSON.stringify(payload);
                    transaction.save().then(function (trxn) {
                        callbackController.transactionCallback(trxn);
                    });
                }
                res.status(200).end()
            });
    }

};



Controller.paymentResult = async (req, res) => {
    const pageId = req.query['tx_ref'];
    console.log("Flutterwave payment result >>",req.query);
    db.PaymentTransaction.findOne({where:{pageId:pageId}})
        .then(function (transaction) {
            if(transaction){
                if(req.query['status']==='successful'){
                    transaction.paymentStatus="COMPLETED";
                    transaction.statusMessage ="Success";
                    transaction.providerReference = req.query['transaction_id'];
                    transaction.paymentReference = req.query['transaction_id'];
                    transaction.responseText=JSON.stringify(req.query);
                    transaction.save();
                }else{
                    transaction.paymentStatus="FAILED";
                    transaction.statusMessage ="FAILED";
                }
                let orderDetails = transaction.getOrderDetails();
                let returnUrl = orderDetails.returnUrl || "https://shortcodeafrica.com/account-billing";
                callbackController.transactionCallback(transaction);
                return res.status(301).redirect(returnUrl)
            }
            return res.send({message:"Payment Success",status:"success"});
        });
};




Controller.checkTransactionStatus = async (transaction,callback)=>{
    _async.waterfall([function (done) {
        configProvider.getConfigByAppId(transaction.appId,providerId).then(function (config) {
            done(null,config)
        });
    },function (config, done) {
        const requestConfig = {};
        let baseUrl =  config.flutterwaveBaseUrl;
        requestConfig.url = `${baseUrl}/v3/transactions/${transaction.providerReference}/verify`;
        axios.get(requestConfig.url).then(function (response) {
            transaction.callbackRetries += 1;
            if(transaction.callbackRetries >= 15){
                transaction.paymentStatus="FAILED";
            }
            if(response.data && response.data.status==="success"){
                transaction.paymentStatus="COMPLETED";
                transaction.paymentReference= response.data.data.flw_ref ;
                 if(response.data.message){
                    transaction.statusMessage=response.data.message;
                }
            }else{
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