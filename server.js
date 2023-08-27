const {createMollieClient} = require("@mollie/api-client");
var express = require('express');
require('dotenv').config();
var {MongoClient} = require('mongodb');
var app = express();
var cors = require('cors');
const axios = require("axios");
app.use(cors())
app.use(express.json())

const mollieClient = createMollieClient({apiKey: process.env.MOLLIE_API});
const client = new MongoClient(process.env.MONGO_API);
let payments

async function connect() {
    try {
        await client.connect()
        console.log('connected to mongo db')
        payments = client.db().collection('payments')

    } catch (error) {
        console.log(error)
    }
}

app.listen(3012, function () {
    console.log('API started')
    connect()
});


const getPaymentById = async (paymentId) => {
    return await payments.findOne({paymentId: paymentId})
}

const insertPayment = async (id, amount, metadata, mollieId) => {
    await payments.insertOne({paymentId: id, status: null, amount, metadata, mollieId})
}

const getNewPaymentId = async () => {
    const collectionLength = await payments.count();
    return collectionLength + 1;
}

const findAndUpdatePayment = async (paymentId, status) => {
    const filter = {paymentId: paymentId};
    const update = {status: status};

    await payments.findOneAndUpdate(filter, {"$set": update}, (err => {
        if (err) {
            console.log('ERR', err)
        }
        console.log('Updated')
    }))
}

app.post('/payment', async function (req, res) {
    const data = req.body
    console.log(data.data)
    const paymentId = await getNewPaymentId()
    mollieClient.payments
        .create({
            amount: data.data.amount,
            locale: "en_US",
            metadata: data.metadata,
            method: ["creditcard", "paypal", "ideal", "directdebit"],
            description: "My first API payment",
            redirectUrl: `http://localhost:8000/checkout?id=${paymentId}`,
        })
        .then(async payment => {
            await insertPayment(paymentId, data.amount, data.metadata, payment.id)
            res.send(payment.getCheckoutUrl())
        })
        .catch(error => {
            console.log("error.title => ", error.title);
            console.log(error);
            res.write(error.title);
        });
});

app.post('/webhook', async function (req, res) {
    const paymentId = Number(req.body.data.paymentId)
    const paymentData = await getPaymentById(paymentId)

    mollieClient.payments
        .get(paymentData.mollieId)
        .then(async payment => {
            await findAndUpdatePayment(paymentId, payment.status)

            res.send(payment.status)
        })
        .catch(error => {
            console.error(error);
            res.end(); //end the response
        });
});

app.get('/posts', async function (req, res) {
    try {
      const a =   await axios.get(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,caption&limit=5&access_token=${process.env.INSTAGRAM_TOKEN}`, {
            headers: {
                'access_token': process.env.INSTAGRAM_TOKEN,
                'limit': '5',
                'fields': 'id,media_type,media_url,caption'
            }
        })


        console.log('resp',a.data)
res.send(a.data)
    } catch (error) {
        console.log('Error', error)
    }

    // console.log('A',a)
    // res.send(a)
})



