<template>
  <div class="min-h-screen min-w-0 bg-background-light px-4 py-4 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 xl:h-[calc(100dvh-4rem)] xl:min-h-0 xl:overflow-hidden xl:px-8">
    <main class="mx-auto flex h-full w-full min-w-0 max-w-[1600px] flex-col">
      <div v-if="loading && !stats" class="grid place-items-center rounded-2xl bg-background py-28 dark:bg-surface-dark"><p class="animate-pulse font-semibold opacity-60">{{ t('stats.loading') }}</p></div>
      <div v-else-if="error" class="rounded-2xl border border-error/30 bg-error/10 p-6"><p class="font-bold">{{ t('stats.loadTitle') }}</p><p class="mt-1 text-sm opacity-75">{{ error }}</p><button class="mt-4 rounded-lg bg-accent px-4 py-2 font-bold text-white" @click="loadStats">{{ t('common.retry') }}</button></div>
      <div v-else-if="stats && !stats.available" class="rounded-2xl border border-border-border bg-background p-10 text-center dark:bg-surface-dark"><p class="text-xl font-bold">{{ t('stats.noReadings') }}</p><p class="mt-2 opacity-65">{{ t('stats.noReadingsHelp') }}</p></div>

      <template v-else-if="stats">
        <section class="relative grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,2fr)]" :aria-busy="loading">
          <div v-if="loading" class="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-background-light/55 backdrop-blur-[1px] dark:bg-background-dark/55" role="status" aria-live="polite">
            <div class="mx-3 flex max-w-[calc(100%_-_1.5rem)] items-center gap-3 rounded-2xl border border-border-border bg-background px-4 py-3 text-sm font-bold shadow-lg dark:bg-surface-dark sm:px-5 sm:text-base">
              <span class="h-5 w-5 animate-spin rounded-full border-2 border-accent/25 border-t-accent" aria-hidden="true"></span>
              <span>{{ t('stats.loadingPeriod') }}</span>
            </div>
          </div>
          <article class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border-border bg-background shadow-sm dark:bg-surface-dark">
            <div class="border-b border-border-border bg-surface/60 p-4 dark:bg-black/10">
              <p class="mb-2 text-xs font-bold uppercase tracking-wider opacity-60">{{ t('stats.timePeriod') }}</p>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4" :aria-label="t('stats.timePeriod')">
                <button v-for="days in periods" :key="days" type="button" class="whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-wait disabled:hover:translate-y-0 dark:focus:ring-offset-surface-dark" :class="period === days ? 'border-accent bg-accent text-white shadow-md' : 'border-border-border bg-background hover:border-accent dark:bg-surface-dark'" :aria-pressed="period === days" :disabled="loading" @click="period = days">{{ days === 1 ? t('stats.today') : days === 365 ? t('stats.year') : t('stats.days', { count: days }) }}</button>
              </div>
              <div class="mt-3 grid min-w-0 gap-1.5 px-1 text-xs opacity-65">
                <span class="flex min-w-0 items-start gap-2 break-words"><span class="shrink-0" aria-hidden="true">⌂</span>{{ stats.address ? t('common.houseLabel', { house: stats.address }) : t('stats.yourResidence') }} · {{ t('stats.floor', { floor: stats.floor ?? '—' }) }}</span>
                <span v-if="stats.latestReadingAt" class="flex min-w-0 items-start gap-2 break-words"><span class="shrink-0" aria-hidden="true">↻</span>{{ t('stats.updated', { date: formatUpdated(stats.latestReadingAt) }) }}</span>
              </div>
            </div>
            <div class="bg-[#172554] px-5 py-4 text-white">
              <p class="text-sm font-semibold text-blue-200">{{ t('stats.totalUsed') }}</p>
              <div class="mt-1 flex flex-wrap items-end justify-between gap-2"><p class="break-all text-2xl font-bold sm:text-3xl">{{ liters(stats.totalLiters) }}</p><p class="break-words text-xs" :class="change <= 0 ? 'text-emerald-300' : 'text-orange-300'">{{ comparisonText }}</p></div>
            </div>
            <div class="grid grid-cols-1 gap-3 border-b border-border-border p-4 sm:grid-cols-2">
              <div class="min-w-0 break-words rounded-xl bg-surface p-3 dark:bg-black/20"><p class="text-xs font-semibold opacity-60">{{ t('stats.dailyAverage') }}</p><p class="mt-1 break-all text-xl font-bold">{{ liters(stats.averageDailyLiters) }}</p><p class="text-xs opacity-60">{{ t('stats.perDay') }}</p></div>
              <div class="min-w-0 break-words rounded-xl bg-surface p-3 dark:bg-black/20"><p class="text-xs font-semibold opacity-60">{{ t('stats.highestDay') }}</p><p class="mt-1 text-lg font-bold">{{ stats.peakDay ? dayLabel(stats.peakDay.date) : '—' }}</p><p class="text-xs opacity-60">{{ stats.peakDay ? liters(stats.peakDay.totalLiters) : t('common.noData') }}</p></div>
            </div>
            <div class="border-b border-border-border p-4">
              <h2 class="font-bold">{{ t('stats.waterMix') }}</h2>
              <div class="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface dark:bg-black/20" :aria-label="t('stats.waterMixAria')">
                <div class="h-full bg-blue-600 transition-all" :style="{ width: `${coldShare}%` }" :title="t('charts.coldWater')"></div>
                <div class="h-full bg-orange-500 transition-all" :style="{ width: `${warmShare}%` }" :title="t('charts.warmWater')"></div>
              </div>
              <div class="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm"><p class="min-w-0 break-words text-blue-600">● {{ t('stats.cold') }} <strong class="break-all text-text dark:text-text-dark">{{ liters(stats.coldLiters) }}</strong></p><p class="min-w-0 break-words text-orange-500 sm:text-right">● {{ t('stats.warm') }} <strong class="break-all text-text dark:text-text-dark">{{ liters(stats.warmLiters) }}</strong></p></div>
            </div>
            <div class="min-h-0 flex-1 p-4">
              <h2 class="font-bold">{{ t('stats.standsOut') }}</h2>
              <ul class="mt-3 grid min-w-0 gap-2 break-words text-sm"><li class="flex min-w-0 gap-2"><span class="shrink-0">↗</span><span class="min-w-0">{{ t('stats.busiest', { hour: busiestHour }) }}</span></li><li class="flex min-w-0 gap-2"><span class="shrink-0">◐</span><span class="min-w-0">{{ t('stats.coldShare', { percent: Math.round(coldShare) }) }}</span></li><li class="flex min-w-0 gap-2"><span class="shrink-0">≈</span><span class="min-w-0">{{ t('stats.periodDifference', { amount: liters(Math.abs(stats.totalLiters - stats.previousPeriodLiters)), direction: t(change <= 0 ? 'stats.less' : 'stats.more'), period: comparisonPeriod }) }}</span></li></ul>
            </div>
          </article>

          <article class="flex min-h-[26rem] min-w-0 flex-col rounded-2xl border border-border-border bg-background p-4 shadow-sm dark:bg-surface-dark sm:p-5 xl:min-h-0">
            <div class="mb-3 flex shrink-0 flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 break-words"><h2 class="text-lg font-bold sm:text-xl">{{ viewInfo.title }}</h2><p class="mt-0.5 text-sm opacity-60">{{ viewInfo.description }}</p></div>
              <div class="flex w-full max-w-full gap-1 overflow-x-auto rounded-xl bg-surface p-1 dark:bg-black/20 sm:w-auto">
                <button v-for="option in visibleViews" :key="option.value" class="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition" :class="view === option.value ? 'bg-background shadow-sm dark:bg-surface-dark' : 'opacity-60 hover:opacity-100'" @click="view = option.value">{{ option.label }}</button>
              </div>
            </div>
            <WaterStatsChart class="min-h-0 flex-1" compact :stats="stats" :view="view" />
          </article>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import WaterStatsChart from '@/features/water/components/WaterStatsChart.vue'
import { getSocket } from '@/shared/composables/socket'
import type { FloorWaterStats } from '@/types'
import { useI18n } from 'vue-i18n'

type View = 'usage' | 'split' | 'temperature' | 'hourly'
const socket = getSocket(), periods = [1, 7, 30, 365] as const
const { t, locale } = useI18n()
const period = ref<(typeof periods)[number]>(30), view = ref<View>('usage'), stats = ref<FloorWaterStats | null>(null), loading = ref(true), error = ref('')
const views = computed<{ label: string; value: View }[]>(() => [{ label: t('stats.usage'), value: 'usage' }, { label: t('stats.split'), value: 'split' }, { label: t('stats.temperature'), value: 'temperature' }, { label: t('stats.byHour'), value: 'hourly' }])
const visibleViews = computed(() => period.value === 1 ? views.value.filter(option => option.value !== 'hourly') : views.value)
const viewInfo = computed(() => ({ usage: { title: t(period.value === 1 ? 'stats.todayUsage' : 'stats.dailyUsage'), description: t(period.value === 1 ? 'stats.todayUsageHelp' : 'stats.dailyUsageHelp') }, split: { title: t('stats.coldWarm'), description: t(period.value === 1 ? 'stats.coldWarmHourlyHelp' : 'stats.coldWarmDailyHelp') }, temperature: { title: t('stats.waterTemperature'), description: t(period.value === 1 ? 'stats.temperatureHourlyHelp' : 'stats.temperatureDailyHelp') }, hourly: { title: t('stats.typicalDay'), description: t('stats.typicalDayHelp') } }[view.value]))
const comparisonPeriod = computed(() => period.value === 1 ? t('stats.priorDay') : period.value === 365 ? t('stats.priorYear') : t('stats.priorDays', { count: period.value }))
const change = computed(() => stats.value?.previousPeriodLiters ? ((stats.value.totalLiters - stats.value.previousPeriodLiters) / stats.value.previousPeriodLiters) * 100 : 0)
const comparisonText = computed(() => !stats.value?.previousPeriodLiters ? t('stats.noPrevious') : t('stats.comparison', { percent: Math.abs(change.value).toFixed(0), direction: t(change.value <= 0 ? 'stats.less' : 'stats.more'), period: comparisonPeriod.value }))
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
