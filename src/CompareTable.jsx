import React, { useEffect } from "react";
import {
  estimateMonthly,
  formatMoney,
  milesPerYear,
  parsePrice,
  pricePerHorsepower,
} from "./pricing";
import { hasNote, noteForCar } from "./notes";

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

// Everything handed over by the end of the term: the deposit plus every
// payment. The cost of credit alone hides how much of each car's price is
// paid up front; this is the one figure that puts the whole deal on a line.
function totalPayableText(car, terms) {
  const price = parsePrice(car.price);
  const monthly = estimateMonthly(price, terms);

  if (monthly <= 0) return "";

  const deposit = (price * terms.depositPercent) / 100;

  return formatMoney(deposit + monthly * terms.months);
}

// The odometer spread over the car's age, which is the fairer way to set
// a two-year-old against a six-year-old: raw mileage alone always favours
// the newer car. Blank when either the mileage or the year is unreadable.
function yearlyMilesText(car) {
  const yearly = milesPerYear(car.mileage, car.year);

  return yearly === null ? "" : `${Math.round(yearly).toLocaleString("en-US")} mi`;
}

// The sticker price spread over the stated output, so a dearer car that
// makes far more power can be seen to be the better buy per horsepower.
// Blank when the price or the power figure is unreadable.
function pricePerHpText(car) {
  const perHp = pricePerHorsepower(car.price, car.power);

  return perHp === null ? "" : `${formatMoney(perHp)}/HP`;
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
    { label: "Total payable", read: (car) => totalPayableText(car, terms), best: "low" },
    { label: "Year", read: (car) => car.year, best: "high" },
    { label: "Type", read: (car) => car.type },
    { label: "Colour", read: (car) => car.color },
    { label: "Mileage", read: (car) => car.mileage, best: "low" },
    { label: "Miles a year", read: yearlyMilesText, best: "low" },
    { label: "Engine", read: (car) => car.engine },
    { label: "Power", read: (car) => car.power, best: "high" },
    { label: "Price per HP", read: pricePerHpText, best: "low" },
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

export default function CompareTable({ cars, financeTerms, notes = {}, onClose, onRemove }) {
  const compareRows = buildRows(financeTerms);
  const rowWinners = compareRows.map((row) => winningIndexes(cars, row));
  // How many rows each vehicle comes out best on, a tally of the highlights
  // that otherwise has to be counted down a column by eye.
  const winCounts = cars.map((_, index) =>
    rowWinners.filter((winners) => winners.has(index)).length
  );
  const markedRows = rowWinners.filter((winners) => winners.size > 0).length;
  // The notes are the reasons behind the shortlist, and the comparison is
  // where the shortlist gets decided — so they belong here, lined up under
  // the specs they were written about. Left out entirely when none of these
  // vehicles has one, rather than adding a row of dashes.
  const showNotes = cars.some((car) => hasNote(notes, car.id));

  // Escape puts the comparison away, as it does the menu and the booking
  // form. Left alone while something is being typed into, where Escape
  // already means "clear this box".
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;

      const target = event.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <section className="compare-panel" aria-label="Vehicle comparison">
      <div className="compare-header">
        <div>
          <p className="eyebrow">Side by side</p>
          <h3>Comparing {cars.length} vehicles</h3>
        </div>

        <button className="compare-close" onClick={onClose} title="Close (Esc)">
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

              {cars.map((car, index) => (
                <th scope="col" key={car.id}>
                  <span className="compare-car-name">{car.name}</span>

                  {markedRows > 0 && (
                    <span className="compare-wins">
                      Best on {winCounts[index]} of {markedRows}
                    </span>
                  )}

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
            {compareRows.map((row, rowIndex) => {
              const winners = rowWinners[rowIndex];

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

            {showNotes && (
              <tr>
                <th scope="row">Your notes</th>

                {cars.map((car) => (
                  <td key={car.id} className="compare-note">
                    {noteForCar(notes, car.id).trim() || "—"}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Said out loud, not tucked into the table's description. Two of these
          rows are figures rather than facts about the vehicle, and a payment
          quoted without the terms behind it is not a number anyone should be
          asked to compare on. */}
      <p className="compare-terms">
        Monthly, cost of credit and total payable estimated on {financeTerms.depositPercent}%
        deposit over {financeTerms.months} months at{" "}
        {financeTerms.apr.toFixed(1)}% APR.
      </p>
    </section>
  );
}
