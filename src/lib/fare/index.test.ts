import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING, estimateFare, formatNpr, splitCommission } from "./index";

describe("estimateFare", () => {
  it("computes base + distance + time for a normal bike trip", () => {
    const fare = estimateFare({ serviceType: "bike", distanceKm: 5, durationMinutes: 15 });
    // base 30 + distance 5*15=75 + time 15*2=30 = 135, above the Rs.50 minimum
    expect(fare.baseFare).toBe(30);
    expect(fare.distanceFare).toBe(75);
    expect(fare.timeFare).toBe(30);
    expect(fare.subtotal).toBe(135);
    expect(fare.total).toBe(135);
  });

  it("enforces the service's minimum fare on very short trips", () => {
    const fare = estimateFare({ serviceType: "bike", distanceKm: 0.2, durationMinutes: 1 });
    expect(fare.subtotal).toBe(DEFAULT_PRICING.bike.minimumFare);
    expect(fare.total).toBe(DEFAULT_PRICING.bike.minimumFare);
  });

  it("applies the surge multiplier before the minimum-fare floor", () => {
    const base = estimateFare({ serviceType: "car", distanceKm: 10, durationMinutes: 20 });
    const surged = estimateFare({ serviceType: "car", distanceKm: 10, durationMinutes: 20, surgeMultiplier: 2 });
    expect(surged.subtotal).toBeCloseTo(base.subtotal * 2, 5);
  });

  it("subtracts a discount but never goes below zero", () => {
    const fare = estimateFare({ serviceType: "bike", distanceKm: 5, durationMinutes: 15, discount: 40 });
    expect(fare.total).toBe(95);

    const overDiscounted = estimateFare({ serviceType: "bike", distanceKm: 0.2, durationMinutes: 1, discount: 9999 });
    expect(overDiscounted.total).toBe(0);
  });

  it("adds the waiting charge when waiting minutes are given", () => {
    const withoutWaiting = estimateFare({ serviceType: "bike", distanceKm: 5, durationMinutes: 15 });
    const withWaiting = estimateFare({ serviceType: "bike", distanceKm: 5, durationMinutes: 15, waitingMinutes: 10 });
    expect(withWaiting.waitingCharge).toBe(10 * DEFAULT_PRICING.bike.waitingChargePerMinute);
    expect(withWaiting.total).toBe(withoutWaiting.total + withWaiting.waitingCharge);
  });

  it("clamps negative distance/duration inputs to zero instead of reducing the fare", () => {
    const fare = estimateFare({ serviceType: "bike", distanceKm: -5, durationMinutes: -10 });
    expect(fare.distanceFare).toBe(0);
    expect(fare.timeFare).toBe(0);
  });

  it("treats parcel service like bike pricing", () => {
    const parcel = estimateFare({ serviceType: "parcel", distanceKm: 5, durationMinutes: 15 });
    const bike = estimateFare({ serviceType: "bike", distanceKm: 5, durationMinutes: 15 });
    expect(parcel.total).toBe(bike.total);
  });

  it("rounds monetary values to 2 decimal places", () => {
    const fare = estimateFare({
      serviceType: "bike",
      distanceKm: 3.333,
      durationMinutes: 7.777,
      pricing: { bike: { baseFare: 30, perKm: 15.555, perMinute: 2.222, minimumFare: 0, waitingChargePerMinute: 1 } },
    });
    expect(Number.isInteger(fare.distanceFare * 100)).toBe(true);
    expect(Number.isInteger(fare.timeFare * 100)).toBe(true);
  });
});

describe("splitCommission", () => {
  it("splits a fare into platform and rider shares that sum back to the fare", () => {
    const split = splitCommission(602.35, 0.15);
    expect(split.platformShare + split.riderShare).toBeCloseTo(602.35, 5);
    expect(split.platformShare).toBe(90.35);
    expect(split.riderShare).toBe(512);
  });

  it("gives the rider the full fare at zero commission", () => {
    const split = splitCommission(500, 0);
    expect(split.platformShare).toBe(0);
    expect(split.riderShare).toBe(500);
  });
});

describe("formatNpr", () => {
  it("formats whole numbers with the Rs. prefix and no decimals", () => {
    expect(formatNpr(1234)).toBe("Rs. 1,234");
  });

  it("rounds fractional amounts for display", () => {
    expect(formatNpr(602.35)).toBe("Rs. 602");
  });

  it("formats zero correctly", () => {
    expect(formatNpr(0)).toBe("Rs. 0");
  });
});