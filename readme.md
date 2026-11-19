# Car Management & Showcase Application

A sleek, interactive web application built with React and Vite for exploring vehicle lineups, inspecting car details, and managing maintenance information.

## 🚀 Features in Veloce Motors

* **Dynamic Car Showcase**: Browse an interactive grid of available vehicles using reusable card components.
* **Detailed Vehicle View**: Inspect granular specifications, descriptions, and highlights for individual cars.
* **Maintenance Tracking**: View dedicated maintenance information and service details.
* **Trade-In Estimator**: In the finance panel, enter your current car's year, mileage, price when new and condition to get a rough value range. Tick the box to take the low end of that range off the price, and the monthly payment, amount financed and total update to match. Your entries are remembered between visits and can be cleared at any time.
* **Responsive CTA Section**: Sleek modern call-to-action interface for user inquiries and booking starts.

## 🛠️ Tech Stack

* **Frontend**: React (JSX)
* **Build Tool**: Vite
* **Styling**: CSS / Custom Styles (`styles.css`, `App.css`, `index.css`)
* **Linter**: ESLint

## 📁 Project Structure

```text
car/
├── public/
├── src/
│   ├── App.jsx              # Main layout and section renderer
│   ├── BookingsPanel.jsx    # Every booked test drive in one place
│   ├── CarCard.jsx          # Card component for individual car items
│   ├── CarDetails.jsx       # Detailed view panel for selected vehicle
│   ├── CompareTable.jsx     # Side-by-side comparison of chosen cars
│   ├── DisplayCarList.jsx   # Inventory grid, filters and sorting
│   ├── FinanceCalculator.jsx # Deposit, term and APR monthly estimate
│   ├── MaintenanceCard.jsx  # Card component for maintenance details
│   ├── TestDriveForm.jsx    # Book a test drive slot
│   ├── TradeInEstimator.jsx # Trade-in form shown inside the finance panel
│   ├── bookings.js          # Saved test drive bookings
│   ├── notes.js             # Your own notes on each vehicle
│   ├── pricing.js           # Price parsing and finance maths
│   ├── recent.js            # Recently viewed vehicles
│   ├── searches.js          # Saved searches
│   ├── similar.js           # Similar vehicles to the one open
│   ├── tradein.js           # Trade-in valuation rules and saved details
│   ├── main.jsx             # Application entry point
│   ├── App.css
│   ├── index.css            # Global typography and base styles
│   └── styles.css           # Custom component styles
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

## ▶️ Getting Started

```bash
git clone https://github.com/FarhanArshad80/Veloce-Motors.git
cd Veloce-Motors
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## 📜 Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload      |
| `npm run build`   | Build for production into `dist/`         |
| `npm run preview` | Serve the production build locally        |
| `npm run lint`    | Run ESLint                                |
| `npm run deploy`  | Build and publish to GitHub Pages         |
