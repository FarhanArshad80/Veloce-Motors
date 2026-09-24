import React, { useMemo, useState } from "react";
import FinanceCalculator from "./FinanceCalculator";
import TestDriveForm from "./TestDriveForm";
import { bookingWhen } from "./bookings";
import { similarCars } from "./similar";
import { NOTE_LIMIT } from "./notes";
import { estimateMonthly, formatMoney, parsePrice } from "./pricing";

export default function CarDetails({
  car, booking, onBookingsChange, financeTerms, onChangeFinanceTerms,
  inventory = [], onSelect, note = "", onNoteChange,
  shortlisted = false, onToggleShortlist,
  position = null, resultCount = 0, onStep,
}) {
  const [bookingOpen, setBookingOpen] = useState(false);

  // Recomputed when the inventory changes, so a vehicle removed from the
  // grid stops being offered as an alternative to the one still open.
  const alternatives = useMemo(
    () => similarCars(car, inventory),
    [car, inventory]
  );

  function handleImageError(event) {
    event.currentTarget.style.display = "none";
    event.currentTarget.parentElement.classList.add(
      "details-image-fallback"
    );
  }

  return (
    <article className="car-details">
      <div className="details-image-wrapper">
        <img
          src={
            car.image ||
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85"
          }
          alt={`${car.name} vehicle`}
          className="details-image"
          onError={handleImageError}
        />

        <div className="details-image-fallback-content">
          <span>VELOCE MOTORS</span>
          <strong>{car.name}</strong>
        </div>

        <div className="details-image-overlay"></div>

        <div className="details-badge">
          Available now
        </div>
      </div>

      <div className="details-content">
        {/* Going through a filtered grid one car at a time meant reading the
            panel, scrolling back up to find the card after the one just
            read, and scrolling down again — for every vehicle. Stepping from
            here keeps the reading in one place. Hidden when this car is not
            in the grid, or is the only thing in it. */}
        {onStep && position !== null && resultCount > 1 && (
          <nav className="details-stepper" aria-label="Step through results">
            <button
              type="button"
              onClick={() => onStep(-1)}
              disabled={position === 0}
              aria-label="Previous vehicle in the results"
            >
              ←
            </button>

            <span>
              {position + 1} of {resultCount}
            </span>

            <button
              type="button"
              onClick={() => onStep(1)}
              disabled={position === resultCount - 1}
              aria-label="Next vehicle in the results"
            >
              →
            </button>
          </nav>
        )}

        <div className="details-header">
          <div>
            <p className="details-eyebrow">
              Selected vehicle
            </p>

            <h2>{car.name}</h2>

            <p className="details-subtitle">
              {car.year || "2024"}{" "}
              {car.type || "Premium"} ·{" "}
              {car.color || "Premium finish"}
            </p>
          </div>

          <div className="details-header-side">
            <div className="details-status">
              ● In stock
            </div>

            {/* The star lives on the card in the grid, which is where a
                vehicle is dismissed from. This panel is where one is
                actually decided on — the specs, the payment and the note
                are all here — and the only way to record that decision was
                to close the panel, find the card again and press the star
                on it. A shortlist built somewhere other than where the
                thinking happens is a shortlist that misses things. */}
            {onToggleShortlist && (
              <button
                type="button"
                className={shortlisted ? "details-save saved" : "details-save"}
                onClick={() => onToggleShortlist(car.id)}
                aria-pressed={shortlisted}
                aria-label={
                  shortlisted
                    ? `Remove ${car.name} from your shortlist`
                    : `Save ${car.name} to your shortlist`
                }
              >
                <span aria-hidden="true">{shortlisted ? "★" : "☆"}</span>
                {shortlisted ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>

        <div className="details-price-row">
          <div>
            <span>Starting price</span>
            <strong>{car.price || "Price on request"}</strong>
          </div>

          <div className="details-rating">
            <span>★</span>
            <strong>4.9</strong>
            <small>Owner rating</small>
          </div>
        </div>

        <p className="details-description">
          {car.description ||
            "A carefully selected premium vehicle offering comfort, quality, style and dependable performance."}
        </p>

        <FinanceCalculator
          car={car}
          terms={financeTerms}
          onChangeTerms={onChangeFinanceTerms}
        />

        <div className="details-specifications">
          <div>
            <span>Year</span>
            <strong>{car.year || "2024"}</strong>
          </div>

          <div>
            <span>Mileage</span>
            <strong>{car.mileage || "Low mileage"}</strong>
          </div>

          <div>
            <span>Engine</span>
            <strong>{car.engine || "Premium tuned"}</strong>
          </div>

          <div>
            <span>Power</span>
            <strong>{car.power || "Performance spec"}</strong>
          </div>
        </div>

        {/* Under the specs, because it is usually a reaction to them — "only
            two owners but the mileage is high for the year" is a note written
            with that grid in front of you. */}
        <section className="details-note">
          <label htmlFor="car-note">Your notes</label>

          <textarea
            id="car-note"
            rows={3}
            value={note}
            maxLength={NOTE_LIMIT}
            onChange={(event) => onNoteChange?.(car.id, event.target.value)}
            placeholder="Ask about the service history…"
          />

          <p className="details-note-hint">
            Kept on this device, against this vehicle. Nobody at the showroom
            sees it.
          </p>
        </section>

        {/* The button says what pressing it will do. With a drive already in
            the diary that is not "book" — it is "look at the one you have",
            and the date is the part worth reading anyway. */}
        <button
          className="details-action-button"
          onClick={() => setBookingOpen(true)}
        >
          {booking ? `Test drive · ${bookingWhen(booking)}` : "Book a test drive"}
          <span>→</span>
        </button>

        {/* Below the booking button rather than above it: this is where to
            go if the answer to this vehicle was no, and putting it in front
            of the call to action argues against the car the page is for. */}
        {onSelect && alternatives.length > 0 && (
          <section className="details-similar">
            <h3>You might also like</h3>

            <ul>
              {alternatives.map((option) => {
                const monthly = estimateMonthly(parsePrice(option.price), financeTerms);

                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(option)}
                      aria-label={`View ${option.name}`}
                    >
                      {option.image && (
                        <img src={option.image} alt="" loading="lazy" />
                      )}

                      <span className="similar-copy">
                        <strong>{option.name}</strong>

                        <small>
                          {option.year || "—"} · {option.type || "Other"}
                          {option.mileage ? ` · ${option.mileage}` : ""}
                        </small>
                      </span>

                      <span className="similar-price">
                        <strong>{option.price || "On request"}</strong>

                        {/* Quoted on the same terms as everything else on
                            the page, or left out entirely — a car with no
                            price has no payment, and "$0/mo" reads as an
                            offer. */}
                        {monthly > 0 && <small>{formatMoney(monthly)}/mo</small>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {bookingOpen && (
          <TestDriveForm
            car={car}
            onClose={() => setBookingOpen(false)}
            onBookingsChange={onBookingsChange}
          />
        )}
      </div>
    </article>
  );
}