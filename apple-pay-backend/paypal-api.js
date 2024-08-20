import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// Load environment variables
const { CLIENT_ID, CLIENT_SECRET, MERCHANT_ID } = process.env;

// Base URL for PayPal API
const base = "https://api-m.sandbox.paypal.com"; // Use the sandbox base URL for testing

// Function to generate an access token
export async function generateAccessToken() {
	const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");
	const response = await fetch(`${base}/v1/oauth2/token`, {
		method: "post",
		body: "grant_type=client_credentials",
		headers: {
			Authorization: `Basic ${auth}`,
		},
	});
	const jsonData = await handleResponse(response);
	return jsonData.access_token;
}

// generate client token
export async function generateClientToken() {
	const accessToken = await generateAccessToken();
	const response = await fetch(`${base}/v1/identity/generate-token`, {
		method: "post",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Accept-Language": "en_US",
			"Content-Type": "application/json",
		},
	});
	console.log("response", response.status);
	const jsonData = await handleResponse(response);
	return jsonData.client_token;
}

// Function to generate a PayPal client token
export async function generateClientToken() {
	try {
		const accessToken = await generateAccessToken();
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

	return handleResponse(response);
}

// Function to capture payment for an order
export async function capturePayment(orderId) {
	const accessToken = await generateAccessToken();
	const url = `${base}/v2/checkout/orders/${orderId}/capture`;
	const response = await fetch(url, {
		method: "post",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});

	return handleResponse(response);
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
