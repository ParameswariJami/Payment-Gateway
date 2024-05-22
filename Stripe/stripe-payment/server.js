const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const http = require('http'); 

const stripe = require('stripe')('sk_test_tR3PYbcVNZZ796tH88S4VQ2u');

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
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
    const { name, amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      description: 'Description of the export transaction', 
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

const server = http.createServer(app); 

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
