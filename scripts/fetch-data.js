import { writeFileSync, mkdirSync } from "fs";
import osmtogeojson from "osmtogeojson";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function queryOverpass(query) {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchParking() {
  console.log("Fetching parking data from Overpass API...");

  // Wilmington, DE bounding box
  const bbox = "39.7100,-75.5900,39.7850,-75.5000";

  const query = `
    [out:json][timeout:60];
    (
      way["amenity"="parking"](${bbox});
      relation["amenity"="parking"](${bbox});
      way["building"="parking"](${bbox});
      relation["building"="parking"](${bbox});
      way["landuse"="parking"](${bbox});
    );
    out body geom;
  `;

  const data = await queryOverpass(query);
  const geojson = osmtogeojson(data);

  // Filter to only polygons (skip any point features)
  geojson.features = geojson.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
  );

  console.log(`Found ${geojson.features.length} parking polygons`);
  return geojson;
}

async function fetchBoundary() {
  console.log("Fetching Wilmington city boundary...");

  const query = `
    [out:json][timeout:60];
    relation(369472);
    out body geom;
  `;

  const data = await queryOverpass(query);
  const geojson = osmtogeojson(data);

  // Keep only the boundary polygon
  geojson.features = geojson.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
  );

  console.log(`Found ${geojson.features.length} boundary feature(s)`);
  return geojson;
}

async function main() {
  mkdirSync("public/data", { recursive: true });

  const parking = await fetchParking();
  const boundary = await fetchBoundary();

  writeFileSync("public/data/parking.geojson", JSON.stringify(parking, null, 2));
  console.log("Wrote public/data/parking.geojson");

  writeFileSync("public/data/boundary.geojson", JSON.stringify(boundary, null, 2));
  console.log("Wrote public/data/boundary.geojson");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
