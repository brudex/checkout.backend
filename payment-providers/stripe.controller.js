const uuid = require('uuid');
const config = require("../config/config");
const stripeApi = require("stripe");
const configProvider = require("../config/payment.config.provider");
const db = require('../models');
const axios = require('axios');
const _async = require("async");
const dateFns = require("date-fns");
const Controller = {};


Controller.initiatePaymentIntent = async (transaction,callback) => {
    const config = await configProvider.getConfigByAppId(transaction.appId,providerId);
    const stripe = stripeApi(config.stripe_apiKey);
    const intent={
        amount: calculateOrderAmount(transaction),
        currency: "usd"
    };
    console.log('The intent is >>>',intent);
    stripe.paymentIntents.create(intent).then(function (paymentIntent) {
        console.log("The payment intent is >>>",paymentIntent);
        transaction.paymentStatus = "PENDING";
        transaction.paymentReference= ""+paymentIntent.id; ;
        transaction.save();
        callback({status:"00",message:"Payment pending approval", reference:paymentIntent.id, clientSecret:paymentIntent.client_secret});
    }).catch(err=>{
        console.log(err);
        callback({status:"01",message:"Error initiating payment"})
    });



};


Controller.handlePaymentCallback = async (req, res) => {

    switch (req.params.provider.toLowerCase()) {
        case "interpay":{
            return interPayController.handlePaymentCallback(req,res);
            break;
        }
        case "paystack":{
            return payStackController.handlePaymentCallback(req,res);
            break;
        }

    }

};


Controller.paymentPage = async (req, res) => {
    db.PaymentTransaction.findOne({where:{pageId:req.params.pageId}})
        .then(function (donation) {
            if(donation && donation.paymentStatus==="PENDING"){
                if(donation.paymentMode==="paypal"){
                    donation.paymentMode='paypal';
                    return renderPaypalPayment(donation,res)
                }else if(donation.paymentMode==="stripe"){
                    donation.paymentMode='stripe';
                    return renderStripePayment(donation,res)
                }
                else if(donation.paymentMode==="interpay"){
                    donation.paymentMode='interpay';
                    return interPayController.renderPaymentPage(donation,res)
                }
            }else{
                return res.render("payment-not-found",{layout:"payment-layout",title:"Payment Error"});
            }
        })
};

Controller.paymentResult = async (req, res) => {
    if(req.params.status==="success"){
        return res.render("payment-status",{layout:"white-layout",title:"Payment Success",status:"success"});
    }else{
        return res.render("payment-status",{layout:"white-layout",title:"Payment Failed",status:"failed"});
    }
};

Controller.renderPaymentPage = renderStripePayment;

function renderStripePayment(donation,res){
    // Create a PaymentIntent with the order amount and currency
    const intent={
        amount: calculateOrderAmount(donation),
        currency: "usd"
    };
    console.log('The intent is >>>',intent);
    stripe.paymentIntents.create(intent).then(function (paymentIntent) {
        let buff = new Buffer(paymentIntent.client_secret);
        const clientSecret= buff.toString('base64');
        return res.render( "payment-page", {paymentMode:donation.paymentMode,pageId:donation.pageId, clientSecret:clientSecret,stripePublicKey:config.stripe_publicKey ,layout: "payment-layout",title:"Pay with Card"});
    }).catch(err=>{
        console.log(err);
        return res.render("payment-error",{layout:"payment-layout",title:"Payment Error"})
    });
}



function renderPaypalPayment(donation,res){
    const amount=calculateOrderAmount(donation);
    return res.render( "payment-page", { paymentMode:donation.paymentMode,pageId:donation.pageId,payPalClientId:config.paypal_client_id,layout: "payment-layout",title:"Pay with PayPal",amount:amount});
}

Controller.setPaymentStatus = function (req,res){
    db.PaymentTransaction.findOne({where:{pageId:req.params.pageId}})
        .then(function (donation) {
            console.log('Payment status payload >>>',req.body);
            if(donation && donation.paymentStatus==="PENDING"){ //todo change to time base not more than 5 mins of creation
                donation.responseText = req.body.data;
                donation.paymentStatus =req.body.status;
                donation.statusMessage = req.body.statusMessage;
                if(donation.paymentMode==='stripe' && donation.paymentStatus==="00"){
                    const paymentDetails = JSON.parse(req.body.paymentIntent.id);
                }
                if(donation.paymentMode==='paypal' && donation.paymentStatus==="00"){
                    const paymentDetails = JSON.parse(req.body.data);
                    donation.paymentReference = paymentDetails.id;
                 }
                donation.save();
                res.json({status:"00",message:"Payment status updated"})
            }else{
                res.status(404).json({status:"404",message:"Not found"})
            }
        })
};


Controller.paymentStatus = async (req, res) => {
    db.PaymentTransaction.findOne({where:{pageId:req.params.pageId}})
        .then(function (transaction) {
            if(transaction){
               return  res.json({status:transaction.paymentStatus, message:transaction.statusMessage})
            }else{
                return res.status(404).json({status:"404",message:"Not Found"})
            }
        })
};



const calculateOrderAmount = transaction => {
    console.log('Payment Transaction object >>',transaction.toJSON());
    console.log("the donation amount is >>>",transaction.amount);
    if(transaction.paymentMode=== 'stripe'){
        return Number(Number(transaction.amount)*100);
    }
    return Number(transaction.amount);
};


module.exports = {
    provider : "stripe",
    actions : Controller
};