import React, { useMemo } from "react";
import {
  FINANCE_TERM_OPTIONS,
  formatMoney,
  monthlyPayment,
  parsePrice,
} from "./pricing";

// The assumptions are held by the inventory above rather than here, so moving
// a slider re-prices the whole grid and not just the vehicle on screen.
export default function FinanceCalculator({ car, terms, onChangeTerms }) {
  const { depositPercent, months, apr } = terms;

  const price = parsePrice(car.price);

  function update(patch) {
    onChangeTerms({ ...terms, ...patch });
  }

  const estimate = useMemo(() => {
    const deposit = (price * depositPercent) / 100;
    const financed = price - deposit;
    const monthly = monthlyPayment(financed, apr, months);

    return {
      deposit,
      financed,
      monthly,
      interest: monthly * months - financed,
    };
  }, [price, depositPercent, apr, months]);

  // Without a price there is nothing to amortise, and a "$0/mo" figure would
  // read as an offer rather than as missing data.
  if (price <= 0) return null;

  return (
    <section className="finance-panel">
      <div className="finance-header">
        <div>
          <span>Estimated monthly</span>
          <strong>{formatMoney(estimate.monthly)}</strong>
        </div>

        <p className="finance-terms">
          {months} months · {apr.toFixed(1)}% APR
        </p>
      </div>

      <label className="finance-control">
        <span>
          Deposit
          <em>
            {depositPercent}% · {formatMoney(estimate.deposit)}
          </em>
        </span>

        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={depositPercent}
          onChange={(event) =>
            update({ depositPercent: Number(event.target.value) })
          }
        />
      </label>

      <label className="finance-control">
        <span>
          Rate
          <em>{apr.toFixed(1)}% APR</em>
        </span>

        <input
          type="range"
          min="0"
          max="15"
          step="0.1"
          value={apr}
          onChange={(event) => update({ apr: Number(event.target.value) })}
        />
      </label>

      <div className="finance-terms-row">
        {FINANCE_TERM_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={option === months ? "finance-term active" : "finance-term"}
            onClick={() => update({ months: option })}
            aria-pressed={option === months}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="finance-summary">
        <div>
          <span>Amount financed</span>
          <strong>{formatMoney(estimate.financed)}</strong>
        </div>

        <div>
          <span>Cost of credit</span>
          <strong>{formatMoney(estimate.interest)}</strong>
        </div>
      </div>

      <p className="finance-disclaimer">
        Illustration only — not a quote. Excludes taxes, fees and any offer
        your lender may actually make.
      </p>
    </section>
  );
}
