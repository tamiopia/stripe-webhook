require('dotenv').config()
const express=require('express')
const Stripe=require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    

const app=express();
app.use(express.json());

app.set('view engine','ejs')

app.get ('/',(req,res)=>{

    res.render('index.ejs')
});
app.get ('/success',(req,res)=>{

    res.render('success.ejs')
});
app.get ('/cancel',(req,res)=>{

    res.render('index.ejs')
});
app.post('/checkout', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'monthly payment'
                        },
                        unit_amount: 200 * 100, // amount in cents
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `https://stripe-webhook-gf8o.onrender.com/success`, // Include protocol
            cancel_url: `https://stripe-webhook-gf8o.onrender.com/cancel`,  // Include protocol
        });

        console.log(session);
        res.json({ id: session.id,
            data:session.url


        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send(error.message);
    }
});

// Endpoint to create an Express account and account link
app.post('/create-account', async (req, res) => {
    try {
      // Create an Express account
      const account = req.body.accountId
    
  
      // Create an account link
      const accountLink = await stripe.accountLinks.create({
        account:account ,
       
        return_url: 'https://stripe-webhook-gf8o.onrender.com/success',
        type: 'account_onboarding',
      });
  
      res.send({ url: accountLink.url, accountId: account});
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
      const { accountId } = req.body.accountId;
      const payout = await stripe.payouts.create({
        amount: 10, // Amount in cents
        currency: 'EUR',
      }, {
        stripeAccount: accountId, // The connected account ID
      });
      res.send(payout);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  app.post('/create-test-account', async (req, res) => {
    try {
      // Create a test Express account
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
  
      res.send({ accountId: account.id });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });
  app.post('/connect-account', async (req, res) => {
    try {
      const { accountId } = req.body;
  
      // Create an account link to complete onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: 'https://stripe-webhook-gf8o.onrender.com/reauth',
        return_url: 'https://stripe-webhook-gf8o.onrender.com/success',
        type: 'account_onboarding',
      });
  
      res.send({ url: accountLink.url });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });
  app.post('/create-charge', async (req, res) => {
    try {
      const charge = await stripe.charges.create({
        amount: 5000000000, // Amount in cents
        currency: 'usd',
        source: 'tok_visa', // Use a test token provided by Stripe
      });
      res.send(charge);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });

  app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
  
      // Forward the necessary information to your main application
      try {
        await axios.post('https://remotide.onrender.com/api/invoice/handle-payment', {
          sessionId: session.id,
          amount: session.amount_total,
          invoiceId: session.client_reference_id, // Assuming you store invoiceId in the session metadata
        });
  
        console.log('Forwarded checkout.session.completed event to main application.');
      } catch (error) {
        console.error('Error forwarding event:', error);
      }
    }
  
    res.json({ received: true });
  });
  

app.listen(3000,()=>console.log('the server is ready'))