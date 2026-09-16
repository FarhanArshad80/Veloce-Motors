import React from "react";
import { bookingWhen, downloadBookingCalendar } from "./bookings";

// Every test drive that has been booked, in one place.
//
// Until now an appointment could only be seen from the vehicle it was made
// against — the detail panel for that one car. That hid two things. A booking
// made from the header, which carries no vehicle at all, had nowhere it could
// ever be seen again; and even a booking against a car was only findable by
// somebody who remembered which car it was and went looking for it, which is
// exactly what a person checking "when am I due in" does not remember.
//
// A diary is also the only place the honest question can be asked: not "is
// this car booked" but "what have I committed to, and is Thursday going to
// work".
export default function BookingsPanel({ bookings, onClose, onCancel, onSelect }) {
  return (
    <section className="bookings-panel" aria-label="Your test drives">
      <div className="compare-header">
        <div>
          <p className="eyebrow">Your diary</p>
          <h3>
            {bookings.length} test drive{bookings.length === 1 ? "" : "s"} booked
          </h3>
        </div>

        <button className="compare-close" onClick={onClose}>
          Close ✕
        </button>
      </div>

      {bookings.length === 0 ? (
        // Reached by cancelling the last one while the panel is open. Saying
        // so beats the panel vanishing under the hand that emptied it.
        <p className="bookings-empty">
          Nothing booked. Open a vehicle and pick a time to arrange a viewing.
        </p>
      ) : (
        <ul className="bookings-list">
          {bookings.map((booking) => (
            <li className="bookings-row" key={booking.id}>
              <div className="bookings-when">
                <p className="bookings-time">{bookingWhen(booking)}</p>

                {/* A booking made from the header belongs to no vehicle, and
                    that is a real state rather than missing data — somebody
                    arranging a visit before choosing what to look at. It says
                    so rather than leaving the line blank. */}
                {booking.carName ? (
                  booking.carId != null && onSelect ? (
                    <button
                      className="bookings-car"
                      onClick={() => onSelect(booking.carId)}
                    >
                      {booking.carName}
                    </button>
                  ) : (
                    <p className="bookings-car-plain">{booking.carName}</p>
                  )
                ) : (
                  <p className="bookings-car-plain">General showroom visit</p>
                )}
              </div>

              <div className="bookings-actions">
                <button
                  className="bookings-ics"
                  onClick={() => downloadBookingCalendar(booking)}
                  title="Save this appointment to your calendar"
                >
                  Add to calendar
                </button>

                <button
                  className="bookings-cancel"
                  onClick={() => onCancel(booking.id)}
                  aria-label={`Cancel the test drive on ${bookingWhen(booking)}`}
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
