import React from "react";
import FinanceCalculator from "./FinanceCalculator";

export default function CarDetails({ car }) {
  function handleImageError(event) {
    event.currentTarget.style.display = "none";
    event.currentTarget.parentElement.classList.add(
      "details-image-fallback"
    );
  }

  function handleInquiry() {
    window.alert(
      `Thank you for your interest in the ${car.name}. Our team will contact you shortly.`
    );
  }

  return (
    <article className="car-details">
      <div className="details-image-wrapper">
        <img
          src={
            car.image ||
            "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85"
          }
          alt={`${car.name} vehicle`}
          className="details-image"
          onError={handleImageError}
        />

        <div className="details-image-fallback-content">
          <span>VELOCE MOTORS</span>
          <strong>{car.name}</strong>
        </div>

        <div className="details-image-overlay"></div>

        <div className="details-badge">
          Available now
        </div>
      </div>

      <div className="details-content">
        <div className="details-header">
          <div>
            <p className="details-eyebrow">
              Selected vehicle
            </p>

            <h2>{car.name}</h2>

            <p className="details-subtitle">
              {car.year || "2024"}{" "}
              {car.type || "Premium"} ·{" "}
              {car.color || "Premium finish"}
            </p>
          </div>

          <div className="details-status">
            ● In stock
          </div>
        </div>

        <div className="details-price-row">
          <div>
            <span>Starting price</span>
            <strong>{car.price || "Price on request"}</strong>
          </div>

          <div className="details-rating">
            <span>★</span>
            <strong>4.9</strong>
            <small>Owner rating</small>
          </div>
        </div>

        <p className="details-description">
          {car.description ||
            "A carefully selected premium vehicle offering comfort, quality, style and dependable performance."}
        </p>

        <FinanceCalculator car={car} />

        <div className="details-specifications">
          <div>
            <span>Year</span>
            <strong>{car.year || "2024"}</strong>
          </div>

          <div>
            <span>Mileage</span>
            <strong>{car.mileage || "Low mileage"}</strong>
          </div>

          <div>
            <span>Engine</span>
            <strong>{car.engine || "Premium tuned"}</strong>
          </div>

          <div>
            <span>Power</span>
            <strong>{car.power || "Performance spec"}</strong>
          </div>
        </div>

        <button
          className="details-action-button"
          onClick={handleInquiry}
        >
          Request information
          <span>→</span>
        </button>
      </div>
    </article>
  );
}