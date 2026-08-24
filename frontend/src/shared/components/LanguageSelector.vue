<template>
  <button
    type="button"
    class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-2xl leading-none transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
    :aria-label="label"
    :title="label"
    @click="toggleLocale"
  >
    <span aria-hidden="true">{{ flag }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const { locale, t } = useI18n()
const isEnglish = computed(() => locale.value === 'en')
const flag = computed(() => isEnglish.value ? '🇬🇧' : '🇸🇪')
const label = computed(() => `${t('language.label')}: ${t(isEnglish.value ? 'language.english' : 'language.swedish')}`)

function toggleLocale() {
  setLocale(isEnglish.value ? 'sv' : 'en')
}
</script>
