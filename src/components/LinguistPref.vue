<script lang="ts" setup>
import type { BreakdownCategory } from "@/utils/breakdown";
import {
  LINGUIST_ATTRIBUTES,
  LINGUIST_TARGET_GENERATED,
  LINGUIST_TARGET_NONE,
  type LinguistAttribute,
  type LinguistMappings,
} from "@/utils/linguist";

const mappings = defineModel<LinguistMappings>("mappings", { required: true });
const props = defineProps<{
  categories: BreakdownCategory[];
}>();

function update(attribute: LinguistAttribute, target: string) {
  mappings.value = { ...mappings.value, [attribute]: target };
}

/**
 * A mapping to a category that has since been deleted behaves like "no special handling", so
 * show it that way.
 */
function effectiveTarget(attribute: LinguistAttribute): string {
  const target = mappings.value[attribute];
  if (target === LINGUIST_TARGET_GENERATED || target === LINGUIST_TARGET_NONE)
    return target;
  return props.categories.some((category) => category.id === target)
    ? target
    : LINGUIST_TARGET_NONE;
}

const { t } = i18n;
</script>

<template>
  <li class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <p class="font-medium text-base-content text-lg">
        {{ t("options.linguist.title") }}
      </p>
      <p class="text-base">
        {{ t("options.linguist.description1") }}
        <a
          class="link link-secondary"
          href="https://github.com/github-linguist/linguist/blob/main/docs/overrides.md"
          target="_blank"
          >{{ t("options.linguist.description2") }}</a
        >{{ t("options.linguist.description3") }}
      </p>
    </div>

    <div class="rounded border divide-y">
      <div
        v-for="attribute in LINGUIST_ATTRIBUTES"
        :key="attribute"
        class="flex items-center gap-4 p-2"
      >
        <code class="flex-1 font-mono text-sm">{{ attribute }}</code>
        <select
          class="select select-bordered select-sm w-72"
          :value="effectiveTarget(attribute)"
          :aria-label="attribute"
          @change="
            update(attribute, ($event.target as HTMLSelectElement).value)
          "
        >
          <option :value="LINGUIST_TARGET_GENERATED">
            {{ t("options.linguist.targetGenerated") }}
          </option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.icon }} {{ category.name }}
          </option>
          <option :value="LINGUIST_TARGET_NONE">
            {{ t("options.linguist.targetNone") }}
          </option>
        </select>
      </div>
    </div>
  </li>
</template>
