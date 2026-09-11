import { describe, expect, it, vi } from "vitest";
import { isProxy } from "vue";
import { useForm } from "../useForm";

interface Item {
  id: string;
  name: string;
}

function setup() {
  const save = vi.fn<(state: { items: Item[] }) => void>();
  const form = useForm<{ items: Item[] }>(
    {
      items: [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ],
    },
    save,
  );
  return { ...form, save };
}

describe("useForm", () => {
  it("should pass plain data to save even when the state holds reactive proxies", async () => {
    const { state, hasChanges, saveChanges, save } = setup();

    // Mapping a reactive array yields a plain array whose untouched items are still proxies.
    state.items = state.items.map((item, i) =>
      i === 0 ? { ...item, name: "Changed" } : item,
    );
    expect(hasChanges.value).toBe(true);

    await saveChanges();

    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0]?.[0];
    expect(saved).toEqual({
      items: [
        { id: "a", name: "Changed" },
        { id: "b", name: "B" },
      ],
    });
    expect(isProxy(saved?.items[1])).toBe(false);
    expect(() => structuredClone(saved)).not.toThrow();
    expect(hasChanges.value).toBe(false);
  });

  it("should not share nested references between the live and saved state", () => {
    const { state, hasChanges, reset } = setup();

    state.items[0]!.name = "Edited in place";
    expect(hasChanges.value).toBe(true);

    reset();
    expect(state.items[0]?.name).toBe("A");
    expect(hasChanges.value).toBe(false);

    state.items[0]!.name = "Edited again";
    expect(hasChanges.value).toBe(true);
  });
});
