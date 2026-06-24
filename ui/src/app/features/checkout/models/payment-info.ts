export interface PaymentInfo {
  method: 'card' | 'paypal' | 'placeholder';
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export function emptyPayment(): PaymentInfo {
  return {
    method: 'placeholder',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  };
}

export function isPaymentValid(payment: PaymentInfo): boolean {
  if (payment.method === 'placeholder') {
    return true;
  }
  if (payment.method === 'paypal') {
    return true;
  }
  // Card validation
  return (
    payment.cardName.trim().length >= 2 &&
    payment.cardNumber.replace(/\s/g, '').length === 16 &&
    /^\d{2}\/\d{2}$/.test(payment.expiry) &&
    payment.cvv.length >= 3
  );
}
