require('dotenv').config()
const express=require('express')
const Stripe=require('stripe')
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    

const app=express();
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
            success_url: `http://localhost:3000/success`, // Include protocol
            cancel_url: `http://localhost:3000/cancel`,  // Include protocol
        });

        console.log(session);
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send(error.message);
    }
});


app.listen(3000,()=>console.log('the server is ready'))