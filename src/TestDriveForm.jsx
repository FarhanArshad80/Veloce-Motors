import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  addBooking,
  bookingForCar,
  recallBookings,
  removeBooking,
  saveBookings,
  slotTaken,
} from "./bookings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The showroom's hours, not the visitor's. Slots are wide enough to include
// the drive itself and the paperwork either side of it.
const SLOTS = ["09:30", "11:00", "13:30", "15:00", "16:30"];
const CLOSED_DAYS = [0]; // Sunday
const DAYS_AHEAD = 14;
const NOTICE_DAYS = 1;

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Dates are built and compared in local time throughout. toISOString would
// shift the whole calendar by a day for anyone west of UTC, so the key is
// assembled from the local parts instead.
function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

// The next fortnight of days the showroom is actually open, starting far
// enough out that nobody books a car that has not been prepared yet.
function openDays(from = new Date()) {
  const days = [];

  for (let ahead = NOTICE_DAYS; days.length < DAYS_AHEAD; ahead += 1) {
    const date = new Date(from);

    date.setDate(from.getDate() + ahead);

    if (CLOSED_DAYS.includes(date.getDay())) continue;

    days.push({
      key: dateKey(date),
      weekday: DAY_LABEL[date.getDay()],
      day: date.getDate(),
      month: MONTH_LABEL[date.getMonth()],
    });
  }

  return days;
}

function slotLabel(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
    hours < 12 ? "am" : "pm"
  }`;
}

export default function TestDriveForm({ car, onClose, onBookingsChange }) {
  const days = useMemo(() => openDays(), []);

  // Read when the dialog opens rather than held above it, so the one booking
  // that matters here — this car's — is always the stored truth and not a
  // copy that went stale while the panel sat open.
  const [bookings, setBookings] = useState(recallBookings);

  const existing = car ? bookingForCar(bookings, car.id) : null;

  const [day, setDay] = useState(days[0]?.key || "");
  const [slot, setSlot] = useState(SLOTS[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [booked, setBooked] = useState(false);

  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Opening a dialog and leaving focus behind it strands anyone not using a
  // mouse on a page they can no longer see.
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const chosenDay = days.find((option) => option.key === day);

  function handleSubmit(event) {
    event.preventDefault();

    const next = {};

    if (name.trim().length < 2) next.name = "Tell us who to ask for.";
    if (!EMAIL_RE.test(email.trim())) next.email = "We need a working email to confirm.";
    // Phone formats vary far too much between countries to validate beyond
    // "there is a plausible number of digits here".
    if (phone.replace(/\D/g, "").length < 7) next.phone = "A number we can reach you on.";
    if (!day) next.day = "Pick a day.";

    // The showroom can only hand over one set of keys at a time, and so can
    // the visitor only drive one car at a time.
    if (day && slotTaken(bookings, day, slot)) {
      next.slot = "You already have a car booked for that slot.";
    }

    setErrors(next);

    if (Object.keys(next).length) return;

    // The confirmation itself still goes nowhere — there is no diary at the
    // showroom end yet. What is written down here is the appointment, so the
    // visitor has something to come back to and something to cancel.
    const booking = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      carId: car ? car.id : null,
      carName: car ? car.name : null,
      day,
      slot,
    };

    persist(addBooking(bookings, booking));
    setBooked(true);
  }

  function persist(next) {
    setBookings(next);
    saveBookings(next);
    // The grid behind this dialog marks the cars that are booked, so it has
    // to hear about it rather than wait for a reload.
    onBookingsChange?.(next);
  }

  function cancelExisting() {
    if (!existing) return;

    persist(removeBooking(bookings, existing.id));
    setBooked(false);
  }

  const dayOf = (key) => days.find((option) => option.key === key);

  function bookingText(booking) {
    const when = dayOf(booking.day);

    return when
      ? `${when.weekday} ${when.day} ${when.month} at ${slotLabel(booking.slot)}`
      : `${booking.day} at ${slotLabel(booking.slot)}`;
  }

  return (
    <div className="booking-backdrop" onMouseDown={onClose}>
      <div
        className="booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        ref={dialogRef}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="booking-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {booked ? (
          <div className="booking-done" role="status">
            <span className="booking-tick">✓</span>

            <h3 id="booking-title">You're booked in</h3>

            <p>
              {chosenDay
                ? `${chosenDay.weekday} ${chosenDay.day} ${chosenDay.month} at ${slotLabel(slot)}`
                : slotLabel(slot)}
              {car ? `, in the ${car.name}.` : "."}
            </p>

            <p className="booking-fine">
              Kept on this device, so it is here when you come back — and can
              be cancelled from the vehicle whenever you need to.
            </p>

            <p className="booking-fine">
              A confirmation is on its way to {email.trim()}. Bring your
              licence — we cannot hand over the keys without it.
            </p>

            <button className="details-action-button" onClick={onClose}>
              Done
              <span>→</span>
            </button>
          </div>
        ) : existing ? (
          /* Reopening the dialog on a car that is already booked should not
             present an empty form. The visitor is here to check the time or
             to call it off, and offering them a second identical booking is
             the one thing they are certainly not here for. */
          <div className="booking-done" role="status">
            <span className="booking-tick">✓</span>

            <h3 id="booking-title">Already booked</h3>

            <p>
              {bookingText(existing)}
              {car ? `, in the ${car.name}.` : "."}
            </p>

            <p className="booking-fine">
              Bring your licence — we cannot hand over the keys without it.
            </p>

            <button className="details-action-button" onClick={onClose}>
              Keep it
              <span>→</span>
            </button>

            <button
              type="button"
              className="booking-cancel"
              onClick={cancelExisting}
            >
              Cancel this test drive
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p className="details-eyebrow">Test drive</p>

            <h3 id="booking-title">
              {car ? `Take the ${car.name} out` : "Book a test drive"}
            </h3>

            <p className="booking-intro">
              {car
                ? `${car.year || ""} ${car.type || ""} · ${car.price || "Price on request"}`
                : "Pick a slot and we'll have the car ready and warm."}
            </p>

            <fieldset className="booking-days">
              <legend>Which day?</legend>

              <div className="booking-day-row">
                {days.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    className={
                      option.key === day ? "booking-day is-on" : "booking-day"
                    }
                    onClick={() => setDay(option.key)}
                    aria-pressed={option.key === day}
                  >
                    <span>{option.weekday}</span>
                    <strong>{option.day}</strong>
                    <small>{option.month}</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="booking-slots">
              <legend>What time?</legend>

              <div className="booking-slot-row">
                {SLOTS.map((time) => {
                  // Shown rather than hidden: a slot missing from the row
                  // looks like the showroom is shut, where a struck-through
                  // one says who took it — which was the visitor.
                  const taken = slotTaken(bookings, day, time);

                  return (
                    <button
                      type="button"
                      key={time}
                      className={[
                        "booking-slot",
                        time === slot ? "is-on" : "",
                        taken ? "is-taken" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => {
                        setSlot(time);
                        setErrors((current) => ({ ...current, slot: "" }));
                      }}
                      aria-pressed={time === slot}
                      title={taken ? "You already have a car booked then" : undefined}
                    >
                      {slotLabel(time)}
                    </button>
                  );
                })}
              </div>
              {errors.slot && <em className="booking-slot-error">{errors.slot}</em>}
            </fieldset>

            <label className="booking-field">
              Your name
              <input
                ref={firstFieldRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <em>{errors.name}</em>}
            </label>

            <label className="booking-field">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <em>{errors.email}</em>}
            </label>

            <label className="booking-field">
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone && <em>{errors.phone}</em>}
            </label>

            <button type="submit" className="details-action-button">
              Confirm the slot
              <span>→</span>
            </button>

            <p className="booking-fine">
              We hold the slot for 15 minutes past the hour. Bring your licence.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
