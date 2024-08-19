import React, { useState, useEffect } from "react";
import {
	PaymentRequestButtonElement,
	useStripe,
	useElements,
	CardElement,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Payment = () => {
	const stripe = useStripe();
	const elements = useElements();
	const [paymentRequest, setPaymentRequest] = useState(null);
	const [clientSecret, setClientSecret] = useState("");
	const [errorMessage, setErrorMessage] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [paidFor, setPaidFor] = useState(false);

	useEffect(() => {
		// Gửi yêu cầu tới backend để tạo PaymentIntent
		fetch(
			"   https://e65b-113-23-53-236.ngrok-free.app/create-payment-intent",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ amount: 100 }), // Số tiền thanh toán tính bằng cent (5000 cent = $50)
			},
		)
			.then((res) => res.json())
			.then((data) => {
				console.log("Client secret received:", data.clientSecret);
				setClientSecret(data.clientSecret);

				if (stripe) {
					console.log(
						"Stripe object is available, creating paymentRequest...",
					);

					// Khởi tạo PaymentRequest sau khi nhận được clientSecret
					const pr = stripe.paymentRequest({
						country: "US",
						currency: "usd",
						total: {
							label: "Demo Payment",
							amount: 100,
						},
						requestPayerName: true,
						requestPayerEmail: true,
					});

					// Kiểm tra xem phương thức thanh toán có khả dụng không
					pr.canMakePayment()
						.then((result) => {
							console.log("canMakePayment result:", result);

							if (result) {
								setPaymentRequest(pr);
							} else {
								console.warn(
									"PaymentRequest not supported or no valid payment method available.",
								);
							}
						})
						.catch((error) => {
							console.error("Error in canMakePayment:", error);
						});
				} else {
					console.error("Stripe object is not available.");
				}
			})
			.catch((error) => console.error("Error:", error));
	}, [stripe]);

	const handleStripeSubmit = async (event) => {
		event.preventDefault();
		setIsProcessing(true);

		if (!stripe || !elements || !clientSecret) {
			console.error(
				"Stripe, elements, or clientSecret is not available.",
			);
			setIsProcessing(false);
			return;
		}

		const cardElement = elements.getElement(CardElement);

		const { error, paymentIntent } = await stripe.confirmCardPayment(
			clientSecret,
			{
				payment_method: {
					card: cardElement,
					billing_details: {
						name: "Customer Name",
					},
				},
			},
		);

		if (error) {
			setErrorMessage(error.message);
			setIsProcessing(false);
		} else if (paymentIntent && paymentIntent.status === "succeeded") {
			console.log("Payment successful!");
			setIsProcessing(false);
		}
	};

	const handlePayPalApprove = (orderID) => {
		// Capture PayPal order
		fetch(
			" https://e65b-113-23-53-236.ngrok-free.app/capture-paypal-order",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ orderID }),
			},
		)
			.then((response) => response.json())
			.then((data) => {
				setPaidFor(true);
				console.log("Payment captured successfully:", data);
			})
			.catch((error) => {
				setErrorMessage(error.message);
				console.error("Error capturing PayPal order:", error);
			});
	};

	const handlePayPalError = (err) => {
		setErrorMessage(err.message);
		console.error("Payment error:", err);
	};

	return (
		<div>
			<h2>Payment Demo (Stripe & PayPal)</h2>

			{/* PayPal Payment */}
			<h3>PayPal Payment</h3>
			{paidFor ? (
				<h3>Thank you for your purchase!</h3>
			) : (
				<PayPalScriptProvider
					options={{
						"client-id":
							"AU4_flDkT_NKhMu_YQnsQSa1UGF5czxEANZrgxsaPVl24AiIcPZfcYlShOitTY8h4w089I6ciIYGURmk",
					}}
				>
					<PayPalButtons
						style={{ layout: "vertical" }}
						createOrder={(data, actions) => {
							return fetch(
								" https://e65b-113-23-53-236.ngrok-free.app/create-paypal-order",
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({ amount: 100 }), // Amount in cents (5000 cents = $50)
								},
							)
								.then((response) => response.json())
								.then((data) => {
									return data.id;
								});
						}}
						onApprove={(data, actions) => {
							return handlePayPalApprove(data.orderID);
						}}
						onError={(err) => handlePayPalError(err)}
					/>
				</PayPalScriptProvider>
			)}

			<hr />

			{/* Stripe Payment */}
			<h3>Stripe Payment</h3>
			{paymentRequest ? (
				<PaymentRequestButtonElement options={{ paymentRequest }} />
			) : (
				<p>Apple Pay is not available on this device/browser.</p>
			)}

			<form onSubmit={handleStripeSubmit}>
				<CardElement />
				<button type="submit" disabled={!stripe || isProcessing}>
					{isProcessing ? "Processing..." : "Pay with Card"}
				</button>
				{errorMessage && <div className="error">{errorMessage}</div>}
			</form>
		</div>
	);
};

export default Payment;
