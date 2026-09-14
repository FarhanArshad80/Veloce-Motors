// The vehicles this browser has actually opened, most recent first.
//
// Looking at six cars and then wanting the third one back was a search
// problem the page did nothing to help with: the sidebar holds one vehicle
// at a time, the grid reshuffles under every filter, and a car looked at
// five minutes ago left no trace anywhere on screen. The shortlist is not
// the answer either — starring a car is a judgement, and most of what gets
// opened is opened precisely to find out whether it is worth starring.
//
// Only ids are kept. The inventory is the source of truth for everything
// else, so a renamed, re-priced or deleted vehicle cannot be described here
// out of a stale copy of itself.
export const RECENT_KEY = "veloce-recent";

// Long enough to cover a sitting's worth of browsing, short enough that the
// row stays a handful of chips rather than a second inventory.
export const RECENT_LIMIT = 6;

export function recallRecent() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY));

    if (!Array.isArray(stored)) return [];

    // Deduplicated on the way in. Nothing this app writes can repeat an id,
    // but the store is a file on someone else's machine and the row would
    // render the same car twice if one ever did.
    const ids = stored
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    return [...new Set(ids)].slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function saveRecent(ids) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — the row still works for this visit */
  }
}

// A history, not a set: opening a car already in the list moves it to the
// front rather than leaving it where it was. "Recent" has to mean recent, or
// the oldest thing in the row is the one that survives longest.
export function pushRecent(ids, id) {
  if (!Number.isFinite(id)) return ids;

  const next = [id, ...ids.filter((seen) => seen !== id)];

  return next.length > RECENT_LIMIT ? next.slice(0, RECENT_LIMIT) : next;
}
