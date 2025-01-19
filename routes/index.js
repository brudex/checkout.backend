const express = require("express");
const router = express.Router();
const apiAuth = require('../middlewares/api-auth');

const paymentController = require("../controllers/payment.controller");
const checkoutController = require("../controllers/checkout.controller");

/***************Payment Url*****************/
router.get("/trxn/:trxId", checkoutController.checkoutPage);
router.get("/trxn-status/:trxId", checkoutController.transactionStatus);
router.get("/paymentPage/:pageId", paymentController.paymentPage);
router.get("/paymentResult/:provider", paymentController.paymentResult);//success callback url for paystack/flutterwave

/***************Api Url*****************/
router.post("/api/initiatePaymentIntent",apiAuth, paymentController.initiatePaymentIntent); //call this endpoint to start a payment session it will return the payment url or initiate a momo debit
router.post("/api/walletPaymentRequest", paymentController.walletPaymentRequest); //call this endpoint to start a payment session it will return the payment url or initiate a momo debit
router.post("/api/visaPaymentRequest", paymentController.visaPaymentRequest);
router.get("/api/getOrderDetails/:trxId", checkoutController.getOrderDetails); //call this endpoint to get payment page
router.get("/api/paymentStatus/:trxId", paymentController.paymentStatus); //call this endpoint to get status of payment
router.post("/api/paymentCallback/:provider", paymentController.handlePaymentCallback); //Payment provider callback

router.get("404", (req, res) => {
    res.render("404");
});

module.exports = router;
