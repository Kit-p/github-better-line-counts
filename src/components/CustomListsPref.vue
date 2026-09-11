<script lang="ts" setup>
import { computed } from "vue";
import IMdiRestore from "~icons/mdi/restore";
import type { CustomLists } from "@/utils/storage";
import CustomListItem from "./CustomListItem.vue";

const customLists = defineModel<CustomLists>("customLists", { required: true });

const all = computed({
  get() {
    return customLists.value.all;
  },
  set(newAll) {
    customLists.value = {
      ...customLists.value,
      all: newAll,
    };
  },
});

// In-page confirmation: browser dialogs are suppressed in embedded options pages.
const restoreDialog = useTemplateRef<HTMLDialogElement>("restoreDialog");

function restoreDefaults() {
  all.value = DEFAULT_CUSTOM_LIST_ALL;
  restoreDialog.value?.close();
}

const { t } = i18n;
</script>

<template>
  <li class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <p class="font-medium text-base-content text-lg">
        {{ t("options.customLists.title") }}
      </p>
      <p class="text-base">
        {{ t("options.customLists.description1") }}
        <a
          class="link link-secondary"
          href="https://git-scm.com/docs/gitignore#_pattern_format"
          target="_blank"
          >{{ t("options.customLists.description2") }}</a
        >
        {{ t("options.customLists.description3") }}
      </p>
      <p class="text-sm opacity-70">{{ t("options.patternHint") }}</p>
    </div>

    <!-- All Repos -->
    <CustomListItem v-model:value="all">{{
      t("options.customLists.allRepos")
    }}</CustomListItem>

    <div>
      <button
        class="btn btn-sm btn-ghost"
        type="button"
        @click="restoreDialog?.showModal()"
      >
        <i-mdi-restore />
        {{ t("options.customLists.restoreDefaults") }}
      </button>
    </div>

    <dialog ref="restoreDialog" class="modal">
      <div class="modal-box">
        <p class="font-bold text-lg">
          {{ t("options.customLists.restoreDefaults") }}
        </p>
        <p class="py-4">
          {{ t("options.customLists.restoreDefaultsConfirm") }}
        </p>
        <div class="modal-action">
          <button class="btn" type="button" @click="restoreDialog?.close()">
            {{ t("cancel") }}
          </button>
          <button class="btn btn-error" type="button" @click="restoreDefaults">
            {{ t("options.customLists.restoreDefaults") }}
          </button>
        </div>
      </div>
    </dialog>
  </li>
</template>
