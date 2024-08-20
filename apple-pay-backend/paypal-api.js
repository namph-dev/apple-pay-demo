import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// Load environment variables
const { CLIENT_ID, CLIENT_SECRET, MERCHANT_ID } = process.env;

// Base URL for PayPal API
// const base = "https://api-m.sandbox.paypal.com"; // Use the sandbox base URL for testing
const base = "https://api-m.paypal.com"; // Use the live base URL for testing

// Function to generate an access token
export async function generateAccessToken() {
	console.log("CLIENT_ID:", CLIENT_ID);
	console.log("CLIENT_SECRET:", CLIENT_SECRET);

	const auth = Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString(
		"base64",
	);
	console.log("Authorization Header:", `Basic ${auth}`);

	const response = await fetch(`${base}/v1/oauth2/token`, {
		method: "post",
		body: "grant_type=client_credentials",
		headers: {
			Authorization: `Basic ${auth}`,
		},
	});

	console.log("Response Status:", response.status);

	const jsonData = await handleResponse(response);
	return jsonData.access_token;
}

// Function to generate a PayPal client token
export async function generateClientToken() {
	try {
		const accessToken = await generateAccessToken();
		console.log("Access Token:", accessToken);

		const response = await fetch(`${base}/v1/identity/generate-token`, {
			method: "post",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Accept-Language": "en_US",
				"Content-Type": "application/json",
			},
		});

		console.log("Response Status:", response.status);

		const jsonData = await handleResponse(response);
		console.log(
			"Client token generated successfully:",
			jsonData.client_token,
		);
		return jsonData.client_token;
	} catch (error) {
		console.error("Error during generateClientToken execution:", error);
		throw error;
	}
}

// Function to create a PayPal order
export async function createOrder(amount) {
	try {
		console.log(
			"Received request to create PayPal order with amount:",
			amount,
		);

		const accessToken = await generateAccessToken();
		console.log("Access Token:", accessToken);

		const purchaseAmount = (amount / 100).toFixed(2); // Convert amount from cents to dollars
		const url = `${base}/v2/checkout/orders`;
		const response = await fetch(url, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				intent: "CAPTURE",
				purchase_units: [
					{
						amount: {
							currency_code: "USD",
							value: purchaseAmount,
						},
						payee: {
							merchant_id: MERCHANT_ID,
						},
					},
				],
			}),
		});

		console.log("Response Status:", response.status);

		return handleResponse(response);
	} catch (error) {
		console.error("Error creating PayPal order on BE:", error);
		throw error;
	}
}

// Function to capture payment for an order
export async function capturePayment(orderId) {
	try {
		const accessToken = await generateAccessToken();
		console.log("Access Token:", accessToken);

		const url = `${base}/v2/checkout/orders/${orderId}/capture`;
		const response = await fetch(url, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		});

		console.log("Response Status:", response.status);

		return handleResponse(response);
	} catch (error) {
		console.error("Error capturing PayPal payment:", error);
		throw error;
	}
}

// Function to handle API responses
async function handleResponse(response) {
	console.log("Response Status:", response.status);
	if (response.status === 200 || response.status === 201) {
		return response.json();
	}

	const errorMessage = await response.text();
	console.error("Error Message:", errorMessage);
	throw new Error(errorMessage);
}
