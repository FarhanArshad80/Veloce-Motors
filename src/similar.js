import { parseMileage, parsePrice } from "./pricing";

// What else in the showroom is worth a look, given the vehicle already open.
//
// The sidebar was a dead end. Everything on it described one car, and the
// only way to ask "what else is near this?" was to close it, go back to the
// grid and rebuild the search by hand — a budget band, a category chip and a
// mileage limit, all reverse-engineered from the car you were already
// looking at. Most people simply did not bother, which meant the second-best
// vehicle in the inventory never got seen.
//
// Closeness is scored as a distance, so the smallest number wins.

// Price is the strongest signal of all: a buyer looking at a $22,000 sedan is
// not in the market for a $90,000 one whatever else the two share. Measured
// as a share of the larger figure so it stays meaningful across the range —
// $4,000 apart is a different thing at $20,000 than it is at $90,000.
const PRICE_WEIGHT = 1;

// A different body style is a real difference but not a disqualifying one:
// somebody looking at an SUV may well take a wagon, and the whole point of
// this row is to show a vehicle they would not have searched for. Set below
// the price weight so a close-priced coupe still outranks a distant SUV.
const TYPE_PENALTY = 0.45;

// Condition, in the one number the inventory actually carries.
const MILEAGE_WEIGHT = 0.35;

// Model year barely moves the decision next to the three above, but it
// breaks ties in the direction people actually lean.
const YEAR_WEIGHT = 0.04;

// Enough to be an alternative, few enough to stay a suggestion rather than a
// second grid growing under the first.
const SUGGESTIONS = 3;

// A vehicle with no usable figure should not be scored as though it were
// free, or as though it had just left the factory. Both sides have to carry a
// number for the comparison to say anything, and where one does not the gap
// falls back to a middling penalty — neither a match nor a disqualification.
const UNKNOWN_GAP = 0.5;

function relativeGap(left, right) {
  if (left <= 0 || right <= 0) return UNKNOWN_GAP;

  return Math.abs(left - right) / Math.max(left, right);
}

function distance(car, other) {
  const priceGap = relativeGap(parsePrice(car.price), parsePrice(other.price));
  const mileageGap = relativeGap(parseMileage(car.mileage), parseMileage(other.mileage));
  const sameType = (car.type || "Other") === (other.type || "Other");
  const yearGap = Math.abs((car.year || 0) - (other.year || 0));

  return (
    priceGap * PRICE_WEIGHT +
    mileageGap * MILEAGE_WEIGHT +
    (sameType ? 0 : TYPE_PENALTY) +
    // Capped, so a 1998 listing among 2020s cars cannot swamp the three
    // signals that actually describe the purchase.
    Math.min(yearGap, 10) * YEAR_WEIGHT
  );
}

export function similarCars(car, cars, limit = SUGGESTIONS) {
  if (!car) return [];

  return cars
    .filter((other) => other.id !== car.id)
    .map((other) => ({ car: other, score: distance(car, other) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((entry) => entry.car);
}
