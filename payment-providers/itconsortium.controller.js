const providerId ='itconsotium';
 const db = require('../models');
const Controller = {};
const axios = require('axios');



Controller.initiatePaymentIntent = (transaction,callback)=>{
     /***
      *
      * TODO MAKE A DEBIT REQUEST TO ITC
      *
      */
};

Controller.renderPaymentPage = function(transaction,res){
    /***
     *
     * IGNORE THIS FOR NOW
     */
};


Controller.handlePaymentCallback = function(req,res){
    const response =req.body;
    db.PaymentTransaction.findOne({where:{pageId:req.body.order_id}})
        .then(function (transaction) {
            if(transaction){
                /***
                 *
                 * TODO HANDLE ITC CALLBACK IN THIS FUNCTION
                 */
                transaction.callbackResponseText=JSON.stringify(response);
                transaction.save();
                transactionCallback(transaction);
            }
            res.json({message:"Received"})
        })
};




function transactionCallback(paymentTransaction){
    /***
     *
     * TODO CHECK IF THIS IS OK TO CALLBACK BEZO SUSU CORRECTLY
     */
    const payload ={};
    payload["cart_id"] = paymentTransaction.transactionId ;
    payload["payment_method"] =  "momo" ;
    payload["wallet"] =  "no" ;
    payload["payment_status"] =  paymentTransaction.paymentStatus==="COMPLETED"? 'success':'failed' ;
    let paymentUrl = config.bezoMoneyBaseUrl + "/api/checkout";
    axios.post(paymentUrl, payload)
        .then(function (response) {
            console.log( "Response from bezo money update >>"+ response.data);
        })
        .catch(function (error) {
            console.log("There was an error >>",error);
        });

}

Controller.checkTransactionStatus = (transaction,callback)=>{
    /***
     *
     * TODO IMPLEMENT TRANSACTION STATUS CHECK TO ITC
     */
    const payload = {

    };
    const requestConfig = {headers:{}};
    requestConfig.url = config.ITC_BASEURL;
    axios.post( requestConfig.url,payload).then(function (response) {
        transaction.callbackRetries+=1;
        if(transaction.callbackRetries>=30){
            transaction.paymentStatus="FAILED";
        }
        if(response.status_code===1){
            transaction.paymentStatus="COMPLETED";
        }else if(response.status_code===0){
            transaction.paymentStatus="FAILED";
        }

        transaction.callbackResponseText=JSON.stringify(response);
        transaction.save().then(function (trxn) {
            transactionCallback(trxn);
        });
    });
};

module.exports = {
    provider : providerId,
    actions : Controller
};