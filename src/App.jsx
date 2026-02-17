import { useParkingData } from "./hooks/useParkingData";
import Map from "./components/Map";
import StatsPanel from "./components/StatsPanel";
import "./App.css";

export default function App() {
  const { parkingGeoJSON, boundaryGeoJSON, stats, loading } = useParkingData();

  if (loading) {
    return (
      <div className="loading">
        <p>Loading parking data...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <StatsPanel stats={stats} />
      <div className="map-container">
        <Map
          parkingGeoJSON={parkingGeoJSON}
          boundaryGeoJSON={boundaryGeoJSON}
        />
      </div>
    </div>
  );
}
