import React, { useMemo } from "react";
import {
  DEFAULT_FINANCE_TERMS,
  FINANCE_TERM_OPTIONS,
  formatMoney,
  monthlyPayment,
  parsePrice,
  termTradeoff,
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
      // Everything handed over by the end of the term, deposit included:
      // the figure to set against paying the sticker price outright.
      total: deposit + monthly * months,
    };
  }, [price, depositPercent, apr, months]);

  // What the chosen term costs against the shortest one on offer. Null on
  // that shortest term, where there is nothing to compare.
  // Rebuilt from the loose parts rather than handed `terms`, so this reads
  // the same three values the estimate above it does and moves when they do.
  const tradeoff = useMemo(
    () => termTradeoff(price, { depositPercent, months, apr }),
    [price, depositPercent, apr, months]
  );

  // The terms are remembered across visits and shared by every card, so a
  // few experiments with the sliders stick to the whole grid. This is the
  // way back to the figures the page started on, offered only once they
  // have actually been moved.
  const isDefault =
    depositPercent === DEFAULT_FINANCE_TERMS.depositPercent &&
    months === DEFAULT_FINANCE_TERMS.months &&
    apr === DEFAULT_FINANCE_TERMS.apr;

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

      {!isDefault && (
        <button
          type="button"
          className="finance-reset"
          onClick={() => onChangeTerms({ ...DEFAULT_FINANCE_TERMS })}
        >
          Reset to {DEFAULT_FINANCE_TERMS.depositPercent}% deposit ·{" "}
          {DEFAULT_FINANCE_TERMS.months} months ·{" "}
          {DEFAULT_FINANCE_TERMS.apr.toFixed(1)}% APR
        </button>
      )}

      {/* Directly under the buttons that cause it. The cost of credit is in
          the summary below and moves at the same moment, which is exactly
          why it goes unnoticed: it is a number that was already there. This
          is the sentence. */}
      {tradeoff && (
        <p className="finance-tradeoff">
          Against {tradeoff.baseline} months, that is{" "}
          <strong>{formatMoney(tradeoff.monthlySaved)}</strong> less a month
          {tradeoff.extraInterest >= 1 ? (
            <>
              {" and "}
              <strong>{formatMoney(tradeoff.extraInterest)}</strong> more in
              credit.
            </>
          ) : (
            " at no extra cost in credit."
          )}
        </p>
      )}

      <div className="finance-summary">
        <div>
          <span>Amount financed</span>
          <strong>{formatMoney(estimate.financed)}</strong>
        </div>

        <div>
          <span>Cost of credit</span>
          <strong>{formatMoney(estimate.interest)}</strong>
        </div>

        <div className="finance-summary-total">
          <span>Total payable</span>
          <strong>{formatMoney(estimate.total)}</strong>
        </div>
      </div>

      <p className="finance-disclaimer">
        Illustration only — not a quote. Excludes taxes, fees and any offer
        your lender may actually make.
      </p>
    </section>
  );
}
