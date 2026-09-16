// What somebody thought about a vehicle, in their own words.
//
// The shortlist records that a car was liked. It cannot record why, and the
// why is what decays first: after an afternoon of six cars, "service history
// looks thin", "ask about the alloys" and "the good one, but the wrong
// colour" are the whole of the decision, and none of it survives closing the
// tab. The star says which cars came back; only a note says what to do about
// them.
//
// Private in the sense that matters here — it never leaves this browser, the
// same as the shortlist and the bookings. Nothing in this app talks to a
// dealer.
export const NOTES_KEY = "veloce-notes";

// A note is a reminder, not a report. Long enough for the two or three
// things worth asking a salesperson, short enough to stay readable in the
// sidebar without becoming a document the page has to scroll.
export const NOTE_LIMIT = 400;

// Keyed by vehicle id, exactly like the shortlist, so the inventory stays the
// only source of truth about the cars themselves.
export function recallNotes() {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTES_KEY));

    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      return {};
    }

    const notes = {};

    for (const [id, text] of Object.entries(stored)) {
      const carId = Number(id);

      if (!Number.isFinite(carId) || carId <= 0) continue;
      if (typeof text !== "string" || !text.trim()) continue;

      // Capped rather than trimmed: what comes back through here is what the
      // textarea draws, and trimming on the way out would take each space
      // away as fast as it was typed.
      notes[carId] = text.slice(0, NOTE_LIMIT);
    }

    return notes;
  } catch {
    return {};
  }
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    /* storage unavailable — notes still hold for this visit */
  }
}

export function noteForCar(notes, carId) {
  const text = notes?.[carId];

  return typeof text === "string" ? text : "";
}

// Pure, like pushRecent beside it. An emptied note removes its key rather
// than storing a blank string, so "does this car have a note" stays a
// question the store can answer.
export function setNote(notes, carId, text) {
  const next = { ...notes };
  const capped = String(text ?? "").slice(0, NOTE_LIMIT);

  if (capped.trim()) next[carId] = capped;
  else delete next[carId];

  return next;
}

export function hasNote(notes, carId) {
  return noteForCar(notes, carId).trim() !== "";
}

// Notes belonging to vehicles that are no longer in the inventory. A car can
// be removed from the grid, and a note left behind for it would sit in
// storage forever attached to nothing.
export function pruneNotes(notes, cars) {
  const living = new Set(cars.map((car) => car.id));
  const next = {};

  for (const [id, text] of Object.entries(notes)) {
    if (living.has(Number(id))) next[Number(id)] = text;
  }

  return next;
}
