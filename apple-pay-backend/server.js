import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";
import {
	createOrder,
	capturePayment,
	generateAccessToken,
} from "./paypal-api.js";

// Load environment variables from .env file
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

// Log environment variables for debugging (remove in production)
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);
console.log("PayPal Client ID:", process.env.CLIENT_ID);
console.log("PayPal Client Secret:", process.env.CLIENT_SECRET);
console.log("Merchant ID:", process.env.MERCHANT_ID);

// Endpoint to create a Stripe PaymentIntent
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

// Endpoint to create a PayPal order
app.post("/create-paypal-order", async (req, res) => {
	try {
		const { amount } = req.body;

		const order = await createOrder(amount);

		if (!order || !order.id) {
			throw new Error("Failed to create PayPal order.");
		}

		console.log("PayPal order created:", order);

		res.status(200).json({ id: order.id });
	} catch (error) {
		console.error("Error creating PayPal order:", error);
		res.status(500).json({ error: error.message });
	}
});

// Endpoint to capture a PayPal order after payment
app.post("/capture-paypal-order", async (req, res) => {
	try {
		const { orderID } = req.body;

		const capture = await capturePayment(orderID);

		console.log("PayPal order captured:", capture);

		res.status(200).json(capture);
	} catch (error) {
		console.error("Error capturing PayPal order:", error);
		res.status(500).json({ error: error.message });
	}
});

// Test route to check PayPal authentication (for debugging)
app.get("/test-paypal-auth", async (req, res) => {
	try {
		const accessToken = await generateAccessToken();
		res.status(200).json({ accessToken });
	} catch (error) {
		console.error("Error fetching PayPal access token:", error);
		res.status(500).json({ error: error.message });
	}
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
