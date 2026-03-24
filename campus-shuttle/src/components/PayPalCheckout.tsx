import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalCheckoutProps {
	amount: number;
	currency?: string;
	onSuccess: (details: any) => void;
	onCancel?: () => void;
}

const PayPalCheckout: React.FC<PayPalCheckoutProps> = ({ amount, currency = 'LKR', onSuccess, onCancel }) => {
	// Use PayPal client ID from environment variable
	const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

	return (
		<PayPalScriptProvider options={{ clientId, ["client-id"]: clientId, currency }}>
			<PayPalButtons
				style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' }}
				createOrder={(data, actions) => {
					return actions.order.create({
						intent: 'CAPTURE',
						purchase_units: [
							{
								amount: {
									value: amount.toFixed(2),
									currency_code: currency
								}
							}
						]
					});
				}}
				onApprove={async (data, actions) => {
					if (actions.order) {
						const details = await actions.order.capture();
						onSuccess(details);
					}
				}}
				onCancel={onCancel}
			/>
		</PayPalScriptProvider>
	);
};

export default PayPalCheckout;
