import { describe, expect, it } from "vitest";
import { cityOfPath, cityPath, isCity } from "@/lib/city";

// The city is the first part of every city page's address (D-98): /lagos/…, /abuja/….

describe("cityPath", () => {
  it("puts the city in front of a city page's path", () => {
    expect(cityPath("lagos", "/")).toBe("/lagos");
    expect(cityPath("lagos", "/cinemas")).toBe("/lagos/cinemas");
    expect(cityPath("abuja", "/soon")).toBe("/abuja/soon");
    expect(cityPath("lagos", "/film/ramayana#s=ebonylife-vi@2026-11-13T17:15:00Z")).toBe("/lagos/film/ramayana#s=ebonylife-vi@2026-11-13T17:15:00Z");
    expect(cityPath("lagos", "/?q=spider")).toBe("/lagos?q=spider");
  });
  it("leaves alone a path that already names a city, a page for both cities, and the site's own files", () => {
    expect(cityPath("abuja", "/lagos/cinemas")).toBe("/lagos/cinemas");
    expect(cityPath("lagos", "/about")).toBe("/about");
    expect(cityPath("lagos", "/data/search.json")).toBe("/data/search.json");
    expect(cityPath("lagos", "https://filmhouseng.com")).toBe("https://filmhouseng.com");
    expect(cityPath("lagos", "#times")).toBe("#times");
  });
});

describe("cityOfPath and isCity", () => {
  it("reads the city from an address", () => {
    expect(cityOfPath("/abuja/cinemas")).toBe("abuja");
    expect(cityOfPath("/lagos")).toBe("lagos");
    expect(cityOfPath("/about")).toBeNull();
    expect(cityOfPath("/lagosx")).toBeNull();
  });
  it("knows the two cities", () => {
    expect(isCity("lagos")).toBe(true);
    expect(isCity("ibadan")).toBe(false);
    expect(isCity(null)).toBe(false);
  });
});

describe("cityPath on pages for both cities", () => {
  it("leaves the kit and an About anchor alone", () => {
    expect(cityPath("lagos", "/kit")).toBe("/kit");
    expect(cityPath("lagos", "/about#sources")).toBe("/about#sources");
  });
});
