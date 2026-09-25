import { expect, it } from "vitest";
import { rectangleArea, validArea } from "./MapAreaSelection";

it("normalizes drags in either direction into west south east north", () => {
  const a = { lat: 23, lng: 80 },
    b = { lat: 5, lng: 100 };
  expect(rectangleArea(a, b)).toEqual({
    west: 80,
    south: 5,
    east: 100,
    north: 23,
  });
  expect(rectangleArea(b, a)).toEqual(rectangleArea(a, b));
});
it("uses valid geographic coordinates for repeated world copies", () => {
  expect(rectangleArea({ lat: 5, lng: 410 }, { lat: 25, lng: 438 })).toEqual({
    west: 50,
    south: 5,
    east: 78,
    north: 25,
  });
  expect(rectangleArea({ lat: 5, lng: 170 }, { lat: 25, lng: 190 })).toBeNull();
});
it("rejects empty, inverted and invalid manual areas", () => {
  expect(rectangleArea({ lat: 5, lng: 50 }, { lat: 5, lng: 50 })).toBeNull();
  expect(validArea({ west: NaN, south: 5, east: 78, north: 25 })).toBe(false);
  expect(validArea({ west: 80, south: 5, east: 50, north: 25 })).toBe(false);
});
