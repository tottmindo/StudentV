<template>
  <main class="mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-bold uppercase tracking-wider text-accent">{{ t('nav.administration') }}</p>
        <h1 class="text-3xl font-bold">{{ t('usageAdmin.title') }}</h1>
        <p class="mt-2 opacity-70">{{ t('usageAdmin.privacy') }}</p>
      </div>
      <label class="text-sm font-bold">{{ t('usageAdmin.period') }}
        <select v-model.number="days" class="ml-2 rounded-xl border border-border bg-transparent p-2 font-normal">
          <option :value="7">{{ t('stats.days', { count: 7 }) }}</option><option :value="30">{{ t('stats.days', { count: 30 }) }}</option><option :value="90">{{ t('stats.days', { count: 90 }) }}</option><option :value="365">{{ t('usageAdmin.year') }}</option>
        </select>
      </label>
    </header>

    <p v-if="error" class="rounded-xl bg-red-500/10 p-4 font-semibold text-red-600">{{ error }}</p>
    <div v-if="loading" class="rounded-2xl bg-surface p-16 text-center shadow dark:bg-surface-dark">{{ t('usageAdmin.loading') }}</div>
    <template v-else>
      <section class="grid gap-4 sm:grid-cols-3">
        <article class="rounded-2xl bg-[#172554] p-5 text-white"><p class="text-sm text-blue-200">{{ t('usageAdmin.pageViews') }}</p><p class="mt-2 text-4xl font-bold">{{ number(totalVisits) }}</p></article>
        <article class="rounded-2xl bg-surface p-5 shadow dark:bg-surface-dark"><p class="text-sm opacity-65">{{ t('usageAdmin.pagesUsed') }}</p><p class="mt-2 text-4xl font-bold">{{ number(pages.length) }}</p></article>
        <article class="rounded-2xl bg-surface p-5 shadow dark:bg-surface-dark"><p class="text-sm opacity-65">{{ t('usageAdmin.activeDays') }}</p><p class="mt-2 text-4xl font-bold">{{ number(daily.length) }}</p></article>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <article class="rounded-2xl bg-surface p-6 shadow dark:bg-surface-dark">
          <h2 class="text-xl font-bold">{{ t('usageAdmin.mostVisited') }}</h2>
          <div class="mt-5 space-y-4">
            <div v-for="item in pages" :key="item.page" class="grid grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3">
              <span class="truncate font-semibold">{{ pageLabel(item.page) }}</span>
              <span class="h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><span class="block h-full rounded-full bg-accent" :style="{ width: `${barWidth(item.visits, pageMax)}%` }"></span></span>
              <span class="min-w-10 text-right font-bold">{{ number(item.visits) }}</span>
            </div>
            <p v-if="!pages.length" class="py-8 text-center opacity-60">{{ t('usageAdmin.noVisits') }}</p>
          </div>
        </article>

        <article class="rounded-2xl bg-surface p-6 shadow dark:bg-surface-dark">
          <h2 class="text-xl font-bold">{{ t('usageAdmin.visitsByDay') }}</h2>
          <div class="mt-5 max-h-96 space-y-3 overflow-y-auto pr-2">
            <div v-for="item in [...daily].reverse()" :key="item.date" class="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
              <span>{{ formatDate(item.date) }}</span>
              <span class="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><span class="block h-full rounded-full bg-blue-500" :style="{ width: `${barWidth(item.visits, dailyMax)}%` }"></span></span>
              <span class="min-w-9 text-right font-bold">{{ number(item.visits) }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { apiUrl } from '@/composables/api'
import { useI18n } from 'vue-i18n'

type UsageItem = { page: string; visits: number }
type DailyItem = { date: string; visits: number }
const days = ref(30), totalVisits = ref(0), pages = ref<UsageItem[]>([]), daily = ref<DailyItem[]>([])
const loading = ref(true), error = ref('')
const { t, locale } = useI18n()
const pageMax = computed(() => Math.max(...pages.value.map(item => item.visits), 1))
const dailyMax = computed(() => Math.max(...daily.value.map(item => item.visits), 1))
const labels = computed<Record<string, string>>(() => ({ home: t('nav.home'), survey: t('nav.surveys'), answersurvey: t('usageAdmin.answerSurvey'), createsurvey: t('usageAdmin.createSurvey'), stats: t('usageAdmin.statistics'), account: t('usageAdmin.account'), events: t('nav.events'), cleaning: t('nav.cleaning'), admin: t('nav.administration'), 'admin-water-analytics': t('nav.waterAnalytics'), chat: t('usageAdmin.chat'), chatroom: t('usageAdmin.chatRoom'), 'change-password': t('usageAdmin.changePassword') }))
const pageLabel = (page: string) => labels.value[page] || page.replace(/-/g, ' ').replace(/^./, (value: string) => value.toUpperCase())
const number = (value: number) => value.toLocaleString(locale.value)
const barWidth = (visits: number, maximum: number) => Math.max(visits / maximum * 100, 2)
const formatDate = (date: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))

async function loadUsage() {
  loading.value = true; error.value = ''
  try {
    const response = await fetch(apiUrl(`/api/usage/admin/stats?days=${days.value}`), { headers: { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` } })
    const data = await response.json()
    if (!response.ok) throw new Error(t('usageAdmin.loadError'))
    totalVisits.value = Number(data.totalVisits); pages.value = data.pages; daily.value = data.daily
  } catch (cause) { error.value = cause instanceof Error ? cause.message : t('usageAdmin.loadError') }
  finally { loading.value = false }
}
watch(days, loadUsage, { immediate: true })
</script>
