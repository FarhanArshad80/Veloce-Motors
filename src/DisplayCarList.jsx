import React, { useEffect, useMemo, useState } from "react";
import CarCard from "./CarCard";
import CarDetails from "./CarDetails";
import CompareTable from "./CompareTable";
import { parseMileage, parsePrice } from "./pricing";

const defaultCars = [
  {
    id: 1,
    name: "Honda Civic",
    color: "Blue",
    year: 2022,
    price: "$22,000",
    type: "Sedan",
    mileage: "18,420 mi",
    engine: "1.5L Turbo",
    power: "180 HP",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=85",
    description:
      "A dependable and efficient sedan with a refined cabin, confident handling, modern safety features and comfortable everyday driving.",
  },
  {
    id: 2,
    name: "Toyota Corolla",
    color: "White",
    year: 2023,
    price: "$21,500",
    type: "Sedan",
    mileage: "12,800 mi",
    engine: "2.0L Petrol",
    power: "169 HP",
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=85",
    description:
      "A smart and comfortable family sedan known for outstanding reliability, excellent fuel economy and low ownership costs.",
  },
  {
    id: 3,
    name: "Ford Mustang",
    color: "Red",
    year: 2021,
    price: "$36,000",
    type: "Coupe",
    mileage: "21,100 mi",
    engine: "5.0L V8",
    power: "450 HP",
    image:
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=85",
    description:
      "An iconic American muscle car with aggressive styling, powerful acceleration, rear-wheel drive and unmistakable road presence.",
  },
  {
    id: 4,
    name: "Tesla Model S",
    color: "Midnight Silver",
    year: 2024,
    price: "$89,990",
    type: "Electric",
    mileage: "4,650 mi",
    engine: "Dual Motor Electric",
    power: "670 HP",
    image:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=85",
    description:
      "A luxurious electric sedan with instant acceleration, long-range capability, intelligent technology and a minimalist premium interior.",
  },
  {
    id: 5,
    name: "BMW 3 Series",
    color: "Dark Gray",
    year: 2022,
    price: "$43,000",
    type: "Luxury",
    mileage: "16,300 mi",
    engine: "2.0L Turbo",
    power: "255 HP",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85",
    description:
      "A premium sports sedan blending German engineering, balanced handling, elegant styling and an intelligently designed interior.",
  },
  {
    id: 6,
    name: "Kia Sportage",
    color: "Green",
    year: 2023,
    price: "$27,000",
    type: "SUV",
    mileage: "9,870 mi",
    engine: "2.5L Petrol",
    power: "187 HP",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85",
    description:
      "A stylish and spacious SUV offering modern technology, comfortable seating, practical storage and confident road performance.",
  },
];

const sortOptions = [
  { value: "default", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "year-desc", label: "Year: Newest first" },
  { value: "name-asc", label: "Name: A–Z" },
];

// Budget is the first question most buyers answer, and it is the one the
// category chips cannot express. Bands are fixed rather than derived from
// the inventory so the choices stay in the same place as stock moves.
const priceBands = [
  { value: "any", label: "Any price", test: () => true },
  { value: "under-25", label: "Under $25,000", test: (p) => p < 25000 },
  { value: "25-50", label: "$25,000 – $50,000", test: (p) => p >= 25000 && p < 50000 },
  { value: "50-100", label: "$50,000 – $100,000", test: (p) => p >= 50000 && p < 100000 },
  { value: "over-100", label: "Over $100,000", test: (p) => p >= 100000 },
];

// The second question, and the one price cannot answer: a cheap car with
// 90,000 miles on it and an expensive one with 4,000 are different purchases
// entirely. Bands are open-ended upwards — nobody shops for "between 25,000
// and 50,000 miles", they shop for "no more than".
const mileageBands = [
  { value: "any", label: "Any mileage", test: () => true },
  { value: "under-10", label: "Under 10,000 mi", test: (m) => m < 10000 },
  { value: "under-25", label: "Under 25,000 mi", test: (m) => m < 25000 },
  { value: "under-50", label: "Under 50,000 mi", test: (m) => m < 50000 },
];

function findBand(value) {
  return priceBands.find((band) => band.value === value) || priceBands[0];
}

function findMileageBand(value) {
  return mileageBands.find((band) => band.value === value) || mileageBands[0];
}

// A narrowed inventory is a thing people send to each other — "here, the
// SUVs under $50k" — and a thing they expect the back button to return them
// to. Keeping the filters in the query string makes both work, and costs a
// reload nothing: the state simply starts where the URL says.
//
// Every value is validated on the way in. A hand-edited or stale link should
// land on the full inventory rather than an empty grid with no explanation.
function getInitialFilters() {
  let params;

  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return {
      query: "",
      activeFilter: "All",
      sortBy: "default",
      priceBand: "any",
      mileageBand: "any",
      shortlistOnly: false,
    };
  }

  const sort = params.get("sort");
  const band = params.get("price");
  const miles = params.get("miles");

  return {
    query: params.get("q") || "",
    // Categories come from the inventory, which is not loaded yet, so this
    // one is checked later by the effect that already guards against a
    // filter for a category with nothing left in it.
    activeFilter: params.get("type") || "All",
    sortBy: sortOptions.some((option) => option.value === sort) ? sort : "default",
    priceBand: priceBands.some((option) => option.value === band) ? band : "any",
    mileageBand: mileageBands.some((option) => option.value === miles) ? miles : "any",
    shortlistOnly: params.get("saved") === "1",
  };
}

function getInitialShortlist() {
  try {
    const saved = localStorage.getItem("veloce-shortlist");

    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getInitialCars() {
  try {
    const savedCars = localStorage.getItem("veloce-cars");

    if (savedCars) {
      const parsedCars = JSON.parse(savedCars);

      return parsedCars.map((car, index) => {
        const matchingDefault = defaultCars.find(
          (defaultCar) => defaultCar.name === car.name
        );

        return {
          ...(matchingDefault || defaultCars[index % defaultCars.length]),
          ...car,
          id: car.id || Date.now() + index,
        };
      });
    }

    return defaultCars;
  } catch {
    return defaultCars;
  }
}

export default function DisplayCarList() {
  const initialFilters = useMemo(getInitialFilters, []);

  const [cars, setCars] = useState(getInitialCars);
  const [selectedCar, setSelectedCar] = useState(null);
  const [query, setQuery] = useState(initialFilters.query);
  const [activeFilter, setActiveFilter] = useState(initialFilters.activeFilter);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [priceBand, setPriceBand] = useState(initialFilters.priceBand);
  const [mileageBand, setMileageBand] = useState(initialFilters.mileageBand);
  const [shortlist, setShortlist] = useState(getInitialShortlist);
  const [shortlistOnly, setShortlistOnly] = useState(initialFilters.shortlistOnly);
  const [comparing, setComparing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    localStorage.setItem("veloce-cars", JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem("veloce-shortlist", JSON.stringify(shortlist));
  }, [shortlist]);

  // Writes the current filters back to the address bar. replaceState rather
  // than pushState: typing six letters into the search box is one act of
  // narrowing down, not six entries to press Back through. Defaults are
  // dropped instead of spelled out, so an unfiltered page keeps a clean URL,
  // and the hash is carried through because the page navigates by #anchor.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const apply = (key, value, fallback) => {
      if (value === fallback) params.delete(key);
      else params.set(key, value);
    };

    apply("q", query.trim(), "");
    apply("type", activeFilter, "All");
    apply("price", priceBand, "any");
    apply("miles", mileageBand, "any");
    apply("sort", sortBy, "default");
    apply("saved", shortlistOnly ? "1" : "", "");

    const search = params.toString();
    const { pathname, hash } = window.location;
    const next = `${pathname}${search ? `?${search}` : ""}${hash}`;

    if (next !== `${pathname}${window.location.search}${hash}`) {
      window.history.replaceState(null, "", next);
    }
  }, [query, activeFilter, priceBand, mileageBand, sortBy, shortlistOnly]);

  // "Copied" is a confirmation, not a state worth holding on to.
  useEffect(() => {
    if (!copiedLink) return undefined;

    const timer = setTimeout(() => setCopiedLink(false), 2000);

    return () => clearTimeout(timer);
  }, [copiedLink]);

  // A removed vehicle should not keep occupying a slot in the saved count,
  // so drop ids that no longer match anything in the inventory.
  useEffect(() => {
    setShortlist((currentShortlist) => {
      const remaining = currentShortlist.filter((id) =>
        cars.some((car) => car.id === id)
      );

      return remaining.length === currentShortlist.length
        ? currentShortlist
        : remaining;
    });
  }, [cars]);

  // Comparison follows the shortlist, in inventory order so the columns do
  // not reshuffle each time a star is toggled.
  const comparedCars = useMemo(
    () => cars.filter((car) => shortlist.includes(car.id)),
    [cars, shortlist]
  );

  // One vehicle on its own is not a comparison; drop out of the panel
  // rather than leaving a single lonely column on screen.
  useEffect(() => {
    if (comparing && comparedCars.length < 2) {
      setComparing(false);
    }
  }, [comparing, comparedCars]);

  const categories = useMemo(
    () => ["All", ...new Set(cars.map((car) => car.type || "Other"))],
    [cars]
  );

  // Removing the last vehicle of a category drops its chip from the filter
  // row, but the filter itself would stay active — leaving an empty grid and
  // no visible control to undo it. Fall back to "All" when that happens.
  useEffect(() => {
    if (!categories.includes(activeFilter)) {
      setActiveFilter("All");
    }
  }, [categories, activeFilter]);

  // Search is applied before the category chips so each chip can report how
  // many vehicles it would actually show for the current search term.
  const savedCars = useMemo(
    () =>
      shortlistOnly
        ? cars.filter((car) => shortlist.includes(car.id))
        : cars,
    [cars, shortlist, shortlistOnly]
  );

  const searchMatches = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return savedCars;

    return savedCars.filter((car) => {
      const searchableText = `
        ${car.name}
        ${car.color}
        ${car.type}
        ${car.year}
        ${car.description}
      `.toLowerCase();

      return searchableText.includes(term);
    });
  }, [savedCars, query]);

  // Counted from the search results rather than the band's own output, so
  // each option can say what picking it would actually leave on screen.
  const bandCounts = useMemo(() => {
    const counts = {};

    for (const band of priceBands) {
      counts[band.value] = searchMatches.filter((car) =>
        band.test(parsePrice(car.price))
      ).length;
    }

    return counts;
  }, [searchMatches]);

  const priceMatches = useMemo(() => {
    if (priceBand === "any") return searchMatches;

    const { test } = findBand(priceBand);

    return searchMatches.filter((car) => test(parsePrice(car.price)));
  }, [searchMatches, priceBand]);

  // Counted after the budget has been applied, for the same reason the price
  // counts are: an option should say what picking it would leave, not what
  // it would leave in some other version of the page.
  const mileageCounts = useMemo(() => {
    const counts = {};

    for (const band of mileageBands) {
      counts[band.value] = priceMatches.filter((car) =>
        band.test(parseMileage(car.mileage))
      ).length;
    }

    return counts;
  }, [priceMatches]);

  const mileageMatches = useMemo(() => {
    if (mileageBand === "any") return priceMatches;

    const { test } = findMileageBand(mileageBand);

    return priceMatches.filter((car) => test(parseMileage(car.mileage)));
  }, [priceMatches, mileageBand]);

  const categoryCounts = useMemo(() => {
    const counts = { All: mileageMatches.length };

    for (const car of mileageMatches) {
      const type = car.type || "Other";
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  }, [mileageMatches]);

  const filteredCars = useMemo(() => {
    const matching = mileageMatches.filter(
      (car) =>
        activeFilter === "All" ||
        (car.type || "Other") === activeFilter
    );

    const sorted = [...matching];

    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case "price-desc":
        sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case "year-desc":
        sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return sorted;
  }, [mileageMatches, activeFilter, sortBy]);

  // Every narrowing currently in force, each carrying the means to undo just
  // itself. The controls are spread across a search box, three selects and a
  // chip row, so "why am I only seeing two cars" was a question you answered
  // by checking five places — and the only way back was Clear filters, which
  // threw away the four you wanted along with the one you did not.
  const activeFilters = useMemo(() => {
    const term = query.trim();
    const list = [];

    if (term) list.push({ key: "q", label: `“${term}”`, clear: () => setQuery("") });

    if (activeFilter !== "All") {
      list.push({ key: "type", label: activeFilter, clear: () => setActiveFilter("All") });
    }

    if (priceBand !== "any") {
      list.push({ key: "price", label: findBand(priceBand).label, clear: () => setPriceBand("any") });
    }

    if (mileageBand !== "any") {
      list.push({
        key: "miles",
        label: findMileageBand(mileageBand).label,
        clear: () => setMileageBand("any"),
      });
    }

    if (shortlistOnly) {
      list.push({ key: "saved", label: "Saved only", clear: () => setShortlistOnly(false) });
    }

    return list;
  }, [query, activeFilter, priceBand, mileageBand, shortlistOnly]);

  const isNarrowed =
    query.trim() !== "" ||
    activeFilter !== "All" ||
    shortlistOnly ||
    priceBand !== "any" ||
    mileageBand !== "any";

  // The clipboard can be refused — an insecure context, a denied permission.
  // The URL is in the address bar either way, so that case says so rather
  // than reporting a failure.
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
    } catch {
      window.prompt("Copy this link to share these results:", window.location.href);
    }
  }

  function resetFilters() {
    setQuery("");
    setActiveFilter("All");
    setShortlistOnly(false);
    setPriceBand("any");
    setMileageBand("any");
  }

  function handleToggleShortlist(id) {
    setShortlist((currentShortlist) =>
      currentShortlist.includes(id)
        ? currentShortlist.filter((savedId) => savedId !== id)
        : [...currentShortlist, id]
    );
  }

  function handleAddCar(car) {
    const duplicatedCar = {
      ...car,
      id: Date.now(),
      name: `${car.name} Edition`,
    };

    setCars((currentCars) => [
      ...currentCars,
      duplicatedCar,
    ]);

    setSelectedCar(duplicatedCar);
  }

  function handleDeleteCar(id) {
    setCars((currentCars) =>
      currentCars.filter((car) => car.id !== id)
    );

    setSelectedCar((currentCar) =>
      currentCar?.id === id ? null : currentCar
    );
  }

  return (
    <div className="inventory-layout">
      <div className="inventory-main">
        <div className="inventory-toolbar">
          <div>
            <p className="inventory-count">
              {isNarrowed
                ? `Showing ${filteredCars.length} of ${cars.length} vehicles`
                : `${cars.length} vehicles available`}
            </p>

            <h3 className="inventory-title">
              Curated inventory
            </h3>
          </div>

          <div className="toolbar-controls">
            <div className="search-wrapper">
              <span>⌕</span>

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search vehicles..."
                aria-label="Search vehicles"
              />
            </div>

            <button
              className={
                shortlistOnly
                  ? "shortlist-toggle active"
                  : "shortlist-toggle"
              }
              onClick={() => setShortlistOnly((only) => !only)}
              aria-pressed={shortlistOnly}
            >
              ★ Saved
              <span className="filter-count">{shortlist.length}</span>
            </button>

            <button
              className={
                comparing ? "shortlist-toggle active" : "shortlist-toggle"
              }
              onClick={() => setComparing((open) => !open)}
              disabled={comparedCars.length < 2}
              aria-pressed={comparing}
              title={
                comparedCars.length < 2
                  ? "Save at least two vehicles to compare them"
                  : "Compare the saved vehicles side by side"
              }
            >
              ⇄ Compare
            </button>

            <button
              className={copiedLink ? "shortlist-toggle active" : "shortlist-toggle"}
              onClick={copyLink}
              disabled={!isNarrowed}
              title={
                isNarrowed
                  ? "Copy a link to these results"
                  : "Narrow the inventory to get a link worth sharing"
              }
            >
              {copiedLink ? "✓ Copied" : "⇱ Share"}
            </button>

            <select
              className="sort-select"
              value={priceBand}
              onChange={(event) => setPriceBand(event.target.value)}
              aria-label="Filter by price"
            >
              {priceBands.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                  {band.value === "any" ? "" : ` (${bandCounts[band.value] || 0})`}
                </option>
              ))}
            </select>

            <select
              className="sort-select"
              value={mileageBand}
              onChange={(event) => setMileageBand(event.target.value)}
              aria-label="Filter by mileage"
            >
              {mileageBands.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                  {band.value === "any" ? "" : ` (${mileageCounts[band.value] || 0})`}
                </option>
              ))}
            </select>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort vehicles"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-list">
          {categories.map((category) => (
            <button
              key={category}
              className={
                activeFilter === category
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() => setActiveFilter(category)}
            >
              {category}
              <span className="filter-count">
                {categoryCounts[category] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Below the category chips rather than above them: it describes
            what the controls above have already done. */}
        {activeFilters.length > 0 && (
          <div className="active-filters">
            <span className="active-filters-label">Filtering by</span>

            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                className="active-filter"
                onClick={filter.clear}
                aria-label={`Remove filter: ${filter.label}`}
              >
                {filter.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}

            {activeFilters.length > 1 && (
              <button className="active-filter-clear" onClick={resetFilters}>
                Clear all
              </button>
            )}
          </div>
        )}

        {comparing && comparedCars.length >= 2 && (
          <CompareTable
            cars={comparedCars}
            onClose={() => setComparing(false)}
            onRemove={handleToggleShortlist}
          />
        )}

        <div className="cars-grid">
          {filteredCars.map((car, index) => (
            <CarCard
              key={car.id}
              car={car}
              index={index}
              selected={selectedCar?.id === car.id}
              shortlisted={shortlist.includes(car.id)}
              onSelect={setSelectedCar}
              onAdd={handleAddCar}
              onDelete={handleDeleteCar}
              onToggleShortlist={handleToggleShortlist}
            />
          ))}

          {filteredCars.length === 0 && (
            <div className="empty-state">
              <span>⌕</span>
              <h3>No vehicles found</h3>
              <p>
                {shortlistOnly && shortlist.length === 0
                  ? "You have not saved any vehicles yet. Tap the star on a card to shortlist it."
                  : mileageBand !== "any"
                  ? `Nothing ${findMileageBand(mileageBand).label.toLowerCase()} matches. Try allowing more miles.`
                  : priceBand !== "any"
                  ? `Nothing in the ${findBand(priceBand).label.toLowerCase()} band matches. Try a wider budget.`
                  : "Try another search term or category."}
              </p>

              <button className="reset-filters" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="details-sidebar">
        {selectedCar ? (
          <CarDetails car={selectedCar} />
        ) : (
          <div className="empty-details">
            <div className="empty-details-icon">↗</div>

            <h3>Select a vehicle</h3>

            <p>
              Click any vehicle card to see its full specifications.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}