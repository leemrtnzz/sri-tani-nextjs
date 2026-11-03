export type Coordinate = [number, number];

export const DEFAULT_MAP_CENTER: Coordinate = [-6.12, 106.15];
export const DEFAULT_PLOT_COLOR = '#16a34a';

export function isValidCoordinate(value: unknown): value is Coordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= -90 &&
    value[0] <= 90 &&
    value[1] >= -180 &&
    value[1] <= 180
  );
}

export function isValidPolygon(value: unknown): value is Coordinate[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every(isValidCoordinate)
  );
}

export function polygonAreaHa(coords: Coordinate[]): number {
  if (!isValidPolygon(coords) || coords.length < 3) return 0;

  const meanLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const metersPerDegreeLat = 111_132.92;
  const metersPerDegreeLng = 111_320 * Math.cos((meanLat * Math.PI) / 180);

  const projected = coords.map(([lat, lng]) => [
    lng * metersPerDegreeLng,
    lat * metersPerDegreeLat,
  ]);

  let sum = 0;
  for (let index = 0; index < projected.length; index += 1) {
    const [x1, y1] = projected[index];
    const [x2, y2] = projected[(index + 1) % projected.length];
    sum += x1 * y2 - x2 * y1;
  }

  const squareMeters = Math.abs(sum) / 2;
  return Math.round((squareMeters / 10_000) * 100) / 100;
}

export function polygonCenter(coords: Coordinate[]): Coordinate {
  if (!Array.isArray(coords) || coords.length === 0) return DEFAULT_MAP_CENTER;
  const total = coords.reduce(
    (acc, [lat, lng]) => {
      acc.lat += lat;
      acc.lng += lng;
      return acc;
    },
    { lat: 0, lng: 0 },
  );
  return [
    Number((total.lat / coords.length).toFixed(6)),
    Number((total.lng / coords.length).toFixed(6)),
  ];
}

export const PLOT_COLORS = [
  '#16a34a',
  '#0d9488',
  '#2563eb',
  '#b48327',
  '#dc2626',
  '#7c3aed',
  '#ca8a04',
  '#0891b2',
];
