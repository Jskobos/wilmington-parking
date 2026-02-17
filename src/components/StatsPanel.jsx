export default function StatsPanel({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-panel">
      <h1>Wilmington, DE</h1>
      <h2>Parking Coverage</h2>

      <div className="stat-grid">
        <div className="stat-card highlight">
          <span className="stat-value">{stats.parkingPercent.toFixed(1)}%</span>
          <span className="stat-label">of city area is parking</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{stats.parkingCount}</span>
          <span className="stat-label">parking areas</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{stats.parkingAreaAcres.toFixed(0)}</span>
          <span className="stat-label">acres of parking</span>
        </div>

        <div className="stat-card">
          <span className="stat-value">{stats.cityAreaSqMi.toFixed(1)}</span>
          <span className="stat-label">sq mi city area</span>
        </div>
      </div>

      <p className="footnote">
        Data from OpenStreetMap. Includes surface lots and garages tagged with
        amenity=parking, building=parking, or landuse=parking.
      </p>
    </div>
  );
}
