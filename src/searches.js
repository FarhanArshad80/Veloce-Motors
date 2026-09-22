// Searches worth coming back to, kept in this browser.
//
// Every filter on the page is already written into the address, which makes
// a search easy to send and useless to keep: nobody bookmarks "SUVs under
// $50k with low mileage", they rebuild it — the type chip, then the price
// band, then the mileage band — every visit, for as long as they are
// shopping. A search that is being repeated is a search that should be one
// click.
//
// A shared selection is deliberately not part of what is kept. It points at
// somebody else's three picks from one afternoon, and it is the one filter
// whose meaning expires with the link it arrived on.
export const SEARCHES_KEY = "veloce-searches";

// A handful of chips, not a second filter panel. Past this the oldest goes,
// the way the recently-viewed row forgets.
export const SEARCH_LIMIT = 6;

const FIELDS = [
  "query",
  "activeFilter",
  "colour",
  "priceBand",
  "mileageBand",
  "monthlyBand",
  "ageBand",
  "sortBy",
  "shortlistOnly",
];

// Two searches are the same search when every filter matches. Cleaned first,
// so "suv " and "suv" do not become two chips.
export function searchKey(filters) {
  return JSON.stringify(FIELDS.map((field) =>
    field === "query" ? String(filters.query || "").trim().toLowerCase() : filters[field]
  ));
}

function cleanFilters(raw) {
  if (!raw || typeof raw !== "object") return null;

  const text = (value, fallback) => (typeof value === "string" && value ? value : fallback);

  return {
    query: typeof raw.query === "string" ? raw.query.trim().slice(0, 80) : "",
    activeFilter: text(raw.activeFilter, "All"),
    colour: text(raw.colour, "All"),
    priceBand: text(raw.priceBand, "any"),
    mileageBand: text(raw.mileageBand, "any"),
    monthlyBand: text(raw.monthlyBand, "any"),
    ageBand: text(raw.ageBand, "any"),
    sortBy: text(raw.sortBy, "default"),
    shortlistOnly: raw.shortlistOnly === true,
  };
}

// Shape only. Whether a band or a sort still exists is for the page to decide
// when the search is applied, because the page is what owns those lists —
// and a band that has since been retired should fall back to "any" rather
// than take the whole saved search down with it.
export function recallSearches() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEARCHES_KEY));

    if (!Array.isArray(stored)) return [];

    const seen = new Set();
    const searches = [];

    for (const entry of stored) {
      const filters = cleanFilters(entry?.filters);

      if (!filters || typeof entry.label !== "string" || !entry.label) continue;

      const key = searchKey(filters);
      if (seen.has(key)) continue;

      seen.add(key);
      searches.push({ key, label: entry.label.slice(0, 120), filters });
    }

    return searches.slice(0, SEARCH_LIMIT);
  } catch {
    return [];
  }
}

export function saveSearches(searches) {
  try {
    localStorage.setItem(
      SEARCHES_KEY,
      JSON.stringify(searches.map(({ label, filters }) => ({ label, filters })))
    );
  } catch {
    /* storage unavailable — the chips still work for this visit */
  }
}

// Newest first. Saving a search that is already kept moves it to the front
// instead of adding it twice, the same rule the recently-viewed row follows.
export function addSearch(searches, label, filters) {
  const cleaned = cleanFilters(filters);
  const key = searchKey(cleaned);

  return [
    { key, label, filters: cleaned },
    ...searches.filter((search) => search.key !== key),
  ].slice(0, SEARCH_LIMIT);
}

export function removeSearch(searches, key) {
  return searches.filter((search) => search.key !== key);
}
