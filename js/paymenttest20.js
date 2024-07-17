require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'myr', // Change currency to MYR
                        product_data: {
                            name: 'Node.js and Express book'
                        },
                        unit_amount: 50 * 100 // Amount in cents
                    },
                    quantity: 1
                },
                {
                    price_data: {
                        currency: 'myr', // Change currency to MYR
                        product_data: {
                            name: 'JavaScript T-Shirt'
                        },
                        unit_amount: 20 * 100 // Amount in cents
                    },
                    quantity: 2
                }
            ],
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 1000, // Shipping cost in MYR cents
                            currency: 'myr',
                        },
                        display_name: 'Standard shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 5,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 7,
                            },
                        },
                    },
                },
            ],
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['MY']
            },
            success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ session_id: session.id })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
