<template>
  <button
    type="button"
    class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-surface-dark"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/shared/composables/theme'

const { t } = useI18n()
const { isDark, toggleTheme } = useTheme()
const label = computed(() => t(isDark.value ? 'theme.switchToLight' : 'theme.switchToDark'))
</script>
