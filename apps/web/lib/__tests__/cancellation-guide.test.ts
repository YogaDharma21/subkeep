import test from "node:test"
import assert from "node:assert/strict"
import { getCancellationGuide, GENERIC_CANCELLATION_STEPS } from "../default-templates.ts"

test("resolves cancellation guide for known exact match", () => {
  const guide = getCancellationGuide("Netflix")
  assert.equal(guide.isGeneric, false)
  assert.equal(guide.cancelUrl, "https://www.netflix.com/youraccount")
  assert.ok(guide.steps.length >= 3)
  assert.match(guide.steps[0], /Netflix/i)
})

test("resolves cancellation guide with case-insensitivity", () => {
  const guide = getCancellationGuide("sPoTiFy")
  assert.equal(guide.isGeneric, false)
  assert.equal(guide.cancelUrl, "https://www.spotify.com/account/subscription/")
  assert.ok(guide.steps.length >= 3)
  assert.match(guide.steps[0], /spotify/i)
})

test("resolves cancellation guide with substring matching", () => {
  const guideWithSuffix = getCancellationGuide("Adobe Creative Cloud All Apps")
  assert.equal(guideWithSuffix.isGeneric, false)
  assert.equal(guideWithSuffix.cancelUrl, "https://account.adobe.com/plans")

  const guideWithPrefix = getCancellationGuide("Creative Cloud")
  assert.equal(guideWithPrefix.isGeneric, false)
  assert.equal(guideWithPrefix.cancelUrl, "https://account.adobe.com/plans")
})

test("overrides default cancelUrl when customCancelUrl is provided", () => {
  const customUrl = "https://example.com/custom-cancel"
  const guide = getCancellationGuide("Netflix", customUrl)
  assert.equal(guide.isGeneric, false)
  assert.equal(guide.cancelUrl, customUrl)
  assert.ok(guide.steps.length >= 3)
})

test("falls back to generic guide for unknown service", () => {
  const customUrl = "https://customservice.io/cancel"
  const guide = getCancellationGuide("Unknown Mysterious App", customUrl)
  assert.equal(guide.isGeneric, true)
  assert.equal(guide.cancelUrl, customUrl)
  assert.deepEqual(guide.steps, GENERIC_CANCELLATION_STEPS)
  assert.equal(guide.steps.length, 4)
})

test("falls back to generic guide when name is missing or empty", () => {
  const guideEmpty = getCancellationGuide("")
  assert.equal(guideEmpty.isGeneric, true)
  assert.equal(guideEmpty.cancelUrl, undefined)
  assert.deepEqual(guideEmpty.steps, GENERIC_CANCELLATION_STEPS)

  const guideUndefined = getCancellationGuide(undefined)
  assert.equal(guideUndefined.isGeneric, true)
  assert.equal(guideUndefined.cancelUrl, undefined)
  assert.deepEqual(guideUndefined.steps, GENERIC_CANCELLATION_STEPS)
})

test("resolves cancellation guide for all top 17 services", () => {
  const topServices = [
    "Netflix",
    "Spotify",
    "Adobe Creative Cloud",
    "Disney+",
    "Prime Video",
    "Apple Music",
    "YouTube Music",
    "Microsoft 365",
    "Notion",
    "Slack",
    "Google One",
    "Dropbox",
    "Xbox Game Pass",
    "PlayStation Plus",
    "Duolingo Plus",
    "Canva Pro",
    "Figma",
  ]

  for (const service of topServices) {
    const guide = getCancellationGuide(service)
    assert.equal(guide.isGeneric, false, `Expected ${service} to resolve non-generic guide`)
    assert.ok(guide.steps.length >= 3, `Expected ${service} to have at least 3 steps`)
    assert.ok(guide.cancelUrl, `Expected ${service} to have a cancelUrl`)
  }
})
