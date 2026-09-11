<script lang="ts" setup>
import draggable from "vuedraggable";
import IMdiPlus from "~icons/mdi/plus";
import IMdiRestore from "~icons/mdi/restore";
import BreakdownCategoryItem from "./BreakdownCategoryItem.vue";
import {
  DEFAULT_BREAKDOWN_CATEGORIES,
  createBreakdownCategory,
  type BreakdownCategory,
} from "@/utils/breakdown";

const showBreakdown = defineModel<boolean>("showBreakdown", {
  required: true,
});
const categories = defineModel<BreakdownCategory[]>("categories", {
  required: true,
});

// The form tracks changes by deep-comparing against the saved state, so the array is always
// replaced instead of mutated in place.

function updateCategory(index: number, category: BreakdownCategory) {
  categories.value = categories.value.map((existing, i) =>
    i === index ? category : existing,
  );
}

function removeCategory(index: number) {
  categories.value = categories.value.filter((_, i) => i !== index);
}

function moveCategory(index: number, offset: number) {
  const target = index + offset;
  const moved = categories.value[index];
  if (!moved || target < 0 || target >= categories.value.length) return;

  const next = [...categories.value];
  next.splice(index, 1);
  next.splice(target, 0, moved);
  categories.value = next;
}

function addCategory() {
  categories.value = [
    ...categories.value,
    createBreakdownCategory(categories.value.map((category) => category.color)),
  ];
}

// Confirmation uses an in-page <dialog>: browser dialogs like confirm() are suppressed when the
// options page is embedded in chrome://extensions.
const restoreDialog = useTemplateRef<HTMLDialogElement>("restoreDialog");

function askRestoreDefaults() {
  restoreDialog.value?.showModal();
}

function restoreDefaults() {
  categories.value = structuredClone(DEFAULT_BREAKDOWN_CATEGORIES);
  restoreDialog.value?.close();
}

const { t } = i18n;
</script>

<template>
  <li class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <p class="font-medium text-base-content text-lg">
        {{ t("options.breakdown.title") }}
      </p>
      <p class="text-base">{{ t("options.breakdown.description") }}</p>
      <label class="text-base flex gap-4 items-center">
        <input
          class="checkbox checkbox-primary checkbox-sm ml-2"
          type="checkbox"
          v-model="showBreakdown"
        />
        <p>{{ t("options.breakdown.enable") }}</p>
      </label>
    </div>

    <!-- Categories -->
    <p class="text-sm opacity-70">
      {{ t("options.breakdown.orderHint") }}
      {{ t("options.patternHint") }}
    </p>
    <draggable
      v-model="categories"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      tag="ul"
      class="flex flex-col gap-3"
    >
      <template #item="{ element, index }">
        <BreakdownCategoryItem
          :category="element"
          :is-first="index === 0"
          :is-last="index === categories.length - 1"
          @update:category="updateCategory(index, $event)"
          @remove="removeCategory(index)"
          @move-up="moveCategory(index, -1)"
          @move-down="moveCategory(index, 1)"
        />
      </template>
    </draggable>

    <div class="flex gap-2">
      <button class="btn btn-sm" type="button" @click="addCategory">
        <i-mdi-plus />
        {{ t("options.breakdown.addCategory") }}
      </button>
      <button
        class="btn btn-sm btn-ghost"
        type="button"
        @click="askRestoreDefaults"
      >
        <i-mdi-restore />
        {{ t("options.breakdown.restoreDefaults") }}
      </button>
    </div>

    <!-- Restore defaults confirmation -->
    <dialog ref="restoreDialog" class="modal">
      <div class="modal-box">
        <p class="font-bold text-lg">
          {{ t("options.breakdown.restoreDefaults") }}
        </p>
        <p class="py-4">{{ t("options.breakdown.restoreDefaultsConfirm") }}</p>
        <div class="modal-action">
          <button class="btn" type="button" @click="restoreDialog?.close()">
            {{ t("cancel") }}
          </button>
          <button class="btn btn-error" type="button" @click="restoreDefaults">
            {{ t("options.breakdown.restoreDefaults") }}
          </button>
        </div>
      </div>
    </dialog>
  </li>
</template>
