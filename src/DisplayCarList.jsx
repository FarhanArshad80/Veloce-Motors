import React, { useEffect, useMemo, useState } from "react";
import CarCard from "./CarCard";
import CarDetails from "./CarDetails";
import CompareTable from "./CompareTable";
import { bookingForCar, recallBookings } from "./bookings";
import {
  estimateMonthly,
  parseMileage,
  parsePrice,
  recallFinanceTerms,
  saveFinanceTerms,
} from "./pricing";

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
  // Sticker price and monthly payment rank the same inventory the same way
  // while the terms are shared, and they stop agreeing the moment a vehicle
  // has no usable price: that one has no monthly figure at all, and belongs
  // at the end of this order rather than at the top of it.
  { value: "monthly-asc", label: "Monthly: Low to High" },
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

// The question sticker price cannot answer. Most people do not buy a car with
// $38,000; they buy it with $600 a month, and whether a given vehicle clears
// that bar depends entirely on the deposit, term and rate set in the finance
// panel - a $60,000 car is under $700/mo over 72 months and nowhere near it
// over 24.
//
// So this band is tested against the same estimate the cards quote rather
// than against the price, and the grid re-narrows when the sliders move. Open
// -ended upwards like mileage: nobody shops for "between $300 and $500 a
// month", they shop for "no more than".
const monthlyBands = [
  { value: "any", label: "Any monthly", test: () => true },
  { value: "under-300", label: "Under $300/mo", test: (m) => m < 300 },
  { value: "under-500", label: "Under $500/mo", test: (m) => m < 500 },
  { value: "under-750", label: "Under $750/mo", test: (m) => m < 750 },
  { value: "under-1000", label: "Under $1,000/mo", test: (m) => m < 1000 },
];

// Long enough to read the banner and reach for it, short enough that it is
// not still hanging over the page once attention has moved on.
const UNDO_MS = 8000;

// A shared selection: the exact vehicles someone picked out, named in the
// link itself.
//
// "Saved only" could already be shared, but the star list it filters by lives
// in the sender's browser — so the link arrived at a stranger's machine, found
// their shortlist, and showed them an empty grid telling them to save some
// vehicles. Naming the ids in the URL is what makes "here, these three" work.
//
// Ids of vehicles added on the sender's machine will not exist here, so the
// list is a request rather than a promise and is always intersected with what
// this inventory actually holds.
function parsePick(value) {
  if (!value) return null;

  const ids = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);

  return ids.length > 0 ? ids : null;
}

function findBand(value) {
  return priceBands.find((band) => band.value === value) || priceBands[0];
}

function findMileageBand(value) {
  return mileageBands.find((band) => band.value === value) || mileageBands[0];
}

function findMonthlyBand(value) {
  return monthlyBands.find((band) => band.value === value) || monthlyBands[0];
}

// A vehicle with no usable price has no monthly figure either, and the cards
// already decline to quote one. Letting it through a budget filter would put
// it in front of someone as an answer to a question it cannot answer.
function monthlyWithin(car, band, terms) {
  const monthly = estimateMonthly(parsePrice(car.price), terms);

  return monthly > 0 && band.test(monthly);
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
      monthlyBand: "any",
      shortlistOnly: false,
      sharedPick: null,
      openCar: null,
    };
  }

  const sort = params.get("sort");
  const band = params.get("price");
  const miles = params.get("miles");
  const monthly = params.get("mo");

  return {
    query: params.get("q") || "",
    // Categories come from the inventory, which is not loaded yet, so this
    // one is checked later by the effect that already guards against a
    // filter for a category with nothing left in it.
    activeFilter: params.get("type") || "All",
    sortBy: sortOptions.some((option) => option.value === sort) ? sort : "default",
    priceBand: priceBands.some((option) => option.value === band) ? band : "any",
    mileageBand: mileageBands.some((option) => option.value === miles) ? miles : "any",
    monthlyBand: monthlyBands.some((option) => option.value === monthly) ? monthly : "any",
    shortlistOnly: params.get("saved") === "1",
    sharedPick: parsePick(params.get("pick")),
    // One vehicle, open. Checked against the inventory when the page starts
    // rather than here, because the inventory is what decides whether that
    // id still exists.
    openCar: parsePick(params.get("car"))?.[0] ?? null,
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
  // The vehicle open in the sidebar, which is now part of the address like
  // the filters are. "Have a look at this one" was the most natural link
  // anybody could want to send from a showroom page, and the best it could
  // do was a grid the recipient then had to search. A stale or unknown id
  // opens nothing rather than an error — the inventory is still there.
  const [selectedCar, setSelectedCar] = useState(() =>
    initialFilters.openCar
      ? cars.find((car) => car.id === initialFilters.openCar) || null
      : null
  );
  // Test drives already in the diary. The dialog owns writing them; the grid
  // only needs to know which cars carry one so it can say so.
  const [bookings, setBookings] = useState(recallBookings);
  const [query, setQuery] = useState(initialFilters.query);
  const [activeFilter, setActiveFilter] = useState(initialFilters.activeFilter);
  const [sortBy, setSortBy] = useState(initialFilters.sortBy);
  const [priceBand, setPriceBand] = useState(initialFilters.priceBand);
  const [mileageBand, setMileageBand] = useState(initialFilters.mileageBand);
  const [monthlyBand, setMonthlyBand] = useState(initialFilters.monthlyBand);
  const [shortlist, setShortlist] = useState(getInitialShortlist);
  const [shortlistOnly, setShortlistOnly] = useState(initialFilters.shortlistOnly);
  // Someone else's picks, from the link that was opened. Deliberately kept
  // apart from `shortlist`: a link should be able to show you what a friend
  // chose without quietly rewriting what you had starred yourself.
  const [sharedPick, setSharedPick] = useState(initialFilters.sharedPick);
  // Held here rather than in the finance panel, because every card in the
  // grid now quotes a monthly figure and they all have to be quoting the same
  // deal. Moving a slider in the sidebar re-prices the whole inventory.
  const [financeTerms, setFinanceTerms] = useState(recallFinanceTerms);
  const [comparing, setComparing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // The vehicle most recently removed, held with where it sat and whether it
  // was starred, so putting it back restores the listing rather than
  // appending a stranger to the end of the inventory.
  const [deleted, setDeleted] = useState(null);

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
    apply("mo", monthlyBand, "any");
    apply("sort", sortBy, "default");
    apply("saved", shortlistOnly ? "1" : "", "");
    apply("pick", sharedPick ? sharedPick.join(",") : "", "");
    apply("car", selectedCar ? String(selectedCar.id) : "", "");

    const search = params.toString();
    const { pathname, hash } = window.location;
    const next = `${pathname}${search ? `?${search}` : ""}${hash}`;

    if (next !== `${pathname}${window.location.search}${hash}`) {
      window.history.replaceState(null, "", next);
    }
  }, [
    query, activeFilter, priceBand, mileageBand, monthlyBand, sortBy,
    shortlistOnly, sharedPick, selectedCar,
  ]);

  // "Copied" is a confirmation, not a state worth holding on to.
  useEffect(() => {
    if (!copiedLink) return undefined;

    const timer = setTimeout(() => setCopiedLink(false), 2000);

    return () => clearTimeout(timer);
  }, [copiedLink]);

  useEffect(() => {
    if (!deleted) return undefined;

    const timer = setTimeout(() => setDeleted(null), UNDO_MS);

    return () => clearTimeout(timer);
  }, [deleted]);

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

  // A shared selection narrows the inventory before anything else does, so
  // every count and every other filter below describes the vehicles that were
  // actually sent rather than the whole showroom.
  const pickedCars = useMemo(
    () =>
      sharedPick
        ? cars.filter((car) => sharedPick.includes(car.id))
        : cars,
    [cars, sharedPick]
  );

  // Search is applied before the category chips so each chip can report how
  // many vehicles it would actually show for the current search term.
  const savedCars = useMemo(
    () =>
      shortlistOnly
        ? pickedCars.filter((car) => shortlist.includes(car.id))
        : pickedCars,
    [pickedCars, shortlist, shortlistOnly]
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

  // Counted, like the two above, from what is left after the filters before
  // it - and recounted whenever the finance terms move, because a change of
  // term is a change to every one of these numbers.
  const monthlyCounts = useMemo(() => {
    const counts = {};

    for (const band of monthlyBands) {
      counts[band.value] =
        band.value === "any"
          ? mileageMatches.length
          : mileageMatches.filter((car) => monthlyWithin(car, band, financeTerms)).length;
    }

    return counts;
  }, [mileageMatches, financeTerms]);

  const monthlyMatches = useMemo(() => {
    if (monthlyBand === "any") return mileageMatches;

    const band = findMonthlyBand(monthlyBand);

    return mileageMatches.filter((car) => monthlyWithin(car, band, financeTerms));
  }, [mileageMatches, monthlyBand, financeTerms]);

  const categoryCounts = useMemo(() => {
    const counts = { All: monthlyMatches.length };

    for (const car of monthlyMatches) {
      const type = car.type || "Other";
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  }, [mileageMatches]);

  const filteredCars = useMemo(() => {
    const matching = monthlyMatches.filter(
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
      case "monthly-asc":
        sorted.sort((a, b) => {
          const left = estimateMonthly(parsePrice(a.price), financeTerms);
          const right = estimateMonthly(parsePrice(b.price), financeTerms);

          // A vehicle nobody can be quoted on sinks rather than leading a
          // list ordered by cheapest, where a zero would read as free.
          if (left <= 0) return right <= 0 ? 0 : 1;
          if (right <= 0) return -1;

          return left - right;
        });
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
  }, [monthlyMatches, activeFilter, sortBy, financeTerms]);

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

    if (monthlyBand !== "any") {
      list.push({
        key: "mo",
        label: findMonthlyBand(monthlyBand).label,
        clear: () => setMonthlyBand("any"),
      });
    }

    if (shortlistOnly) {
      list.push({ key: "saved", label: "Saved only", clear: () => setShortlistOnly(false) });
    }

    // Listed with the rest so it can be taken off the same way: someone who
    // opens a friend's three picks and then wants to see everything else
    // should not have to edit the address bar to get there.
    if (sharedPick) {
      list.push({
        key: "pick",
        label: `Shared selection (${sharedPick.length})`,
        clear: () => setSharedPick(null),
      });
    }

    return list;
  }, [query, activeFilter, priceBand, mileageBand, monthlyBand, shortlistOnly, sharedPick]);

  const isNarrowed =
    query.trim() !== "" ||
    activeFilter !== "All" ||
    shortlistOnly ||
    sharedPick !== null ||
    priceBand !== "any" ||
    mileageBand !== "any" ||
    monthlyBand !== "any";

  // The clipboard can be refused — an insecure context, a denied permission.
  // The URL is in the address bar either way, so that case says so rather
  // than reporting a failure.
  // Everything else on this page is already in the address bar, so the link
  // is the address bar — with one exception. "Saved only" points at a list
  // held in this browser, and that is the one view whose contents have to be
  // written into the link itself to survive the trip.
  function shareUrl() {
    const url = new URL(window.location.href);

    if (shortlistOnly && shortlist.length > 0) {
      url.searchParams.delete("saved");
      url.searchParams.set("pick", shortlist.join(","));
    }

    return url.toString();
  }

  async function copyLink() {
    const link = shareUrl();

    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
    } catch {
      window.prompt("Copy this link to share these results:", link);
    }
  }

  function resetFilters() {
    setQuery("");
    setActiveFilter("All");
    setShortlistOnly(false);
    setSharedPick(null);
    setPriceBand("any");
    setMileageBand("any");
    setMonthlyBand("any");
  }

  function handleFinanceTerms(next) {
    setFinanceTerms(next);
    saveFinanceTerms(next);
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
    const index = cars.findIndex((car) => car.id === id);

    if (index === -1) return;

    // Read out here rather than inside the updater: the shortlist prune
    // effect strips the id the moment the car leaves the inventory, so by
    // the time anyone asks whether it was starred the answer is already no.
    setDeleted({ car: cars[index], index, wasSaved: shortlist.includes(id) });

    setCars((currentCars) =>
      currentCars.filter((car) => car.id !== id)
    );

    setSelectedCar((currentCar) =>
      currentCar?.id === id ? null : currentCar
    );
  }

  function undoDelete() {
    if (!deleted) return;

    const { car, index, wasSaved } = deleted;

    setCars((currentCars) => {
      if (currentCars.some((existing) => existing.id === car.id)) return currentCars;

      const next = [...currentCars];

      // The inventory can have shrunk further while the banner was up, so
      // the old index is a preference rather than a promise.
      next.splice(Math.min(index, next.length), 0, car);

      return next;
    });

    if (wasSaved) {
      setShortlist((currentShortlist) =>
        currentShortlist.includes(car.id)
          ? currentShortlist
          : [...currentShortlist, car.id]
      );
    }

    setDeleted(null);
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
              value={monthlyBand}
              onChange={(event) => setMonthlyBand(event.target.value)}
              aria-label="Filter by estimated monthly payment"
            >
              {monthlyBands.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                  {band.value === "any" ? "" : ` (${monthlyCounts[band.value] || 0})`}
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
            financeTerms={financeTerms}
            onClose={() => setComparing(false)}
            onRemove={handleToggleShortlist}
          />
        )}

        <div className="cars-grid">
          {filteredCars.map((car, index) => (
            <CarCard
              key={car.id}
              car={car}
              booking={bookingForCar(bookings, car.id)}
              index={index}
              selected={selectedCar?.id === car.id}
              shortlisted={shortlist.includes(car.id)}
              onSelect={setSelectedCar}
              onAdd={handleAddCar}
              onDelete={handleDeleteCar}
              onToggleShortlist={handleToggleShortlist}
              financeTerms={financeTerms}
            />
          ))}

          {filteredCars.length === 0 && (
            <div className="empty-state">
              <span>⌕</span>
              <h3>No vehicles found</h3>
              <p>
                {sharedPick && pickedCars.length === 0
                  ? "None of the shared vehicles are in this inventory any more."
                  : shortlistOnly && shortlist.length === 0
                  ? "You have not saved any vehicles yet. Tap the star on a card to shortlist it."
                  : monthlyBand !== "any"
                  ? `Nothing comes in ${findMonthlyBand(monthlyBand).label.toLowerCase()} on these terms. A longer term or a bigger deposit brings the payment down.`
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

      {/* Anchored to the viewport rather than the grid: the card it came
          from can be well off screen by the time this appears, and an undo
          nobody scrolls to is not an undo. */}
      {deleted && (
        <div className="undo-bar" role="status">
          <span>
            Removed <strong>{deleted.car.name}</strong>
          </span>

          <button onClick={undoDelete}>Undo</button>

          <button
            className="undo-bar-close"
            onClick={() => setDeleted(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <aside className="details-sidebar">
        {selectedCar ? (
          <CarDetails
            car={selectedCar}
            booking={bookingForCar(bookings, selectedCar.id)}
            onBookingsChange={setBookings}
            financeTerms={financeTerms}
            onChangeFinanceTerms={handleFinanceTerms}
          />
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