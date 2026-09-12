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

// The range each slider actually offers. Stored values are held to it, so a
// figure edited by hand — or left behind by a build where the slider went
// further — cannot put the panel into a state its own controls could never
// produce.
export const DEPOSIT_RANGE = { min: 0, max: 50 };
export const APR_RANGE = { min: 0, max: 15 };

// Nothing is a real answer. Reading a stored number with `Number(x) || fallback`
// throws away every zero it is given, which for a deposit means the one
// choice a buyer might most want remembered — paying nothing up front — was
// the single value that could not survive a reload.
function clampNumber(value, { min, max }, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(Math.max(number, min), max);
}

export function recallFinanceTerms() {
  try {
    const saved = JSON.parse(localStorage.getItem(FINANCE_TERMS_KEY));

    if (!saved || typeof saved !== "object") return DEFAULT_FINANCE_TERMS;

    return {
      depositPercent: clampNumber(
        saved.depositPercent,
        DEPOSIT_RANGE,
        DEFAULT_FINANCE_TERMS.depositPercent
      ),
      months: FINANCE_TERM_OPTIONS.includes(Number(saved.months))
        ? Number(saved.months)
        : DEFAULT_FINANCE_TERMS.months,
      apr: clampNumber(saved.apr, APR_RANGE, DEFAULT_FINANCE_TERMS.apr),
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

// What the longer term actually costs.
//
// The term buttons are the one control on the panel that only ever looks
// like good news: press 72 and the monthly figure above them drops, which is
// the number the whole page is built around. What it does to the cost of
// credit is three rows further down, changes at the same moment, and is easy
// to read as though it had always said that.
//
// The two are the same decision. Stretching the term buys a smaller payment
// with a larger total, and a buyer is entitled to see both halves of that
// sentence in one place — measured against the shortest term on offer, which
// is the honest baseline: it is the deal they could have had.
//
// Null on the shortest term itself, where there is no trade to describe, and
// on anything without a usable price.
export function termTradeoff(price, terms, baseline = FINANCE_TERM_OPTIONS[0]) {
  if (price <= 0 || terms.months <= baseline) return null;

  const financed = price - (price * terms.depositPercent) / 100;
  const chosen = monthlyPayment(financed, terms.apr, terms.months);
  const shortest = monthlyPayment(financed, terms.apr, baseline);

  if (chosen <= 0 || shortest <= 0) return null;

  return {
    baseline,
    monthlySaved: shortest - chosen,
    // Interest rather than total paid: the amount financed is the same
    // either way, so the difference between the two totals is entirely the
    // cost of borrowing for longer.
    extraInterest: chosen * terms.months - shortest * baseline,
  };
}

// What a card advertises: the price less the deposit, amortised over the
// chosen term. Zero for anything without a usable price, because a "$0/mo"
// badge reads as an offer rather than as missing data.
export function estimateMonthly(price, terms = DEFAULT_FINANCE_TERMS) {
  if (price <= 0) return 0;

  const { depositPercent, months, apr } = terms;

  return monthlyPayment(price - (price * depositPercent) / 100, apr, months);
}
