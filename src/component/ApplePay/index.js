import React, { useState, useEffect } from "react";
import {
	PaymentRequestButtonElement,
	useStripe,
} from "@stripe/react-stripe-js";

const Payment = () => {
	const stripe = useStripe();
	const [paymentRequest, setPaymentRequest] = useState(null);
	const [clientSecret, setClientSecret] = useState("");

	useEffect(() => {
		// Gửi yêu cầu tới backend để tạo PaymentIntent
		fetch("http://localhost:3001/create-payment-intent", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ amount: 5000 }), // Số tiền thanh toán tính bằng cent (5000 cent = $50)
		})
			.then((res) => res.json())
			.then((data) => {
				console.log("Client secret received:", data.clientSecret);
				setClientSecret(data.clientSecret);

				if (stripe) {
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
							console.log("canMakePayment result:", result); // Thêm log ở đây

							if (result) {
								setPaymentRequest(pr);
							} else {
								console.warn(
									"PaymentRequest not supported or no valid payment method available.",
								);
								// Nếu không khả dụng, không hiển thị nút hoặc hiển thị thông báo khác
								alert(
									"Apple Pay is not available on this device/browser. Please ensure that you have a valid payment method set up in Wallet and try again.",
								);
							}
						})
						.catch((error) => {
							console.error("Error in canMakePayment:", error); // Log lỗi nếu có
						});
				}
			})
			.catch((error) => console.error("Error:", error));
	}, [stripe]);

	if (!paymentRequest) {
		// Nếu paymentRequest chưa được khởi tạo, không render nút
		return <p>Apple Pay is not available on this device/browser.</p>;
	}

	return (
		<div>
			<h2>Apple Pay Demo</h2>
			<PaymentRequestButtonElement options={{ paymentRequest }} />
		</div>
	);
};

export default Payment;
