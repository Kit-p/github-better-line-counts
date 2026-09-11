<script lang="ts" setup>
import IMdiDragVertical from "~icons/mdi/drag-vertical";
import IMdiArrowUp from "~icons/mdi/arrow-up";
import IMdiArrowDown from "~icons/mdi/arrow-down";
import IMdiTrashCanOutline from "~icons/mdi/trash-can-outline";
import {
  CATEGORY_COLORS,
  SUGGESTED_CATEGORY_ICONS,
  type BreakdownCategory,
} from "@/utils/breakdown";

const props = defineProps<{
  category: BreakdownCategory;
  isFirst: boolean;
  isLast: boolean;
}>();

const emits = defineEmits<{
  (event: "update:category", category: BreakdownCategory): void;
  (event: "remove"): void;
  (event: "moveUp"): void;
  (event: "moveDown"): void;
}>();

function update<K extends keyof BreakdownCategory>(
  key: K,
  value: BreakdownCategory[K],
) {
  emits("update:category", { ...props.category, [key]: value });
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
}

const { t } = i18n;
</script>

<template>
  <li
    class="rounded border divide-y border-l-4"
    :style="{ borderLeftColor: category.color }"
  >
    <div class="flex items-center gap-2 p-2">
      <span
        class="drag-handle cursor-grab opacity-60 hover:opacity-100"
        :title="t('options.breakdown.drag')"
      >
        <i-mdi-drag-vertical />
      </span>

      <!-- Icon picker -->
      <div class="dropdown">
        <div
          tabindex="0"
          role="button"
          class="btn btn-sm w-12 text-base"
          :title="t('options.breakdown.iconLabel')"
        >
          {{ category.icon || "…" }}
        </div>
        <div
          tabindex="0"
          class="dropdown-content z-10 mt-1 p-2 bg-base-100 rounded-box shadow border w-52 flex flex-wrap gap-1"
        >
          <button
            v-for="icon in SUGGESTED_CATEGORY_ICONS"
            :key="icon"
            class="btn btn-ghost btn-sm btn-square text-base"
            :class="{ 'btn-active': icon === category.icon }"
            type="button"
            @click="update('icon', icon)"
          >
            {{ icon }}
          </button>
        </div>
      </div>

      <input
        class="input input-bordered input-sm flex-1 font-bold"
        :value="category.name"
        :placeholder="t('options.breakdown.namePlaceholder')"
        :aria-label="t('options.breakdown.nameLabel')"
        @input="update('name', inputValue($event))"
      />

      <!-- Color picker -->
      <div class="dropdown dropdown-end">
        <div
          tabindex="0"
          role="button"
          class="btn btn-sm btn-square"
          :title="t('options.breakdown.colorLabel')"
          :aria-label="t('options.breakdown.colorLabel')"
        >
          <span
            class="inline-block size-4 rounded-full"
            :style="{ backgroundColor: category.color }"
          />
        </div>
        <div
          tabindex="0"
          class="dropdown-content z-10 mt-1 p-2 bg-base-100 rounded-box shadow border w-52 flex flex-wrap gap-1"
        >
          <button
            v-for="color in CATEGORY_COLORS"
            :key="color"
            class="btn btn-ghost btn-sm btn-square"
            :class="{ 'btn-active': color === category.color }"
            type="button"
            :title="color"
            @click="update('color', color)"
          >
            <span
              class="inline-block size-4 rounded-full"
              :style="{ backgroundColor: color }"
            />
          </button>
          <!-- Escape hatch: any color via the native picker -->
          <label
            class="btn btn-ghost btn-sm btn-square relative cursor-pointer"
            :class="{ 'btn-active': !CATEGORY_COLORS.includes(category.color) }"
            :title="t('options.breakdown.customColor')"
          >
            <span
              class="inline-block size-4 rounded-full"
              style="
                background: conic-gradient(
                  #cf222e,
                  #bf8700,
                  #1a7f37,
                  #0969da,
                  #8250df,
                  #cf222e
                );
              "
            />
            <input
              class="absolute inset-0 cursor-pointer opacity-0"
              type="color"
              :value="category.color"
              :aria-label="t('options.breakdown.customColor')"
              @input="update('color', inputValue($event))"
            />
          </label>
        </div>
      </div>

      <button
        class="btn btn-ghost btn-sm btn-square"
        type="button"
        :disabled="isFirst"
        :title="t('options.breakdown.moveUp')"
        @click="emits('moveUp')"
      >
        <i-mdi-arrow-up />
      </button>
      <button
        class="btn btn-ghost btn-sm btn-square"
        type="button"
        :disabled="isLast"
        :title="t('options.breakdown.moveDown')"
        @click="emits('moveDown')"
      >
        <i-mdi-arrow-down />
      </button>
      <button
        class="btn btn-ghost btn-sm btn-square text-error"
        type="button"
        :title="t('options.breakdown.remove')"
        @click="emits('remove')"
      >
        <i-mdi-trash-can-outline />
      </button>
    </div>

    <textarea
      class="font-mono p-2 w-full resize-y m-0 outline-none border-0 -mb-1 min-h-[5rem]"
      :placeholder="t('options.breakdown.patternsPlaceholder')"
      :aria-label="t('options.breakdown.patternsLabel')"
      :value="category.patterns"
      @input="update('patterns', inputValue($event))"
    />
  </li>
</template>
