<script lang="ts" setup>
import IMdiDownload from "~icons/mdi/download";
import IMdiUpload from "~icons/mdi/upload";
import {
  parseSettings,
  serializeSettings,
  type TransferableSettings,
} from "@/utils/settingsTransfer";

const props = defineProps<{
  settings: TransferableSettings;
}>();

const emits = defineEmits<{
  (event: "import", settings: TransferableSettings): void;
}>();

const { t } = i18n;

const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
const confirmDialog = useTemplateRef<HTMLDialogElement>("confirmDialog");
const pending = ref<TransferableSettings>();
const error = ref<string>();

function exportSettings() {
  const blob = new Blob([serializeSettings(props.settings)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "github-better-line-counts-settings.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  error.value = undefined;
  try {
    pending.value = parseSettings(await file.text());
    confirmDialog.value?.showModal();
  } catch (err) {
    error.value = t("options.transfer.invalidFile", [
      err instanceof Error ? err.message : String(err),
    ]);
  }
}

function confirmImport() {
  if (pending.value) emits("import", pending.value);
  pending.value = undefined;
  confirmDialog.value?.close();
}
</script>

<template>
  <li class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <p class="font-medium text-base-content text-lg">
        {{ t("options.transfer.title") }}
      </p>
      <p class="text-base">{{ t("options.transfer.description") }}</p>
    </div>

    <div class="flex gap-2">
      <button class="btn btn-sm" type="button" @click="exportSettings">
        <i-mdi-download />
        {{ t("options.transfer.export") }}
      </button>
      <button class="btn btn-sm" type="button" @click="fileInput?.click()">
        <i-mdi-upload />
        {{ t("options.transfer.import") }}
      </button>
      <input
        ref="fileInput"
        class="hidden"
        type="file"
        accept="application/json,.json"
        @change="onFileChosen"
      />
    </div>
    <p v-if="error" class="text-sm text-error">{{ error }}</p>

    <dialog ref="confirmDialog" class="modal">
      <div class="modal-box">
        <p class="font-bold text-lg">{{ t("options.transfer.import") }}</p>
        <p class="py-4">{{ t("options.transfer.importConfirm") }}</p>
        <div class="modal-action">
          <button class="btn" type="button" @click="confirmDialog?.close()">
            {{ t("cancel") }}
          </button>
          <button class="btn btn-warning" type="button" @click="confirmImport">
            {{ t("options.transfer.importAction") }}
          </button>
        </div>
      </div>
    </dialog>
  </li>
</template>
