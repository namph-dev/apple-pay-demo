const express = require("express");
const stripe = require("stripe")("YOUR_STRIPE_SECRET_KEY");
const paypal = require("@paypal/checkout-server-sdk");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Stripe Secret Key
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

// PayPal environment configuration
let environment = new paypal.core.LiveEnvironment(
	process.env.PAYPAL_CLIENT_ID,
	process.env.PAYPAL_CLIENT_SECRET,
);
let paypalClient = new paypal.core.PayPalHttpClient(environment);
// Endpoint tạo PaymentIntent cho Stripe
app.post("/create-payment-intent", async (req, res) => {
	try {
		const { amount } = req.body;

		if (!amount || typeof amount !== "number") {
			throw new Error("Invalid amount value");
		}

		const paymentIntent = await stripe.paymentIntents.create({
			amount,
			currency: "usd",
			payment_method_types: ["card"],
		});

		console.log("PaymentIntent created:", paymentIntent);

		res.send({
			clientSecret: paymentIntent.client_secret,
		});
	} catch (error) {
		console.error("Error creating PaymentIntent:", error);
		res.status(500).json({ error: error.message });
	}
});

// Endpoint tạo đơn hàng PayPal
app.post("/create-paypal-order", async (req, res) => {
	try {
		const { amount } = req.body;

		const request = new paypal.orders.OrdersCreateRequest();
		request.prefer("return=representation");
		request.requestBody({
			intent: "CAPTURE",
			purchase_units: [
				{
					amount: {
						currency_code: "USD",
						value: (amount / 100).toFixed(2), // Chuyển đổi cent sang đô la
					},
				},
			],
		});

		const order = await paypalClient.execute(request);
		console.log("PayPal order created:", order);

		res.status(200).json({ id: order.result.id });
	} catch (error) {
		console.error("Error creating PayPal order:", error);
		res.status(500).json({ error: error.message });
	}
});

// Endpoint capture PayPal order sau khi thanh toán thành công
app.post("/capture-paypal-order", async (req, res) => {
	try {
		const { orderID } = req.body;

		const request = new paypal.orders.OrdersCaptureRequest(orderID);
		request.requestBody({});

		const capture = await paypalClient.execute(request);
		console.log("PayPal order captured:", capture);

		res.status(200).json(capture.result);
	} catch (error) {
		console.error("Error capturing PayPal order:", error);
		res.status(500).json({ error: error.message });
	}
});

// Lắng nghe cổng 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
