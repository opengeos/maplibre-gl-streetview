import type { LngLatLike } from 'maplibre-gl';
import { LngLat } from 'maplibre-gl';
import type { BoundingBox } from '../core/types';

/**
 * Converts a LngLatLike to a LngLat object.
 *
 * @param lngLat - The location to convert
 * @returns A LngLat object
 */
export function toLngLat(lngLat: LngLatLike): LngLat {
  if (lngLat instanceof LngLat) {
    return lngLat;
  }
  if (Array.isArray(lngLat)) {
    return new LngLat(lngLat[0], lngLat[1]);
  }
  if ('lng' in lngLat && 'lat' in lngLat) {
    return new LngLat(lngLat.lng, lngLat.lat);
  }
  if ('lon' in lngLat && 'lat' in lngLat) {
    return new LngLat((lngLat as { lon: number; lat: number }).lon, lngLat.lat);
  }
  throw new Error('Invalid LngLatLike object');
}

/**
 * Creates a bounding box around a point with a given radius in meters.
 *
 * @param center - The center point
 * @param radiusMeters - The radius in meters
 * @returns A bounding box object
 */
export function createBbox(center: LngLatLike, radiusMeters: number): BoundingBox {
  const point = toLngLat(center);
  const lat = point.lat;
  const lng = point.lng;

  // Earth's radius in meters
  const earthRadius = 6371000;

  // Convert radius from meters to degrees
  // Latitude: 1 degree = ~111km
  const latDelta = (radiusMeters / earthRadius) * (180 / Math.PI);

  // Longitude: varies by latitude
  const lngDelta = (radiusMeters / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);

  return {
    minLng: lng - lngDelta,
    minLat: lat - latDelta,
    maxLng: lng + lngDelta,
    maxLat: lat + latDelta,
  };
}

/**
 * Converts a bounding box to a string for API queries.
 *
 * @param bbox - The bounding box
 * @returns A string in the format "minLng,minLat,maxLng,maxLat"
 */
export function bboxToString(bbox: BoundingBox): string {
  return `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`;
}

/**
 * Calculates the distance between two points in meters using the Haversine formula.
 *
 * @param from - The starting point
 * @param to - The ending point
 * @returns The distance in meters
 */
export function calculateDistance(from: LngLatLike, to: LngLatLike): number {
  const p1 = toLngLat(from);
  const p2 = toLngLat(to);

  const R = 6371000; // Earth's radius in meters
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates the bearing from one point to another.
 *
 * @param from - The starting point
 * @param to - The ending point
 * @returns The bearing in degrees (0-360)
 */
export function calculateBearing(from: LngLatLike, to: LngLatLike): number {
  const p1 = toLngLat(from);
  const p2 = toLngLat(to);

  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const lng1 = (p1.lng * Math.PI) / 180;
  const lng2 = (p2.lng * Math.PI) / 180;

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Finds the closest point from an array of points.
 *
 * @param target - The target point
 * @param points - Array of points to search
 * @returns The closest point or null if array is empty
 */
export function findClosestPoint<T extends { location: LngLat }>(
  target: LngLatLike,
  points: T[]
): T | null {
  if (points.length === 0) return null;

  let closest = points[0];
  let minDistance = calculateDistance(target, closest.location);

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance(target, points[i].location);
    if (distance < minDistance) {
      minDistance = distance;
      closest = points[i];
    }
  }

  return closest;
}
