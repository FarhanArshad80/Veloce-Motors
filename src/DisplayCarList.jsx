import React, { useEffect, useMemo, useState } from "react";
import CarCard from "./CarCard";
import CarDetails from "./CarDetails";

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

// Prices are stored as display strings like "$22,000"
function parsePrice(price) {
  const digits = String(price).replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(digits);

  return Number.isNaN(value) ? 0 : value;
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
  const [cars, setCars] = useState(getInitialCars);
  const [selectedCar, setSelectedCar] = useState(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    localStorage.setItem("veloce-cars", JSON.stringify(cars));
  }, [cars]);

  const categories = [
    "All",
    ...new Set(cars.map((car) => car.type || "Other")),
  ];

  const filteredCars = useMemo(() => {
    const matching = cars.filter((car) => {
      const searchableText = `
        ${car.name}
        ${car.color}
        ${car.type}
        ${car.year}
        ${car.description}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(
        query.toLowerCase()
      );

      const matchesFilter =
        activeFilter === "All" ||
        (car.type || "Other") === activeFilter;

      return matchesSearch && matchesFilter;
    });

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
  }, [cars, query, activeFilter, sortBy]);

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
              {cars.length} vehicles available
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
            </button>
          ))}
        </div>

        <div className="cars-grid">
          {filteredCars.map((car, index) => (
            <CarCard
              key={car.id}
              car={car}
              index={index}
              selected={selectedCar?.id === car.id}
              onSelect={setSelectedCar}
              onAdd={handleAddCar}
              onDelete={handleDeleteCar}
            />
          ))}

          {filteredCars.length === 0 && (
            <div className="empty-state">
              <span>⌕</span>
              <h3>No vehicles found</h3>
              <p>
                Try another search term or category.
              </p>
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