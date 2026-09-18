import test from "node:test";
import assert from "node:assert/strict";
import { nextQuickTheme, resolveInitialTheme } from "./theme.js";

test("defaults to dark when storage has no valid theme", () => {
  assert.equal(resolveInitialTheme(null, false), "dark");
  assert.equal(resolveInitialTheme(null, true), "dark");
});

test("restores only supported stored themes", () => {
  assert.equal(resolveInitialTheme("light", true), "light");
  assert.equal(resolveInitialTheme("dark", false), "dark");
  assert.equal(resolveInitialTheme("high-contrast", false), "high-contrast");
  assert.equal(resolveInitialTheme("sepia", false), "dark");
});

test("quick toggle moves high contrast to light and alternates light/dark", () => {
  assert.equal(nextQuickTheme("high-contrast"), "light");
  assert.equal(nextQuickTheme("light"), "dark");
  assert.equal(nextQuickTheme("dark"), "light");
});
