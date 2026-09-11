<script lang="ts" setup>
import type { BreakdownCategory } from "@/utils/breakdown";
import type { LinguistMappings } from "@/utils/linguist";
import { classifyFile, type Classifier } from "@/utils/classify";
import { parsePatterns } from "@/utils/patterns";

const props = defineProps<{
  generated: string;
  categories: BreakdownCategory[];
  linguist: LinguistMappings;
}>();

const { t } = i18n;

const path = ref("");

// Built from the unsaved form state so patterns can be tried before saving.
const classifier = computed<Classifier>(() => ({
  generated: parsePatterns(props.generated),
  categories: props.categories.map((category) => ({
    id: category.id,
    patterns: parsePatterns(category.patterns),
  })),
  linguist: props.linguist,
}));

const result = computed(() => {
  const file = path.value.trim().replace(/^\/+/, "");
  if (file === "") return undefined;

  const classification = classifyFile(file, classifier.value);
  if (classification.kind === "other") {
    return {
      label: t("options.pathTester.other"),
      detail: t("options.pathTester.noMatch"),
    };
  }
  const matched =
    "pattern" in classification.via
      ? classification.via.pattern
      : classification.via.attribute;
  const detail = t("options.pathTester.matched", [matched]);
  if (classification.kind === "generated") {
    return { label: t("options.pathTester.generated"), detail };
  }
  const category = props.categories.find(
    (candidate) => candidate.id === classification.categoryId,
  );
  return {
    label:
      `${category?.icon ?? ""} ${category?.name ?? classification.categoryId}`.trim(),
    detail,
  };
});
</script>

<template>
  <li class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <p class="font-medium text-base-content text-lg">
        {{ t("options.pathTester.title") }}
      </p>
      <p class="text-base">{{ t("options.pathTester.description") }}</p>
    </div>

    <input
      class="input input-bordered w-full font-mono"
      v-model="path"
      :placeholder="t('options.pathTester.placeholder')"
      spellcheck="false"
    />
    <p v-if="result" class="flex flex-wrap items-baseline gap-2">
      <span class="badge badge-primary">{{ result.label }}</span>
      <span class="text-sm opacity-70">{{ result.detail }}</span>
    </p>
  </li>
</template>
