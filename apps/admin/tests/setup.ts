// Store files rely on Nuxt's compile-time auto-imports (ref, computed,
// defineStore, composables) rather than explicit imports. Vitest runs the
// raw source without that transform, so the handful of identifiers actually
// used by the stores under test are stubbed as globals here instead of
// pulling in the full @nuxt/test-utils runtime.
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { vi } from "vitest";
import { mapStoreError } from "../app/composables/mapStoreError";

vi.stubGlobal("ref", ref);
vi.stubGlobal("computed", computed);
vi.stubGlobal("defineStore", defineStore);
vi.stubGlobal("mapStoreError", mapStoreError);
vi.stubGlobal("navigateTo", vi.fn());
