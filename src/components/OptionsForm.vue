<script lang="ts" setup>
import TokenPref from "./TokenPref.vue";
import ShowGeneratedCountPref from "./ShowGeneratedCountPref.vue";
import CustomListsPref from "./CustomListsPref.vue";
import BreakdownPref from "./BreakdownPref.vue";
import LinguistPref from "./LinguistPref.vue";
import PathTesterPref from "./PathTesterPref.vue";
import SettingsTransferPref from "./SettingsTransferPref.vue";
import {
  hideGeneratedLineCountStorage,
  type CustomLists,
  githubPatStorage,
  customListsStorage,
  showBreakdownStorage,
  breakdownCategoriesStorage,
  linguistMappingsStorage,
} from "@/utils/storage";
import type { BreakdownCategory } from "@/utils/breakdown";
import type { LinguistMappings } from "@/utils/linguist";
import type { TransferableSettings } from "@/utils/settingsTransfer";

const { state, hasChanges, reset, saveChanges } = useForm<{
  hideGeneratedLineCount: boolean;
  githubPat: string;
  customLists: CustomLists;
  showBreakdown: boolean;
  breakdownCategories: BreakdownCategory[];
  linguistMappings: LinguistMappings;
}>(
  {
    hideGeneratedLineCount: await hideGeneratedLineCountStorage.getValue(),
    githubPat: await githubPatStorage.getValue(),
    // This value is set when extension is installed.
    customLists: await customListsStorage.getValue(),
    showBreakdown: await showBreakdownStorage.getValue(),
    breakdownCategories: await breakdownCategoriesStorage.getValue(),
    linguistMappings: await linguistMappingsStorage.getValue(),
  },
  async (newState) => {
    await hideGeneratedLineCountStorage.setValue(
      newState.hideGeneratedLineCount,
    );
    await githubPatStorage.setValue(newState.githubPat);
    await customListsStorage.setValue(newState.customLists);
    await showBreakdownStorage.setValue(newState.showBreakdown);
    await breakdownCategoriesStorage.setValue(newState.breakdownCategories);
    await linguistMappingsStorage.setValue(newState.linguistMappings);

    // Clear cache
    await commitHashDiffsCache.clear();
  },
);

const transferable = computed<TransferableSettings>(() => ({
  hideGeneratedLineCount: state.hideGeneratedLineCount,
  customLists: state.customLists,
  showBreakdown: state.showBreakdown,
  breakdownCategories: state.breakdownCategories,
  linguistMappings: state.linguistMappings,
}));

// Imported settings replace the form; they are persisted when the user saves.
function applyImport(settings: TransferableSettings) {
  Object.assign(state, settings);
}

const { t } = i18n;
</script>

<template>
  <form class="flex flex-col gap-8 pb-20" @submit.prevent="saveChanges">
    <TokenPref v-model:github-pat="state.githubPat" />
    <ShowGeneratedCountPref
      v-model:hide-generated-line-count="state.hideGeneratedLineCount"
    />
    <CustomListsPref v-model:custom-lists="state.customLists" />
    <BreakdownPref
      v-model:show-breakdown="state.showBreakdown"
      v-model:categories="state.breakdownCategories"
    />
    <LinguistPref
      v-model:mappings="state.linguistMappings"
      :categories="state.breakdownCategories"
    />
    <PathTesterPref
      :generated="state.customLists.all"
      :categories="state.breakdownCategories"
      :linguist="state.linguistMappings"
    />
    <SettingsTransferPref :settings="transferable" @import="applyImport" />

    <div
      class="fixed inset-x-0 bottom-0 bg-base-100 flex gap-4 p-4 border-t border-neutral border-opacity-10"
    >
      <button class="btn btn-primary" type="submit" :disabled="!hasChanges">
        {{ t("saveChanges") }}
      </button>
      <button class="btn" type="button" :disabled="!hasChanges" @click="reset">
        {{ t("discard") }}
      </button>
    </div>
  </form>
</template>
