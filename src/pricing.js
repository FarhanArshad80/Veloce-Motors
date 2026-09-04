// Prices live on the vehicle as display strings like "$22,000", which is what
// the cards want to render. Anything that needs to sort, band or amortise
// them has to get back to a number first, and both the inventory filters and
// the finance estimate were doing it — so it lives in one place.
export function parsePrice(price) {
  const digits = String(price).replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(digits);

  return Number.isNaN(value) ? 0 : value;
}

export function formatMoney(amount) {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

// The standard amortising-loan payment. A 0% rate divides the balance flat
// rather than dividing by zero, which is what a 0% promotional offer means
// anyway.
export function monthlyPayment(principal, annualRate, months) {
  if (principal <= 0 || months <= 0) return 0;

  const rate = annualRate / 100 / 12;

  if (rate === 0) return principal / months;

  return (principal * rate) / (1 - (1 + rate) ** -months);
}
