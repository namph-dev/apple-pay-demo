import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import {
	createOrder,
	capturePayment,
	generateClientToken,
} from "./paypal-api.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Stripe Secret Key
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

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

		// Use createOrder from paypal-api.js
		const order = await createOrder(amount);

		console.log("PayPal order created:", order);

		res.status(200).json({ id: order.id });
	} catch (error) {
		console.error("Error creating PayPal order:", error);
		res.status(500).json({ error: error.message });
	}
});

// Endpoint capture PayPal order sau khi thanh toán thành công
app.post("/capture-paypal-order", async (req, res) => {
	try {
		const { orderID } = req.body;

		// Use capturePayment from paypal-api.js
		const capture = await capturePayment(orderID);

		console.log("PayPal order captured:", capture);

		res.status(200).json(capture);
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
