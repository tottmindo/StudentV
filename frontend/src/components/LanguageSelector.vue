<template>
  <label class="inline-flex items-center gap-2 text-sm font-semibold">
    <span class="sr-only">{{ t('language.label') }}</span>
    <select
      :value="locale"
      :aria-label="t('language.label')"
      class="rounded-lg border border-border-border bg-background px-2 py-1.5 text-text dark:bg-background-dark dark:text-text-dark"
      @change="changeLocale"
    >
      <option value="en">{{ t('language.english') }}</option>
      <option value="sv">{{ t('language.swedish') }}</option>
    </select>
  </label>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale, type AppLocale } from '@/i18n'

const { locale, t } = useI18n()
function changeLocale(event: Event) {
  setLocale((event.target as HTMLSelectElement).value as AppLocale)
}
</script>
