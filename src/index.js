import React from "react";
import ReactDOM from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import App from "./App";

// Cấu hình Stripe với Public Key
const stripePromise = loadStripe(
	"pk_test_51PnyCL1JhLysIlBUWn5wZ8hM84hS6CFJFTaXbQQNUTWQWV3HGQr4cu8cW78d4RE24muDTuTCOoOJ7fCbwoCpVt9K0012MoJt6s",
);

ReactDOM.render(
	<Elements stripe={stripePromise}>
		<App />
	</Elements>,
	document.getElementById("root"),
);
