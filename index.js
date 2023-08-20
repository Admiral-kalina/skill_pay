const { createMollieClient } = require("@mollie/api-client");
var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors())

// let paymentForOrderInDatabase = {};
const mollieClient = createMollieClient({
    apiKey: "test_pgUgytqg5zHBKmwS7rMbhAR2qRw4Tm"
});

app.get('/', function (req,res){
    res.send('Hello Api')
});

app.get('/payment', function (req,res){
    mollieClient.payments
        .create({
            amount: {
                value: "10.00",
                currency: "EUR"
            },
            locale: "fr_FR",
            metadata: {
                restaurantId: "2g2ig131kh3kug444b4k2bk4bk2",
                restaurantName: "Zyara Cafe"
            },
            method: ["creditcard", "paypal", "ideal", "directdebit"],
            description: "My first API payment",
            redirectUrl: "https://izejs.sse.codesandbox.io/order/123456",
            webhookUrl: "https://izejs.sse.codesandbox.io/webhook"
        })
        .then(payment => {
            //console.log("payment => ", payment);
            console.log("checkout url => ", payment.getCheckoutUrl());
            console.log("payment.id => ", payment.id);
            // paymentForOrderInDatabase.paymentId = payment.id;
            // paymentForOrderInDatabase.orderId = "123456";
            // Forward the customer to the payment.getCheckoutUrl()
            // res.write(payment.getCheckoutUrl());
            res.send(payment.getCheckoutUrl())
        })
        .catch(error => {
            // Handle the error
            console.log("error.title => ", error.title);
            console.log(error);
            res.write(error.title);
        });
});





app.listen(3012,function (){
    console.log('API started')
});