// Test drives that have been booked from this browser.
//
// A booking used to live in the dialog that made it: close the panel and the
// only record of it was a sentence the visitor had already read. They could
// book the same car five times over, see no sign on their next visit that
// they had booked anything at all, and had nothing to cancel with.
//
// What is kept is deliberately thin — which vehicle, which day, which slot.
// The name, email and phone typed into the form are not written down. They
// are what the showroom needs to confirm a booking, not what a browser needs
// to show one, and this store sits on whatever machine the visitor happened
// to be using.
export const BOOKINGS_KEY = "veloce-test-drives";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SLOT = /^\d{2}:\d{2}$/;

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

// A booking is only worth keeping while it is still ahead of the visitor.
// Yesterday's appointment cannot be cancelled and nobody needs reminding of
// it, so the list quietly stops at today rather than growing for ever.
export function recallBookings(today = todayKey()) {
  try {
    const stored = JSON.parse(localStorage.getItem(BOOKINGS_KEY));

    if (!Array.isArray(stored)) return [];

    return stored
      .filter(
        (entry) =>
          entry &&
          typeof entry.day === "string" &&
          DAY_KEY.test(entry.day) &&
          typeof entry.slot === "string" &&
          SLOT.test(entry.slot) &&
          entry.day >= today
      )
      .map((entry) => ({
        id: String(entry.id || `${entry.day}-${entry.slot}`),
        // Null is a real value here: the booking made from the header is an
        // appointment without a vehicle picked yet.
        carId: Number.isFinite(Number(entry.carId)) ? Number(entry.carId) : null,
        carName: typeof entry.carName === "string" ? entry.carName : null,
        day: entry.day,
        slot: entry.slot,
      }))
      .sort((a, b) => `${a.day}${a.slot}`.localeCompare(`${b.day}${b.slot}`));
  } catch {
    return [];
  }
}

export function saveBookings(bookings) {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch {
    /* storage unavailable — the booking holds for this visit and no longer */
  }
}

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABEL = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "Thu 17 Sep, 11:00 am". A stored key reads as a filename; this is the form
// somebody can hold an appointment in their head as.
//
// Built from the parts rather than parsed into a Date: "2026-09-17" parses as
// UTC midnight, which is the previous evening for half the world and would
// name the wrong weekday for them.
export function bookingWhen(booking) {
  const [year, month, day] = booking.day.split("-").map(Number);
  const [hours, minutes] = booking.slot.split(":").map(Number);
  const weekday = DAY_LABEL[new Date(year, month - 1, day).getDay()];
  const time = `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "am" : "pm"}`;

  return `${weekday} ${day} ${MONTH_LABEL[month - 1]}, ${time}`;
}

export function bookingForCar(bookings, carId) {
  return bookings.find((entry) => entry.carId === carId) || null;
}

// Nobody can be in two cars at once. A slot already spoken for on that day is
// not offered again, whichever vehicle it was taken for.
export function slotTaken(bookings, day, slot) {
  return bookings.some((entry) => entry.day === day && entry.slot === slot);
}

export function addBooking(bookings, booking) {
  return [...bookings.filter((entry) => entry.id !== booking.id), booking].sort(
    (a, b) => `${a.day}${a.slot}`.localeCompare(`${b.day}${b.slot}`)
  );
}

export function removeBooking(bookings, id) {
  return bookings.filter((entry) => entry.id !== id);
}
