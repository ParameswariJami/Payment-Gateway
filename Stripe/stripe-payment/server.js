const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const stripe = require('stripe')('sk_test_tR3PYbcVNZZ796tH88S4VQ2u');

const app = express();

app.use(cors({ credentials: true, origin: 'https://localhost:3000' }));
app.use(bodyParser.json());

const sequelize = new Sequelize('payment_app', 'root', 'Root', {
  host: 'localhost',
  dialect: 'mysql',
});

const Transaction = sequelize.define('transaction', {
  name: Sequelize.STRING,
  amount: Sequelize.INTEGER,
  transactionId: Sequelize.STRING,
});

sequelize.sync();

app.post('/create-payment', async (req, res) => {
  try {
    const { name, amount, address } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'INR',
      description: 'Description of the export transaction',
      shipping: {
        name,
        address,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      name,
      amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/save-transaction', async (req, res) => {
  try {
    const { name, amount, transactionId } = req.body;
    await Transaction.create({ name, amount, transactionId });
    res.send({ message: 'Transaction saved successfully' });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    res.send(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Internal Server Error');
  }
});

const options = {
  key: fs.readFileSync('localhost.key'),
  cert: fs.readFileSync('localhost.crt'),
};

const PORT = process.env.PORT || 5000;
https.createServer(options, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
