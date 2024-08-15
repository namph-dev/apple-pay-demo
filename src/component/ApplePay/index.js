import React, { useState, useEffect } from "react";
import {
	PaymentRequestButtonElement,
	useStripe,
	useElements,
	CardElement,
} from "@stripe/react-stripe-js";

const Payment = () => {
	const stripe = useStripe();
	const elements = useElements();
	const [paymentRequest, setPaymentRequest] = useState(null);
	const [clientSecret, setClientSecret] = useState("");
	const [errorMessage, setErrorMessage] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);

	useEffect(() => {
		// Gửi yêu cầu tới backend để tạo PaymentIntent
		fetch(
			"https://1ced-113-23-53-236.ngrok-free.app/create-payment-intent",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ amount: 5000 }), // Số tiền thanh toán tính bằng cent (5000 cent = $50)
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
							amount: 5000,
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

	const handleSubmit = async (event) => {
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

	return (
		<div>
			<h2>Apple Pay & Card Payment Demo</h2>
			{paymentRequest ? (
				<PaymentRequestButtonElement options={{ paymentRequest }} />
			) : (
				<p>Apple Pay is not available on this device/browser.</p>
			)}

			<hr />

			<form onSubmit={handleSubmit}>
				<CardElement />
				<button type="submit" disabled={!stripe || isProcessing}>
					{isProcessing ? "Processing..." : "Pay"}
				</button>
				{errorMessage && <div className="error">{errorMessage}</div>}
			</form>
		</div>
	);
};

export default Payment;
