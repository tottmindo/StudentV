<template>
  <div class="min-h-screen bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-10">
    <main class="mx-auto max-w-7xl">
      <section class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-border bg-background p-2 shadow-sm dark:bg-surface-dark">
        <div class="flex gap-1" :aria-label="t('stats.timePeriod')">
          <button v-for="days in periods" :key="days" class="rounded-xl px-4 py-2 text-sm font-bold transition" :class="period === days ? 'bg-text text-white dark:bg-text-dark dark:text-primary-dark' : 'hover:bg-surface dark:hover:bg-black/20'" @click="period = days">{{ days === 1 ? t('stats.today') : t('stats.days', { count: days }) }}</button>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-2 px-2 text-xs opacity-60">
          <span v-if="stats">{{ stats.address || t('stats.yourResidence') }} · {{ t('stats.floor', { floor: stats.floor ?? '—' }) }}</span>
          <span v-if="stats?.latestReadingAt">{{ t('stats.updated', { date: formatUpdated(stats.latestReadingAt) }) }}</span>
        </div>
      </section>

      <div v-if="loading && !stats" class="grid place-items-center rounded-2xl bg-background py-28 dark:bg-surface-dark"><p class="animate-pulse font-semibold opacity-60">{{ t('stats.loading') }}</p></div>
      <div v-else-if="error" class="rounded-2xl border border-error/30 bg-error/10 p-6"><p class="font-bold">{{ t('stats.loadTitle') }}</p><p class="mt-1 text-sm opacity-75">{{ error }}</p><button class="mt-4 rounded-lg bg-accent px-4 py-2 font-bold text-white" @click="loadStats">{{ t('common.retry') }}</button></div>
      <div v-else-if="stats && !stats.available" class="rounded-2xl border border-border-border bg-background p-10 text-center dark:bg-surface-dark"><p class="text-xl font-bold">{{ t('stats.noReadings') }}</p><p class="mt-2 opacity-65">{{ t('stats.noReadingsHelp') }}</p></div>

      <template v-else-if="stats">
        <section class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article class="rounded-2xl bg-[#172554] p-5 text-white shadow-sm">
            <p class="text-sm font-semibold text-blue-200">{{ t('stats.totalUsed') }}</p><p class="mt-3 text-3xl font-bold">{{ liters(stats.totalLiters) }}</p>
            <p class="mt-2 text-sm" :class="change <= 0 ? 'text-emerald-300' : 'text-orange-300'">{{ comparisonText }}</p>
          </article>
          <article class="rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark"><p class="text-sm font-semibold opacity-60">{{ t('stats.dailyAverage') }}</p><p class="mt-3 text-3xl font-bold">{{ liters(stats.averageDailyLiters) }}</p><p class="mt-2 text-sm opacity-60">{{ t('stats.perDay') }}</p></article>
          <article class="rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark"><p class="text-sm font-semibold opacity-60">{{ t('stats.highestDay') }}</p><p class="mt-3 text-2xl font-bold">{{ stats.peakDay ? dayLabel(stats.peakDay.date) : '—' }}</p><p class="mt-2 text-sm opacity-60">{{ stats.peakDay ? liters(stats.peakDay.totalLiters) : t('common.noData') }}</p></article>
        </section>

        <section class="mb-6 rounded-2xl border border-border-border bg-background p-4 shadow-sm dark:bg-surface-dark sm:p-6">
          <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div><h2 class="text-xl font-bold">{{ viewInfo.title }}</h2><p class="mt-1 text-sm opacity-60">{{ viewInfo.description }}</p></div>
            <div class="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface p-1 dark:bg-black/20">
              <button v-for="option in visibleViews" :key="option.value" class="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition" :class="view === option.value ? 'bg-background shadow-sm dark:bg-surface-dark' : 'opacity-60 hover:opacity-100'" @click="view = option.value">{{ option.label }}</button>
            </div>
          </div>
          <WaterStatsChart :stats="stats" :view="view" />
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <article class="rounded-2xl border border-border-border bg-background p-6 dark:bg-surface-dark">
            <h2 class="text-xl font-bold">{{ t('stats.waterMix') }}</h2><p class="mt-1 text-sm opacity-60">{{ t('stats.waterMixHelp') }}</p>
            <div class="mt-6 flex h-3 overflow-hidden rounded-full bg-surface dark:bg-black/20" :aria-label="t('stats.waterMixAria')">
              <div class="h-full bg-blue-600 transition-all" :style="{ width: `${coldShare}%` }" :title="t('charts.coldWater')"></div>
              <div class="h-full bg-orange-500 transition-all" :style="{ width: `${warmShare}%` }" :title="t('charts.warmWater')"></div>
            </div>
            <div class="mt-4 flex justify-between gap-4"><div><p class="text-sm text-blue-600">● {{ t('stats.cold') }}</p><p class="text-xl font-bold">{{ liters(stats.coldLiters) }}</p></div><div class="text-right"><p class="text-sm text-orange-500">● {{ t('stats.warm') }}</p><p class="text-xl font-bold">{{ liters(stats.warmLiters) }}</p></div></div>
          </article>
          <article class="rounded-2xl border border-border-border bg-background p-6 dark:bg-surface-dark">
            <h2 class="text-xl font-bold">{{ t('stats.standsOut') }}</h2>
            <ul class="mt-4 space-y-4 text-sm"><li class="flex gap-3"><span class="mt-0.5 text-lg">↗</span><span>{{ t('stats.busiest', { hour: busiestHour }) }}</span></li><li class="flex gap-3"><span class="mt-0.5 text-lg">◐</span><span>{{ t('stats.coldShare', { percent: Math.round(coldShare) }) }}</span></li><li class="flex gap-3"><span class="mt-0.5 text-lg">≈</span><span>{{ t('stats.periodDifference', { amount: liters(Math.abs(stats.totalLiters - stats.previousPeriodLiters)), direction: t(change <= 0 ? 'stats.less' : 'stats.more') }) }}</span></li></ul>
          </article>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import WaterStatsChart from '@/components/WaterStatsChart.vue'
import { getSocket } from '@/composables/socket'
import type { FloorWaterStats } from '@/types'
import { useI18n } from 'vue-i18n'

type View = 'usage' | 'split' | 'temperature' | 'hourly'
const socket = getSocket(), periods = [1, 7, 30, 90] as const
const { t, locale } = useI18n()
const period = ref<(typeof periods)[number]>(30), view = ref<View>('usage'), stats = ref<FloorWaterStats | null>(null), loading = ref(true), error = ref('')
const views = computed<{ label: string; value: View }[]>(() => [{ label: t('stats.usage'), value: 'usage' }, { label: t('stats.split'), value: 'split' }, { label: t('stats.temperature'), value: 'temperature' }, { label: t('stats.byHour'), value: 'hourly' }])
const visibleViews = computed(() => period.value === 1 ? views.value.filter(option => option.value !== 'hourly') : views.value)
const viewInfo = computed(() => ({ usage: { title: t(period.value === 1 ? 'stats.todayUsage' : 'stats.dailyUsage'), description: t(period.value === 1 ? 'stats.todayUsageHelp' : 'stats.dailyUsageHelp') }, split: { title: t('stats.coldWarm'), description: t(period.value === 1 ? 'stats.coldWarmHourlyHelp' : 'stats.coldWarmDailyHelp') }, temperature: { title: t('stats.waterTemperature'), description: t(period.value === 1 ? 'stats.temperatureHourlyHelp' : 'stats.temperatureDailyHelp') }, hourly: { title: t('stats.typicalDay'), description: t('stats.typicalDayHelp') } }[view.value]))
const change = computed(() => stats.value?.previousPeriodLiters ? ((stats.value.totalLiters - stats.value.previousPeriodLiters) / stats.value.previousPeriodLiters) * 100 : 0)
const comparisonText = computed(() => !stats.value?.previousPeriodLiters ? t('stats.noPrevious') : t('stats.comparison', { percent: Math.abs(change.value).toFixed(0), direction: t(change.value <= 0 ? 'stats.less' : 'stats.more') }))
const classified = computed(() => (stats.value?.coldLiters || 0) + (stats.value?.warmLiters || 0))
const coldShare = computed(() => classified.value ? ((stats.value?.coldLiters || 0) / classified.value) * 100 : 0)
const warmShare = computed(() => classified.value ? ((stats.value?.warmLiters || 0) / classified.value) * 100 : 0)
const busiestHour = computed(() => { const point = stats.value?.hourlyProfile.reduce((best, item) => item.averageLiters > best.averageLiters ? item : best, { hour: 0, averageLiters: -1 }); return `${String(point?.hour ?? 0).padStart(2, '0')}:00–${String(((point?.hour ?? 0) + 1) % 24).padStart(2, '0')}:00` })
const liters = (value: number) => `${Math.round(value).toLocaleString(locale.value)} L`
const dayLabel = (date: string) => new Intl.DateTimeFormat(locale.value, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
const formatUpdated = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
function loadStats() { loading.value = true; error.value = ''; socket.emit('getWaterStats', { days: period.value }) }
function onStats(payload: FloorWaterStats) { stats.value = payload; loading.value = false }
function onError(payload: { message?: string }) { error.value = payload.message || t('stats.tryAgain'); loading.value = false }
socket.on('waterStats', onStats); socket.on('waterStatsError', onError)
watch(period, () => { if (period.value === 1 && view.value === 'hourly') view.value = 'usage'; loadStats() }, { immediate: true })
onBeforeUnmount(() => { socket.off('waterStats', onStats); socket.off('waterStatsError', onError) })
</script>
