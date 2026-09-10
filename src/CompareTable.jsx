import React from "react";
import { estimateMonthly, formatMoney, parsePrice } from "./pricing";

// Pulls the leading number out of a display string like "18,420 mi",
// "670 HP" or "$22,000". Values that carry no number at all — "Low
// mileage", "Performance spec" — come back null and simply take no part
// in the comparison rather than being scored as zero.
function parseNumber(value) {
  const digits = String(value ?? "").replace(/[^0-9.]/g, "");

  if (!digits) return null;

  const parsed = Number.parseFloat(digits);

  return Number.isNaN(parsed) ? null : parsed;
}

// What a vehicle costs per month, and what the credit costs over the whole
// term. Both are read from the terms set in the finance panel, so this table
// quotes the same deal the grid behind it does.
function monthlyText(car, terms) {
  const monthly = estimateMonthly(parsePrice(car.price), terms);

  // Nothing to quote rather than a $0 that would read as an offer.
  return monthly > 0 ? `${formatMoney(monthly)}/mo` : "";
}

function creditText(car, terms) {
  const price = parsePrice(car.price);
  const monthly = estimateMonthly(price, terms);

  if (monthly <= 0) return "";

  const financed = price - (price * terms.depositPercent) / 100;

  return formatMoney(monthly * terms.months - financed);
}

// The specs worth lining up. `best` says which end of the row wins; rows
// without it — colour, body style, engine — have no better or worse, so
// they stay unmarked.
//
// The two money rows are the ones people actually decide on: a comparison
// that lists sticker prices and leaves the buyer to work out the payments in
// their head is asking them to do the arithmetic this app already does.
function buildRows(terms) {
  return [
    { label: "Price", read: (car) => car.price, best: "low" },
    { label: "Monthly", read: (car) => monthlyText(car, terms), best: "low" },
    { label: "Cost of credit", read: (car) => creditText(car, terms), best: "low" },
    { label: "Year", read: (car) => car.year, best: "high" },
    { label: "Type", read: (car) => car.type },
    { label: "Colour", read: (car) => car.color },
    { label: "Mileage", read: (car) => car.mileage, best: "low" },
    { label: "Engine", read: (car) => car.engine },
    { label: "Power", read: (car) => car.power, best: "high" },
  ];
}

// Which columns hold the winning figure for this row. Ties all win, so two
// vehicles at the same price both get the mark instead of the first one
// silently taking it.
function winningIndexes(cars, row) {
  if (!row.best) return new Set();

  const numbers = cars.map((car) => parseNumber(row.read(car)));
  const comparable = numbers.filter((value) => value !== null);

  // One figure against nothing is not a comparison worth marking.
  if (comparable.length < 2) return new Set();

  const target =
    row.best === "low" ? Math.min(...comparable) : Math.max(...comparable);

  // Every vehicle sharing the figure would make the mark meaningless.
  if (comparable.every((value) => value === target)) return new Set();

  return new Set(
    numbers.reduce((winners, value, index) => {
      if (value === target) winners.push(index);
      return winners;
    }, [])
  );
}

export default function CompareTable({ cars, financeTerms, onClose, onRemove }) {
  const compareRows = buildRows(financeTerms);

  return (
    <section className="compare-panel" aria-label="Vehicle comparison">
      <div className="compare-header">
        <div>
          <p className="eyebrow">Side by side</p>
          <h3>Comparing {cars.length} vehicles</h3>
        </div>

        <button className="compare-close" onClick={onClose}>
          Close ✕
        </button>
      </div>

      <div className="compare-scroll">
        <table className="compare-table">
          <caption className="visually-hidden">
            Specifications of the shortlisted vehicles, compared column by
            column.
          </caption>

          <thead>
            <tr>
              <th scope="col">Specification</th>

              {cars.map((car) => (
                <th scope="col" key={car.id}>
                  <span className="compare-car-name">{car.name}</span>

                  <button
                    className="compare-remove"
                    onClick={() => onRemove(car.id)}
                    aria-label={`Remove ${car.name} from the comparison`}
                  >
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {compareRows.map((row) => {
              const winners = winningIndexes(cars, row);

              return (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>

                  {cars.map((car, index) => (
                    <td
                      key={car.id}
                      className={winners.has(index) ? "compare-best" : ""}
                    >
                      {row.read(car) || "—"}

                      {winners.has(index) && (
                        <span className="visually-hidden"> — best of these</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Said out loud, not tucked into the table's description. Two of these
          rows are figures rather than facts about the vehicle, and a payment
          quoted without the terms behind it is not a number anyone should be
          asked to compare on. */}
      <p className="compare-terms">
        Monthly and cost of credit estimated on {financeTerms.depositPercent}%
        deposit over {financeTerms.months} months at{" "}
        {financeTerms.apr.toFixed(1)}% APR.
      </p>
    </section>
  );
}
