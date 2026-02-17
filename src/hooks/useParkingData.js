import { useState, useEffect } from "react";
import area from "@turf/area";

const SQ_METERS_PER_SQ_MILE = 2_589_988.11;

export function useParkingData() {
  const [data, setData] = useState({
    parkingGeoJSON: null,
    boundaryGeoJSON: null,
    stats: null,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const [parkingRes, boundaryRes] = await Promise.all([
        fetch("/data/parking.geojson"),
        fetch("/data/boundary.geojson"),
      ]);

      const parkingGeoJSON = await parkingRes.json();
      const boundaryGeoJSON = await boundaryRes.json();

      // Compute city area from the boundary polygon
      const cityAreaSqM = boundaryGeoJSON.features.reduce(
        (sum, f) => sum + area(f),
        0
      );

      // Compute total parking area
      const parkingAreaSqM = parkingGeoJSON.features.reduce(
        (sum, f) => sum + area(f),
        0
      );

      const cityAreaSqMi = cityAreaSqM / SQ_METERS_PER_SQ_MILE;
      const parkingAreaSqMi = parkingAreaSqM / SQ_METERS_PER_SQ_MILE;
      const parkingPercent = (parkingAreaSqM / cityAreaSqM) * 100;

      setData({
        parkingGeoJSON,
        boundaryGeoJSON,
        stats: {
          cityAreaSqMi,
          parkingAreaSqMi,
          parkingAreaAcres: parkingAreaSqMi * 640,
          parkingPercent,
          parkingCount: parkingGeoJSON.features.length,
        },
        loading: false,
      });
    }

    load();
  }, []);

  return data;
}
