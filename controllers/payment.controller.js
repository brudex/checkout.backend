// Add this method to the existing controller
Controller.paymentResult = async (req, res) => {
    const pageId = req.params.pageId;
    const transaction = await db.PaymentTransaction.findOne({
        where: { pageId: pageId },
        include: [{ model: db.UserApp }]
    });

    if (!transaction) {
        return res.redirect('/404');
    }

    // Set custom layout for payment result page
    res.locals.layout = 'layout/result-layout';
    
    return res.render('payment-result', {
        transaction: transaction,
        status: transaction.paymentStatus === 'COMPLETED' ? 'success' : 'failed'
    });
};