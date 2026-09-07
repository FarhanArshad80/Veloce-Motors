// Prices live on the vehicle as display strings like "$22,000", which is what
// the cards want to render. Anything that needs to sort, band or amortise
// them has to get back to a number first, and both the inventory filters and
// the finance estimate were doing it — so it lives in one place.
export function parsePrice(price) {
  const digits = String(price).replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(digits);

  return Number.isNaN(value) ? 0 : value;
}

// Mileage lives on the vehicle the same way price does — a display string
// like "18,420 mi" — so anything that wants to band or compare it needs the
// number back out first.
export function parseMileage(mileage) {
  const digits = String(mileage).replace(/[^0-9.]/g, "");
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

// A buyer's deposit, term and rate belong to the buyer, not to any one car.
// They used to live inside the finance panel, which meant only the vehicle
// currently open in the sidebar knew about them. Now they live here, so the
// panel and every card in the grid quote on the same assumptions — two cars
// priced under two different deposits is not a comparison.
export const FINANCE_TERMS_KEY = "veloce-finance-terms";
export const FINANCE_TERM_OPTIONS = [24, 36, 48, 60, 72];
export const DEFAULT_FINANCE_TERMS = { depositPercent: 10, months: 60, apr: 6.9 };

export function recallFinanceTerms() {
  try {
    const saved = JSON.parse(localStorage.getItem(FINANCE_TERMS_KEY));

    if (!saved || typeof saved !== "object") return DEFAULT_FINANCE_TERMS;

    return {
      depositPercent:
        Number(saved.depositPercent) || DEFAULT_FINANCE_TERMS.depositPercent,
      months: FINANCE_TERM_OPTIONS.includes(Number(saved.months))
        ? Number(saved.months)
        : DEFAULT_FINANCE_TERMS.months,
      apr: Number.isFinite(Number(saved.apr))
        ? Number(saved.apr)
        : DEFAULT_FINANCE_TERMS.apr,
    };
  } catch {
    return DEFAULT_FINANCE_TERMS;
  }
}

export function saveFinanceTerms(terms) {
  try {
    localStorage.setItem(FINANCE_TERMS_KEY, JSON.stringify(terms));
  } catch {
    /* storage unavailable — the figures still work, they just reset */
  }
}

// What a card advertises: the price less the deposit, amortised over the
// chosen term. Zero for anything without a usable price, because a "$0/mo"
// badge reads as an offer rather than as missing data.
export function estimateMonthly(price, terms = DEFAULT_FINANCE_TERMS) {
  if (price <= 0) return 0;

  const { depositPercent, months, apr } = terms;

  return monthlyPayment(price - (price * depositPercent) / 100, apr, months);
}
