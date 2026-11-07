// What the buyer's current car might be worth against a new one.
//
// Most people buying a car are also getting rid of one, and the finance
// panel priced every vehicle as though they were not. A rough value for the
// old car is the difference between a monthly figure that fits and one that
// does not, so the panel needs at least a ballpark.
//
// This is deliberately a rule of thumb, not a valuation: a fixed yearly loss
// of value, adjusted for miles and condition, shown as a range so nobody
// mistakes it for an offer.

// Cars lose roughly 15% of their value each year on average.
const YEARLY_RETAINED = 0.85;

// Around 12,000 miles a year is normal. Every 1,000 miles above or below the
// expected figure moves the value by about half a percent, held to ±25%
// so a very high or very low odometer cannot drive the estimate to nonsense.
const EXPECTED_MILES_PER_YEAR = 12000;
const PER_THOUSAND_MILES = 0.005;
const MILEAGE_LIMIT = 0.25;

export const CONDITIONS = [
  { id: "excellent", label: "Excellent", factor: 1.05 },
  { id: "good", label: "Good", factor: 1 },
  { id: "fair", label: "Fair", factor: 0.88 },
  { id: "poor", label: "Poor", factor: 0.7 },
];

// How wide the range is either side of the middle figure. A dealer will
// inspect the car and land somewhere in here, rarely on the exact number.
const SPREAD = 0.08;

/**
 * A low-mid-high estimate for a car bought for `originalPrice` in `year`,
 * now showing `mileage` miles, in the given condition. Null when the inputs
 * cannot support a figure.
 */
export function estimateTradeIn(
  { originalPrice, year, mileage, condition },
  currentYear = new Date().getFullYear()
) {
  const price = Number(originalPrice);
  const built = Number.parseInt(year, 10);
  const miles = Number(mileage);
  const grade = CONDITIONS.find((option) => option.id === condition);

  if (!(price > 0) || !Number.isFinite(built) || built > currentYear) return null;
  if (!(miles >= 0) || !grade) return null;

  const age = Math.max(currentYear - built, 0);
  const expectedMiles = Math.max(age, 1) * EXPECTED_MILES_PER_YEAR;
  const mileageShift = Math.min(
    Math.max(((expectedMiles - miles) / 1000) * PER_THOUSAND_MILES, -MILEAGE_LIMIT),
    MILEAGE_LIMIT
  );

  const mid = price * YEARLY_RETAINED ** age * (1 + mileageShift) * grade.factor;

  return {
    low: mid * (1 - SPREAD),
    mid,
    high: mid * (1 + SPREAD),
  };
}

// The details of the buyer's own car, kept between visits the same way the
// finance terms are. Typing the old car in again on every visit, or on every
// vehicle opened, would be the fastest way to make nobody use this.
export const TRADE_IN_KEY = "veloce-trade-in";

export const EMPTY_TRADE_IN = {
  originalPrice: "",
  year: "",
  mileage: "",
  condition: "good",
  applied: false,
};

export function recallTradeIn() {
  try {
    const saved = JSON.parse(localStorage.getItem(TRADE_IN_KEY));

    if (!saved || typeof saved !== "object") return EMPTY_TRADE_IN;

    return {
      originalPrice: typeof saved.originalPrice === "string" ? saved.originalPrice : "",
      year: typeof saved.year === "string" ? saved.year : "",
      mileage: typeof saved.mileage === "string" ? saved.mileage : "",
      condition: CONDITIONS.some((option) => option.id === saved.condition)
        ? saved.condition
        : "good",
      applied: saved.applied === true,
    };
  } catch {
    return EMPTY_TRADE_IN;
  }
}

export function saveTradeIn(tradeIn) {
  try {
    localStorage.setItem(TRADE_IN_KEY, JSON.stringify(tradeIn));
  } catch {
    /* storage unavailable — the estimate still works for this visit */
  }
}
