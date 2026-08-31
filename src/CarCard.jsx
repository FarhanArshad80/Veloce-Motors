import React, { useState } from "react";

const fallbackImages = {
  sedan:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=85",

  coupe:
    "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=85",

  electric:
    "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=85",

  luxury:
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85",

  suv:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85",

  performance:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85",

  default:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85",
};

function getCarType(car) {
  const name = (car.name || "").toLowerCase();
  const type = (car.type || "").toLowerCase();

  if (type) {
    return type;
  }

  if (
    name.includes("mustang") ||
    name.includes("camaro") ||
    name.includes("porsche") ||
    name.includes("audi r8")
  ) {
    return "performance";
  }

  if (
    name.includes("tesla") ||
    name.includes("electric")
  ) {
    return "electric";
  }

  if (
    name.includes("bmw") ||
    name.includes("mercedes") ||
    name.includes("audi")
  ) {
    return "luxury";
  }

  if (
    name.includes("sportage") ||
    name.includes("rover") ||
    name.includes("suv")
  ) {
    return "suv";
  }

  if (
    name.includes("civic") ||
    name.includes("corolla") ||
    name.includes("elantra")
  ) {
    return "sedan";
  }

  return "default";
}

function getFallbackImage(car) {
  const type = getCarType(car);
  return fallbackImages[type] || fallbackImages.default;
}

function getDescription(car) {
  if (car.description && car.description.trim()) {
    return car.description;
  }

  const type = getCarType(car);

  const descriptions = {
    sedan:
      "A refined and dependable sedan offering excellent comfort, smooth handling and impressive everyday efficiency.",
    coupe:
      "A stylish performance coupe created for confident driving, bold road presence and an exciting experience.",
    electric:
      "A modern electric vehicle with instant acceleration, intelligent technology and a quiet premium cabin.",
    luxury:
      "A sophisticated luxury vehicle combining elegant design, advanced technology and a first-class driving experience.",
    suv:
      "A practical and powerful SUV with generous space, comfortable seating and the confidence to handle every journey.",
    performance:
      "A thrilling performance car delivering dramatic styling, responsive handling and unforgettable acceleration.",
    default:
      "A carefully selected premium vehicle offering comfort, quality, style and dependable performance.",
  };

  return descriptions[type] || descriptions.default;
}

export default function CarCard({
  car,
  index = 0,
  selected,
  onSelect,
  onAdd,
  onDelete,
}) {
  const carType = getCarType(car);
  const imageSource = car.image || getFallbackImage(car);
  const description = getDescription(car);

  // Removing a vehicle is permanent — the inventory is written straight back
  // to storage — so the button asks once before it acts.
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  function handleImageError(event) {
    const fallback = getFallbackImage(car);

    if (event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback;
    } else {
      event.currentTarget.style.display = "none";
      event.currentTarget.parentElement.classList.add(
        "image-fallback-visible"
      );
    }

    event.currentTarget.onerror = null;
  }

  return (
    <article
      className={`car-card ${selected ? "selected-card" : ""}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
      onClick={() => onSelect(car)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onSelect(car);
        }
      }}
      tabIndex={0}
    >
      <div className="car-image-wrapper">
        <img
          src={imageSource}
          alt={`${car.name} vehicle`}
          className="car-image"
          onError={handleImageError}
        />

        <div className="image-fallback-content">
          <span>VELOCE</span>
          <strong>{car.name}</strong>
          <small>{carType}</small>
        </div>

        <div className="car-image-overlay"></div>

        <div className="car-category">
          {car.type || carType}
        </div>

        <div className="car-year">
          {car.year || "2024"}
        </div>
      </div>

      <div className="car-card-content">
        <div className="car-card-top">
          <div>
            <h3>{car.name}</h3>

            <p>
              {car.color || "Premium finish"}{" "}
              <span>•</span>{" "}
              {car.mileage || "Low mileage"}
            </p>
          </div>

          <strong>{car.price || "Price on request"}</strong>
        </div>

        <p className="car-card-description">
          {description}
        </p>

        <div className="car-card-divider"></div>

        <div className="car-card-specs">
          <span>
            <small>Engine</small>
            {car.engine || "Premium tuned"}
          </span>

          <span>
            <small>Power</small>
            {car.power || "Performance spec"}
          </span>
        </div>

        <div className="car-card-actions">
          <button
            className="card-gold-button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(car);
            }}
          >
            Duplicate
          </button>

          {confirmingRemove ? (
            <>
              <button
                className="card-confirm-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(car.id);
                }}
              >
                Confirm
              </button>

              <button
                className="card-delete-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmingRemove(false);
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="card-delete-button"
              onClick={(event) => {
                event.stopPropagation();
                setConfirmingRemove(true);
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </article>
  );
}