<template>
  <main class="mx-auto min-h-screen w-full min-w-0 max-w-6xl space-y-6 px-4 py-6 sm:py-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-bold uppercase tracking-wider text-accent">{{ t('nav.administration') }}</p>
        <h1 class="break-words text-2xl font-bold sm:text-3xl">{{ t('usageAdmin.title') }}</h1>
        <p class="mt-2 break-words opacity-70">{{ t('usageAdmin.privacy') }}</p>
      </div>
      <label class="flex max-w-full flex-wrap items-center gap-2 text-sm font-bold">{{ t('usageAdmin.period') }}
        <select v-model.number="days" class="min-w-0 rounded-xl border border-border bg-transparent p-2 font-normal">
          <option :value="7">{{ t('stats.days', { count: 7 }) }}</option><option :value="30">{{ t('stats.days', { count: 30 }) }}</option><option :value="90">{{ t('stats.days', { count: 90 }) }}</option><option :value="365">{{ t('usageAdmin.year') }}</option>
        </select>
      </label>
    </header>

    <p v-if="error" class="break-words rounded-xl bg-red-500/10 p-4 font-semibold text-red-600">{{ error }}</p>
    <div v-if="loading" class="rounded-2xl bg-surface p-8 text-center shadow dark:bg-surface-dark sm:p-16">{{ t('usageAdmin.loading') }}</div>
    <template v-else>
      <section class="grid gap-4 sm:grid-cols-3">
        <article class="min-w-0 rounded-2xl bg-[#172554] p-5 text-white"><p class="break-words text-sm text-blue-200">{{ t('usageAdmin.pageViews') }}</p><p class="mt-2 break-all text-3xl font-bold sm:text-4xl">{{ number(totalVisits) }}</p></article>
        <article class="min-w-0 rounded-2xl bg-surface p-5 shadow dark:bg-surface-dark"><p class="break-words text-sm opacity-65">{{ t('usageAdmin.pagesUsed') }}</p><p class="mt-2 break-all text-3xl font-bold sm:text-4xl">{{ number(pages.length) }}</p></article>
        <article class="min-w-0 rounded-2xl bg-surface p-5 shadow dark:bg-surface-dark"><p class="break-words text-sm opacity-65">{{ t('usageAdmin.activeDays') }}</p><p class="mt-2 break-all text-3xl font-bold sm:text-4xl">{{ number(daily.length) }}</p></article>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <article class="min-w-0 rounded-2xl bg-surface p-4 shadow dark:bg-surface-dark sm:p-6">
          <h2 class="text-xl font-bold">{{ t('usageAdmin.mostVisited') }}</h2>
          <div class="mt-5 space-y-4">
            <div v-for="item in pages" :key="item.page" class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[minmax(7rem,10rem)_minmax(0,1fr)_auto]">
              <span class="min-w-0 truncate font-semibold">{{ pageLabel(item.page) }}</span>
              <span class="col-span-2 row-start-2 h-3 min-w-0 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 sm:col-span-1 sm:col-start-auto sm:row-start-auto"><span class="block h-full rounded-full bg-accent" :style="{ width: `${barWidth(item.visits, pageMax)}%` }"></span></span>
              <span class="col-start-2 row-start-1 min-w-10 break-all text-right font-bold sm:col-start-auto sm:row-start-auto">{{ number(item.visits) }}</span>
            </div>
            <p v-if="!pages.length" class="py-8 text-center opacity-60">{{ t('usageAdmin.noVisits') }}</p>
          </div>
        </article>

        <article class="min-w-0 rounded-2xl bg-surface p-4 shadow dark:bg-surface-dark sm:p-6">
          <h2 class="text-xl font-bold">{{ t('usageAdmin.visitsByDay') }}</h2>
          <div class="mt-5 max-h-96 space-y-3 overflow-y-auto pr-2">
            <div v-for="item in [...daily].reverse()" :key="item.date" class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
              <span class="min-w-0 break-words">{{ formatDate(item.date) }}</span>
              <span class="col-span-2 row-start-2 h-2 min-w-0 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 sm:col-span-1 sm:col-start-auto sm:row-start-auto"><span class="block h-full rounded-full bg-blue-500" :style="{ width: `${barWidth(item.visits, dailyMax)}%` }"></span></span>
              <span class="col-start-2 row-start-1 min-w-9 break-all text-right font-bold sm:col-start-auto sm:row-start-auto">{{ number(item.visits) }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { apiUrl } from '@/shared/composables/api'
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
