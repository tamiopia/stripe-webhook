const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_TEST_SECRET_KEY');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Endpoint to create an Express account and account link
app.post('/create-account', async (req, res) => {
  try {
    // Create an Express account
    const account = await stripe.accounts.create({
      type: 'express',
    });

    // Create an account link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://your-website.com/reauth',
      return_url: 'https://your-website.com/success',
      type: 'account_onboarding',
    });

    res.send({ url: accountLink.url, accountId: account.id });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Endpoint to create a test charge
app.post('/create-charge', async (req, res) => {
  try {
    const charge = await stripe.charges.create({
      amount: 5000, // Amount in cents
      currency: 'usd',
      source: 'tok_visa', // Use a test token provided by Stripe
    });
    res.send(charge);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Endpoint to create a payout to a connected account
app.post('/create-payout', async (req, res) => {
  try {
    const { accountId } = req.body;
    const payout = await stripe.payouts.create({
      amount: 1000, // Amount in cents
      currency: 'usd',
    }, {
      stripeAccount: accountId, // The connected account ID
    });
    res.send(payout);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
