export default function MaintenanceCard({ tip }) {
  return (
    <article className="maintenance-card">
      <div className="maintenance-card-top">
        <span className="maintenance-number">
          {tip.number}
        </span>

        <span className="maintenance-icon">
          {tip.icon}
        </span>
      </div>

      <h3>{tip.title}</h3>

      <p>{tip.text}</p>

      <div className="maintenance-line"></div>
    </article>
  );
}