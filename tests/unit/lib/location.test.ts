import { describe, expect, it } from "vitest";
import { cityFromPosition } from "@/lib/location";

// Where are you watching? (D-65): the phone's position picks Lagos or Abuja, or neither. The
// position is only ever read on the phone (rule 11).

describe("cityFromPosition", () => {
  it("anywhere in Lagos is Lagos", () => {
    expect(cityFromPosition(6.4474, 3.4553)).toBe("lagos"); // Lekki Phase 1
    expect(cityFromPosition(6.6018, 3.3515)).toBe("lagos"); // Ikeja
    expect(cityFromPosition(6.6194, 3.5105)).toBe("lagos"); // Ikorodu
  });
  it("anywhere in Abuja is Abuja", () => {
    expect(cityFromPosition(9.0765, 7.4777)).toBe("abuja"); // Wuse
    expect(cityFromPosition(8.9406, 7.0826)).toBe("abuja"); // Lugbe
  });
  it("elsewhere is neither", () => {
    expect(cityFromPosition(7.3775, 3.947)).toBeNull(); // Ibadan
    expect(cityFromPosition(12.0022, 8.592)).toBeNull(); // Kano
    expect(cityFromPosition(51.5072, -0.1276)).toBeNull(); // London
  });
});
