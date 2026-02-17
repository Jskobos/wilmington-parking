import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map({ parkingGeoJSON, boundaryGeoJSON }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-75.545, 39.742],
      zoom: 14.5,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !parkingGeoJSON || !boundaryGeoJSON) return;

    function addLayers() {
      // City boundary
      if (!map.getSource("boundary")) {
        map.addSource("boundary", {
          type: "geojson",
          data: boundaryGeoJSON,
        });

        map.addLayer({
          id: "boundary-line",
          type: "line",
          source: "boundary",
          paint: {
            "line-color": "#374151",
            "line-width": 2,
            "line-dasharray": [4, 3],
          },
        });
      }

      // Parking polygons
      if (!map.getSource("parking")) {
        map.addSource("parking", {
          type: "geojson",
          data: parkingGeoJSON,
        });

        map.addLayer({
          id: "parking-fill",
          type: "fill",
          source: "parking",
          paint: {
            "fill-color": "#ef4444",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.7,
              0.5,
            ],
          },
        });

        map.addLayer({
          id: "parking-outline",
          type: "line",
          source: "parking",
          paint: {
            "line-color": "#dc2626",
            "line-width": 1,
          },
        });
      }

      function esc(str) {
        const el = document.createElement("div");
        el.textContent = str;
        return el.innerHTML;
      }

      // Hover interaction
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      let hoveredId = null;

      map.on("mousemove", "parking-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features[0];

        if (hoveredId !== null) {
          map.setFeatureState(
            { source: "parking", id: hoveredId },
            { hover: false }
          );
        }
        hoveredId = feature.id;
        map.setFeatureState(
          { source: "parking", id: hoveredId },
          { hover: true }
        );

        const props = feature.properties;
        const name = esc(props.name || "Unnamed parking");
        const type = props.parking || props.building === "parking" ? "Garage" : "Surface lot";
        const operator = props.operator ? `<br>Operator: ${esc(props.operator)}` : "";
        const access = props.access ? `<br>Access: ${esc(props.access)}` : "";
        const capacity = props.capacity ? `<br>Capacity: ${esc(props.capacity)}` : "";

        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${name}</strong><br>${type}${operator}${access}${capacity}`
          )
          .addTo(map);
      });

      map.on("mouseleave", "parking-fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: "parking", id: hoveredId },
            { hover: false }
          );
        }
        hoveredId = null;
        popup.remove();
      });
    }

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.on("load", addLayers);
    }
  }, [parkingGeoJSON, boundaryGeoJSON]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
