import isDeepEqual from "fast-deep-equal";

/**
 * Deep copy plain form data, unwrapping reactive proxies at every level. This keeps `state` and
 * `resetState` from sharing nested arrays or objects, and hands the save callback plain data that
 * extension storage can serialize. (Arrays produced by mapping or filtering a reactive array still
 * contain proxies, which `structuredClone` and `browser.storage` reject.)
 */
function clone<T>(value: T): T {
  const raw = toRaw(value);
  if (Array.isArray(raw)) return raw.map((item) => clone(item)) as T;
  if (raw !== null && typeof raw === "object") {
    return Object.fromEntries(
      Object.entries(raw).map(([key, nested]) => [key, clone(nested)]),
    ) as T;
  }
  return raw;
}

export function useForm<T extends Record<string, any>>(
  initialState: T,
  saveChanges: (newState: T) => void | Promise<void>,
) {
  const resetState = reactive<T>(clone(initialState));
  const state = reactive<T>(clone(initialState));

  const hasChanges = computed(() => !isDeepEqual(state, resetState));

  return {
    state,
    hasChanges,
    reset() {
      Object.assign(state, clone(resetState));
    },
    async saveChanges() {
      if (!hasChanges.value) return;

      try {
        await saveChanges(clone(state) as T);
        Object.assign(resetState, clone(state));
      } catch (err) {
        console.error("Error saving changes:", err);
      }
    },
  };
}
