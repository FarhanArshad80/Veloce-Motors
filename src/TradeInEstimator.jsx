import React from "react";
import { formatMoney } from "./pricing";
import { CONDITIONS, estimateTradeIn } from "./tradein";

// The buyer's current car, folded away until it is wanted: plenty of buyers
// have nothing to trade, and four empty fields would crowd the panel for them.
export default function TradeInEstimator({ value, onChange }) {
  const estimate = estimateTradeIn(value);

  function update(patch) {
    onChange({ ...value, ...patch });
  }

  return (
    <details className="tradein">
      <summary>Trading in a car?</summary>

      <div className="tradein-fields">
        <label>
          <span>Year</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="2019"
            value={value.year}
            onChange={(event) => update({ year: event.target.value })}
          />
        </label>

        <label>
          <span>Mileage</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="45000"
            value={value.mileage}
            onChange={(event) => update({ mileage: event.target.value })}
          />
        </label>

        <label>
          <span>Price when new ($)</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="30000"
            value={value.originalPrice}
            onChange={(event) => update({ originalPrice: event.target.value })}
          />
        </label>

        <label>
          <span>Condition</span>
          <select
            value={value.condition}
            onChange={(event) => update({ condition: event.target.value })}
          >
            {CONDITIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* A range, never a single figure: one number reads as an offer. */}
      {estimate && (
        <p className="tradein-estimate">
          Worth roughly{" "}
          <strong>
            {formatMoney(estimate.low)} – {formatMoney(estimate.high)}
          </strong>
        </p>
      )}
    </details>
  );
}
