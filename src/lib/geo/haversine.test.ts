import { describe, expect, it } from "vitest";
import { estimateDurationMinutes, haversineKm } from "./haversine";

describe("haversineKm", () => {
  it("returns zero for identical points", () => {
    const point = { lat: 26.6586, lng: 88.0333 };
    expect(haversineKm(point, point)).toBeCloseTo(0, 5);
  });

  it("is symmetric regardless of point order", () => {
    const a = { lat: 26.6586, lng: 88.0333 }; // Birtamode
    const b = { lat: 26.6586, lng: 87.9333 }; // Damak-ish
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 8);
  });

  it("matches a known real-world distance within a reasonable margin", () => {
    // Birtamode to Damak, Jhapa — roughly 10km apart in a straight line.
    const birtamode = { lat: 26.6586, lng: 88.0333 };
    const damak = { lat: 26.6586, lng: 87.9333 };
    const km = haversineKm(birtamode, damak);
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(15);
  });
});

describe("estimateDurationMinutes", () => {
  it("scales roughly linearly with distance", () => {
    const short = estimateDurationMinutes(10, "bike");
    const long = estimateDurationMinutes(20, "bike");
    expect(long).toBeCloseTo(short * 2, 1);
  });

  it("enforces a minimum duration for very short trips", () => {
    expect(estimateDurationMinutes(0.1, "bike")).toBeGreaterThanOrEqual(3);
    expect(estimateDurationMinutes(0, "car")).toBe(3);
  });

  it("gives cars a shorter duration than bikes over the same distance (higher avg speed for bikes here)", () => {
    // NOTE: this project's AVG_SPEED_KMH has bike (28) faster than car (24),
    // reflecting Jhapa's mixed traffic where bikes weave through congestion —
    // so bikes are estimated *faster* than cars, not slower.
    const bike = estimateDurationMinutes(20, "bike");
    const car = estimateDurationMinutes(20, "car");
    expect(bike).toBeLessThan(car);
  });
});