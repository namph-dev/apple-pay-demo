const express = require("express");
const stripe = require("stripe")(
	"sk_test_51PnyCL1JhLysIlBU62vNkECKpQyJxutklwvFJmyZzbX82eBLPUwTV1wOczQIfNfiVL88f7hFQjMcCeYc4hdWCQmc00UentIqLa",
);
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY);

// Endpoint tạo PaymentIntent
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

// Lắng nghe cổng 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
