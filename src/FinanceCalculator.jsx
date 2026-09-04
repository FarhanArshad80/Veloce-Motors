import React, { useMemo, useState } from "react";
import { formatMoney, monthlyPayment, parsePrice } from "./pricing";

const terms = [24, 36, 48, 60, 72];
const TERMS_KEY = "veloce-finance-terms";

const defaultTerms = { depositPercent: 10, months: 60, apr: 6.9 };

// A buyer's deposit, term and rate belong to the buyer, not to the car. They
// carry across the inventory so comparing two vehicles compares the vehicles
// rather than two different sets of assumptions.
function recallTerms() {
  try {
    const saved = JSON.parse(localStorage.getItem(TERMS_KEY));

    if (!saved || typeof saved !== "object") return defaultTerms;

    return {
      depositPercent: Number(saved.depositPercent) || defaultTerms.depositPercent,
      months: terms.includes(Number(saved.months))
        ? Number(saved.months)
        : defaultTerms.months,
      apr: Number.isFinite(Number(saved.apr)) ? Number(saved.apr) : defaultTerms.apr,
    };
  } catch {
    return defaultTerms;
  }
}

export default function FinanceCalculator({ car }) {
  const [assumptions, setAssumptions] = useState(recallTerms);
  const { depositPercent, months, apr } = assumptions;

  const price = parsePrice(car.price);

  function update(patch) {
    const next = { ...assumptions, ...patch };

    setAssumptions(next);

    try {
      localStorage.setItem(TERMS_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — the figures still work, they just reset */
    }
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
        {terms.map((option) => (
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
