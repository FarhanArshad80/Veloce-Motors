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

// An appointment that lives only in this browser is one the person who made
// it will not think about again until they happen to reopen the site. The
// showroom is expecting them on Thursday; nothing on their phone is.
//
// So the booking is offered as a calendar file, which is the one format every
// diary on every platform already understands - no account, no integration,
// no permission prompt.
const TEST_DRIVE_MINUTES = 60;

// Text inside an ICS field is delimited by commas and semicolons, so a
// vehicle called "Civic, Sport" would otherwise end the summary early and
// leave the rest of the line to be read as another property.
function icsText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsStamp(date) {
  return `${date.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

// Deliberately a floating local time — no Z, no TZID. A test drive at half
// past eleven is half past eleven at the showroom, and pinning it to an
// offset would move it in the diary of anyone who books from one timezone
// and drives in another, which is the wrong way round: it is the appointment
// that is fixed, not the instant.
function icsLocal(day, slot) {
  return `${day.replace(/-/g, "")}T${slot.replace(":", "")}00`;
}

function addMinutes(slot, minutes) {
  const [hours, mins] = slot.split(":").map(Number);
  const total = hours * 60 + mins + minutes;

  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
}

// No line may exceed 75 octets. Continuations start with a space, which the
// reader strips back out. A description with a vehicle name in it clears 75
// easily, and the stricter clients treat an over-long line as a malformed
// file rather than trimming it.
//
// Measured in octets rather than characters, because the em dash in "Bring
// your licence — " is three bytes and a fold counted in characters would put
// the break in the wrong place, or worse, inside the dash.
function fold(line) {
  const bytes = new TextEncoder().encode(line);

  if (bytes.length <= 75) return line;

  const chunks = [];
  let start = 0;

  while (start < bytes.length) {
    // 74 after the first chunk, leaving room for the leading space that the
    // continuation carries.
    const limit = start === 0 ? 75 : 74;
    let end = Math.min(start + limit, bytes.length);

    // Never split a multi-byte character: continuation bytes are 10xxxxxx,
    // so walk back to the start of the sequence the cut landed in.
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end -= 1;
    }

    chunks.push(new TextDecoder().decode(bytes.slice(start, end)));
    start = end;
  }

  return chunks.join("\r\n ");
}

export function bookingCalendar(booking, now = new Date()) {
  const vehicle = booking.carName ? `the ${booking.carName}` : "a vehicle";

  // CRLF between every line, including the last: the spec asks for it, and
  // the stricter desktop clients refuse a file that uses bare newlines.
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Veloce Motors//Test Drive//EN",
    "BEGIN:VEVENT",
    `UID:${icsText(booking.id)}@veloce-motors`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsLocal(booking.day, booking.slot)}`,
    `DTEND:${icsLocal(booking.day, addMinutes(booking.slot, TEST_DRIVE_MINUTES))}`,
    `SUMMARY:${icsText(`Test drive — ${booking.carName || "Veloce Motors"}`)}`,
    `DESCRIPTION:${icsText(
      `Test drive of ${vehicle} at Veloce Motors. Bring your licence — we cannot hand over the keys without it.`
    )}`,
    "LOCATION:Veloce Motors",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}

export function downloadBookingCalendar(booking) {
  const blob = new Blob([bookingCalendar(booking)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `veloce-test-drive-${booking.day}.ics`;
  link.click();

  // Handed back on the next task rather than immediately: the save is started
  // by the click but not necessarily finished when it returns, and revoking
  // the URL underneath it cancels the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
