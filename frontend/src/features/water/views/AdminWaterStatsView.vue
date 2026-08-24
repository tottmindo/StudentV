<template>
  <div class="min-h-screen bg-background-light px-4 py-8 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-10">
    <main class="mx-auto max-w-7xl">
      <div class="mb-6 grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <section class="rounded-2xl border border-border-border bg-background p-5 shadow-sm dark:bg-surface-dark">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div><h2 class="text-xl font-bold">{{ t('adminWater.floorsIn', { house: house || t('adminWater.house') }) }}</h2><p class="text-sm opacity-60">{{ t('adminWater.floorHelp') }}</p></div>
            <div class="flex flex-wrap items-end gap-3">
              <label class="min-w-40 text-sm font-bold">{{ t('adminWater.chooseHouse') }}<select v-model="house" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal"><option v-for="value in houses" :key="value" :value="value">{{ t('common.houseLabel', { house: value }) }}</option></select></label>
              <label class="min-w-40 text-sm font-bold">{{ t('adminWater.chooseFloor') }}<select v-model.number="selectedDormID" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal"><option :value="null">{{ t('adminWater.wholeHouse') }}</option><option v-for="dorm in houseDorms" :key="dorm.dormID" :value="dorm.dormID">{{ t('survey.floor', { floor: dorm.floor }) }}</option></select></label>
              <div class="flex flex-wrap gap-1"><button v-for="value in periods" :key="value" class="rounded-xl px-3 py-2.5 text-sm font-bold" :class="period === value ? 'bg-text text-white dark:bg-text-dark dark:text-primary-dark' : 'bg-surface dark:bg-black/20'" @click="period = value">{{ periodLabel(value) }}</button></div>
            </div>
          </div>
          <div class="mt-5 space-y-4"><button v-for="item in comparisons" :key="item.dormID" class="grid w-full grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-lg p-1 text-left transition hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent" @click="selectedDormID = item.dormID"><span class="font-bold">{{ t('survey.floor', { floor: item.floor }) }}</span><span class="h-3 overflow-hidden rounded-full bg-surface dark:bg-black/20"><span class="block h-full rounded-full transition-all" :class="item.dormID === selectedDormID ? 'bg-accent' : 'bg-blue-500'" :style="{ width: `${comparisonWidth(item.totalLiters)}%` }"></span></span><span class="min-w-24 text-right font-semibold">{{ liters(item.totalLiters) }}</span></button><p v-if="!comparisons.length" class="py-5 text-center opacity-60">{{ t('adminWater.noComparisons') }}</p></div>
        </section>
        <section v-if="stats" class="overflow-hidden rounded-2xl border border-border-border bg-background shadow-sm dark:bg-surface-dark">
          <article class="bg-[#172554] px-5 py-4 text-white"><p class="text-sm text-blue-200">{{ t('adminWater.totalUse') }}</p><div class="mt-1 flex items-baseline justify-between gap-3"><p class="text-2xl font-bold">{{ liters(stats.totalLiters) }}</p><p class="text-right text-xs text-blue-200">{{ selectedDormID == null ? t('adminWater.housePeriodContext', { house, period: periodLabel(period) }) : t('adminWater.periodContext', { floor: stats.floor, period: periodLabel(period) }) }}</p></div></article>
          <article class="flex items-center justify-between gap-4 border-b border-border-border px-5 py-4"><p class="text-sm opacity-60">{{ t('stats.dailyAverage') }}</p><p class="text-2xl font-bold">{{ liters(stats.averageDailyLiters) }}</p></article>
          <article class="flex items-center justify-between gap-4 border-b border-border-border px-5 py-4"><div><p class="text-sm opacity-60">{{ t('adminWater.registeredMeters') }}</p><p class="text-xs opacity-60">{{ t('adminWater.staleCount', { count: staleCount }) }}</p></div><p class="text-2xl font-bold">{{ floorSensors.length }}</p></article>
          <article class="flex items-center justify-between gap-4 px-5 py-4" :class="alertCount ? 'bg-warning/10' : ''"><div><p class="text-sm opacity-60">{{ t('adminWater.alerts') }}</p><p class="text-xs opacity-60">{{ t('adminWater.alertsHelp') }}</p></div><p class="text-2xl font-bold">{{ alertCount }}</p></article>
        </section>
      </div>

      <p v-if="error" class="mb-5 rounded-xl bg-error/10 p-4 font-semibold text-error">{{ error }}</p>
      <div v-if="loading" class="rounded-2xl bg-background py-24 text-center font-semibold opacity-60 dark:bg-surface-dark">{{ t('adminWater.loading') }}</div>
      <template v-else-if="stats">
        <section class="mb-6 rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark">
          <div class="mb-5 flex flex-wrap justify-between gap-3"><div><h2 class="text-xl font-bold">{{ selectedDormID == null ? t('adminWater.houseConsumption', { house }) : t('adminWater.consumption', { floor: stats.floor }) }}</h2><p class="text-sm opacity-60">{{ t(period === 1 ? 'adminWater.hourlyHelp' : selectedDormID == null ? 'adminWater.houseDailyHelp' : 'adminWater.dailyHelp') }}</p></div><div class="flex gap-1 rounded-xl bg-surface p-1 dark:bg-black/20"><button v-for="item in visibleViews" :key="item.value" class="rounded-lg px-3 py-2 text-sm font-bold" :class="view === item.value ? 'bg-background shadow dark:bg-surface-dark' : 'opacity-60'" @click="view = item.value">{{ item.label }}</button></div></div>
          <WaterStatsChart :stats="stats" :view="view" />
        </section>

        <section class="rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark">
          <div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="text-xl font-bold">{{ t('adminWater.operations') }}</h2><p class="text-sm opacity-60">{{ t('adminWater.operationsHelp') }}</p></div><span class="text-xs opacity-60">{{ t('adminWater.staleHelp') }}</span></div>
          <div class="mt-5 overflow-x-auto"><table class="w-full min-w-[900px] text-left text-sm"><thead><tr class="border-b border-border-border"><th class="p-3">{{ t('adminWater.meter') }}</th><th class="p-3">{{ t('adminWater.type') }}</th><th class="p-3">{{ t('adminWater.location') }}</th><th class="p-3">{{ t('adminWater.lastReading') }}</th><th class="p-3">{{ t('adminWater.battery') }}</th><th class="p-3">{{ t('adminWater.ambient') }}</th><th class="p-3">{{ t('adminWater.used24h') }}</th><th class="p-3">{{ t('adminWater.status') }}</th></tr></thead><tbody><tr v-for="sensor in floorSensors" :key="sensor.sensorCode" tabindex="0" class="cursor-pointer border-b border-border-border/60 transition hover:bg-accent/5 focus:bg-accent/10 focus:outline-none" :title="t('adminWater.openCharts')" @click="openSensor(sensor)" @keydown.enter="openSensor(sensor)"><td class="p-3 font-mono">{{ sensor.sensorCode }}</td><td class="p-3">{{ sensor.type }}</td><td class="p-3">{{ sensor.location }}</td><td class="p-3">{{ date(sensor.recordedAt) }}</td><td class="p-3">{{ value(sensor.battery, ' V') }}</td><td class="p-3">{{ value(sensor.ambientTemp, ' °C') }}</td><td class="p-3"><span class="font-bold" :class="isHighUsage(sensor) ? 'text-error' : ''">{{ value(sensor.last24HoursLiters, ' L') }}</span><span v-if="isHighUsage(sensor)" class="ml-2 rounded-full bg-error/15 px-2 py-1 text-xs font-bold text-error">{{ t('adminWater.high') }}</span></td><td class="p-3"><span class="rounded-full px-2 py-1 text-xs font-bold" :class="status(sensor).class">{{ status(sensor).label }}</span></td></tr><tr v-if="!floorSensors.length"><td colspan="8" class="p-8 text-center opacity-60">{{ t('adminWater.noMeters') }}</td></tr></tbody></table></div>
        </section>

        <section class="mt-6 rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark">
          <div><h2 class="text-xl font-bold">{{ t('adminWater.exportTitle') }}</h2><p class="text-sm opacity-60">{{ t('adminWater.exportHelp') }}</p></div>
          <div class="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 class="text-sm font-bold">{{ t('adminWater.exportRange') }}</h3>
              <div class="mt-2 grid gap-3 sm:grid-cols-2"><label class="text-sm font-semibold">{{ t('adminWater.exportFrom') }}<input v-model="exportFrom" type="datetime-local" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal" /></label><label class="text-sm font-semibold">{{ t('adminWater.exportTo') }}<input v-model="exportTo" type="datetime-local" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal" /></label></div>
              <h3 class="mt-5 text-sm font-bold">{{ t('adminWater.exportScope') }}</h3>
              <div class="mt-2 grid gap-3 sm:grid-cols-3">
                <label class="text-sm font-semibold">{{ t('adminWater.house') }}<select v-model="exportHouse" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal"><option value="all">{{ t('adminWater.allHouses') }}</option><option v-for="value in houses" :key="value" :value="value">{{ t('common.houseLabel', { house: value }) }}</option></select></label>
                <label class="text-sm font-semibold">{{ t('adminWater.exportFloor') }}<select v-model="exportDorm" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal"><option value="all">{{ t('adminWater.allFloors') }}</option><option v-for="dorm in exportDormOptions" :key="dorm.dormID" :value="String(dorm.dormID)">{{ t('survey.floor', { floor: dorm.floor }) }}</option></select></label>
                <label class="text-sm font-semibold">{{ t('adminWater.meter') }}<select v-model="exportSensor" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal"><option value="all">{{ t('adminWater.allMeters') }}</option><option v-for="sensor in exportSensorOptions" :key="sensor.sensorCode" :value="sensor.sensorCode">{{ sensor.location }} · {{ sensor.sensorCode }}</option></select></label>
              </div>
            </div>
            <fieldset><legend class="text-sm font-bold">{{ t('adminWater.exportColumns') }}</legend><div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3"><label v-for="field in exportFieldOptions" :key="field.value" class="flex items-center gap-2 text-sm"><input v-model="exportFields" type="checkbox" :value="field.value" class="h-4 w-4 accent-accent" />{{ field.label }}</label></div><div class="mt-4 flex flex-wrap gap-2"><button type="button" class="text-sm font-bold text-accent" @click="exportFields = exportFieldOptions.map(field => field.value)">{{ t('adminWater.selectAll') }}</button><span class="opacity-30">·</span><button type="button" class="text-sm font-bold text-accent" @click="exportFields = []">{{ t('adminWater.clearAll') }}</button></div></fieldset>
          </div>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-border pt-5"><p class="text-sm" :class="exportError ? 'text-error' : 'opacity-60'">{{ exportError || t('adminWater.exportFormat') }}</p><button type="button" :disabled="exporting || !exportFields.length || !exportFrom || !exportTo" class="rounded-xl bg-accent px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" @click="downloadExport">{{ exporting ? t('adminWater.exporting') : t('adminWater.downloadCsv') }}</button></div>
        </section>
      </template>

      <ModalComponent v-model="showSensorModal">
        <div class="pr-8 text-text dark:text-text-dark">
          <p class="text-sm font-bold uppercase tracking-wider text-accent">{{ t('adminWater.detail') }}</p>
          <h2 class="mt-1 text-2xl font-bold">{{ selectedSensor?.location || selectedSensor?.sensorCode }}</h2>
          <p class="mt-1 font-mono text-sm opacity-60">{{ selectedSensor?.sensorCode }} · {{ selectedSensor?.type }}</p>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div class="flex gap-1 rounded-xl bg-surface p-1 dark:bg-background-dark"><button v-for="item in periods" :key="item" class="rounded-lg px-3 py-2 text-sm font-bold" :class="sensorPeriod === item ? 'bg-white shadow dark:bg-surface-dark' : 'opacity-60'" @click="sensorPeriod = item">{{ periodLabel(item) }}</button></div>
            <div class="flex gap-1 rounded-xl bg-surface p-1 dark:bg-background-dark"><button v-for="item in sensorViews" :key="item.value" class="rounded-lg px-3 py-2 text-sm font-bold" :class="sensorView === item.value ? 'bg-white shadow dark:bg-surface-dark' : 'opacity-60'" @click="sensorView = item.value">{{ item.label }}</button></div>
          </div>
          <div v-if="sensorLoading" class="grid h-80 place-items-center font-semibold opacity-60">{{ t('adminWater.loadingMeter') }}</div>
          <p v-else-if="sensorError" class="mt-6 rounded-xl bg-error/10 p-4 font-semibold text-error">{{ sensorError }}</p>
          <div v-else-if="sensorStats" class="mt-5"><div class="mb-3 flex flex-wrap gap-5 text-sm"><span><strong>{{ liters(sensorStats.totalLiters) }}</strong> {{ t('adminWater.total') }}</span><span v-if="sensorStats.latestReadingAt" class="opacity-60">{{ t('adminWater.through', { date: date(sensorStats.latestReadingAt) }) }}</span></div><WaterStatsChart :stats="sensorStats" :view="sensorView" /></div>
        </div>
      </ModalComponent>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import WaterStatsChart from '@/features/water/components/WaterStatsChart.vue'
import ModalComponent from '@/shared/components/ModalComponent.vue'
import { apiUrl } from '@/shared/composables/api'
import { getSocket } from '@/shared/composables/socket'
import type { FloorWaterStats } from '@/types'
import { useI18n } from 'vue-i18n'

type Dorm = { dormID: number; floor: number; address: string }
type Sensor = { sensorCode: string; type: string; location: string; dormID: number; recordedAt: string | null; battery: number | null; ambientTemp: number | null; last24HoursLiters: number | null; errorCode: number | null; leakStatus: boolean | null }
type View = 'usage' | 'split' | 'temperature' | 'hourly'
const socket = getSocket(), periods = [1, 7, 30, 90] as const, period = ref<(typeof periods)[number]>(30)
const { t, locale } = useI18n()
const dorms = ref<Dorm[]>([]), sensors = ref<Sensor[]>([]), house = ref(''), selectedDormID = ref<number | null>(null), stats = ref<FloorWaterStats | null>(null), loading = ref(true), error = ref(''), view = ref<View>('usage')
const comparisons = ref<{ dormID: number; floor: number; totalLiters: number }[]>([])
type ExportField = 'recordedAt' | 'sensorCode' | 'house' | 'floor' | 'sensorType' | 'location' | 'totalVolume' | 'tempMin' | 'tempMax' | 'ambientTemp' | 'humidity' | 'battery' | 'errorCode' | 'leakStatus'
const localDateTime = (date: Date) => { const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16) }
const exportFrom = ref(localDateTime(new Date(Date.now() - 30 * 86400000))), exportTo = ref(localDateTime(new Date())), exportHouse = ref('all'), exportDorm = ref('all'), exportSensor = ref('all'), exporting = ref(false), exportError = ref('')
const exportFields = ref<ExportField[]>(['recordedAt', 'sensorCode', 'house', 'floor', 'sensorType', 'location', 'totalVolume'])
const showSensorModal = ref(false), selectedSensor = ref<Sensor | null>(null), sensorStats = ref<FloorWaterStats | null>(null), sensorLoading = ref(false), sensorError = ref(''), sensorPeriod = ref<(typeof periods)[number]>(30), sensorView = ref<Exclude<View, 'hourly'>>('usage')
const sensorViews = computed<{ label: string; value: Exclude<View, 'hourly'> }[]>(() => [{ label: t('stats.usage'), value: 'usage' }, { label: t('stats.waterMix'), value: 'split' }, { label: t('stats.temperature'), value: 'temperature' }])
const views = computed<{ label: string; value: View }[]>(() => [{ label: t('stats.usage'), value: 'usage' }, { label: t('stats.waterMix'), value: 'split' }, { label: t('stats.temperature'), value: 'temperature' }, { label: t('stats.byHour'), value: 'hourly' }])
const visibleViews = computed(() => period.value === 1 ? views.value.filter(item => item.value !== 'hourly') : views.value)
const headers = { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` }
const houses = computed(() => [...new Set(dorms.value.map(item => item.address))].sort())
const houseDorms = computed(() => dorms.value.filter(item => item.address === house.value).sort((a, b) => a.floor - b.floor))
const floorSensors = computed(() => sensors.value.filter(item => selectedDormID.value == null ? houseDorms.value.some(dorm => dorm.dormID === item.dormID) : item.dormID === selectedDormID.value))
const exportDormOptions = computed(() => exportHouse.value === 'all' ? dorms.value : dorms.value.filter(dorm => dorm.address === exportHouse.value))
const exportSensorOptions = computed(() => sensors.value.filter(sensor => exportDorm.value !== 'all' ? sensor.dormID === Number(exportDorm.value) : exportHouse.value === 'all' || dorms.value.some(dorm => dorm.dormID === sensor.dormID && dorm.address === exportHouse.value)))
const exportFieldOptions = computed<{ value: ExportField; label: string }[]>(() => (['recordedAt', 'sensorCode', 'house', 'floor', 'sensorType', 'location', 'totalVolume', 'tempMin', 'tempMax', 'ambientTemp', 'humidity', 'battery', 'errorCode', 'leakStatus'] as ExportField[]).map(value => ({ value, label: t(`adminWater.exportFields.${value}`) })))
const isStale = (sensor: Sensor) => !sensor.recordedAt || Date.now() - new Date(sensor.recordedAt).getTime() > 26 * 60 * 60 * 1000
const staleCount = computed(() => floorSensors.value.filter(isStale).length)
const alertCount = computed(() => floorSensors.value.filter(item => item.leakStatus || Number(item.errorCode)).length)
const isHighUsage = (sensor: Sensor) => { const others = floorSensors.value.filter(item => item.sensorCode !== sensor.sensorCode && item.last24HoursLiters != null); if (!others.length) return false; const baseline = others.reduce((sum, item) => sum + Number(item.last24HoursLiters), 0) / others.length; return Number(sensor.last24HoursLiters) > Math.max(baseline * 2, 0) && Number(sensor.last24HoursLiters) > 0 }
const comparisonMax = computed(() => Math.max(...comparisons.value.map(item => item.totalLiters), 1))
const comparisonWidth = (total: number) => total / comparisonMax.value * 100
const periodLabel = (days: number) => days === 1 ? t('stats.today') : t('stats.days', { count: days })
const liters = (number: number) => `${Math.round(number).toLocaleString(locale.value)} L`
const date = (value: string | null) => value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t('common.noData')
const value = (number: number | null, suffix: string) => number == null ? '—' : `${Number(number).toLocaleString(locale.value)}${suffix}`
const status = (sensor: Sensor) => sensor.leakStatus ? { label: t('adminWater.leak'), class: 'bg-error/15 text-error' } : Number(sensor.errorCode) ? { label: t('adminWater.error', { code: sensor.errorCode }), class: 'bg-warning/20 text-yellow-800 dark:text-yellow-300' } : isStale(sensor) ? { label: t('adminWater.stale'), class: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' } : { label: t('adminWater.online'), class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }
function combineHouseStats(floors: FloorWaterStats[]): FloorWaterStats {
  const average = (values: (number | null)[]) => { const valid = values.filter((value): value is number => value != null); return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null }
  const dates = [...new Set(floors.flatMap(item => item.days.map(day => day.date)))].sort()
  const days = dates.map(date => { const entries = floors.flatMap(item => item.days.filter(day => day.date === date)); return { date, totalLiters: entries.reduce((sum, day) => sum + day.totalLiters, 0), coldLiters: entries.reduce((sum, day) => sum + day.coldLiters, 0), warmLiters: entries.reduce((sum, day) => sum + day.warmLiters, 0), averageWaterTemp: average(entries.map(day => day.averageWaterTemp)), peakWaterTemp: entries.reduce<number | null>((peak, day) => day.peakWaterTemp == null ? peak : Math.max(peak ?? day.peakWaterTemp, day.peakWaterTemp), null) } })
  const hourlyProfile = Array.from({ length: 24 }, (_, hour) => { const entries = floors.flatMap(item => item.hourlyProfile.filter(point => point.hour === hour)); return { hour, averageLiters: entries.reduce((sum, point) => sum + point.averageLiters, 0), averageColdLiters: entries.reduce((sum, point) => sum + point.averageColdLiters, 0), averageWarmLiters: entries.reduce((sum, point) => sum + point.averageWarmLiters, 0), averageWaterTemp: average(entries.map(point => point.averageWaterTemp)), averagePeakWaterTemp: average(entries.map(point => point.averagePeakWaterTemp)) } })
  const totalLiters = floors.reduce((sum, item) => sum + item.totalLiters, 0)
  return { available: floors.some(item => item.available), floor: null, address: house.value, latestReadingAt: floors.map(item => item.latestReadingAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null, periodDays: period.value, totalLiters, previousPeriodLiters: floors.reduce((sum, item) => sum + item.previousPeriodLiters, 0), coldLiters: floors.reduce((sum, item) => sum + item.coldLiters, 0), warmLiters: floors.reduce((sum, item) => sum + item.warmLiters, 0), averageDailyLiters: floors.reduce((sum, item) => sum + item.averageDailyLiters, 0), peakDay: days.reduce<(typeof days)[number] | null>((peak, day) => !peak || day.totalLiters > peak.totalLiters ? day : peak, null), activeSensors: floors.reduce((sum, item) => sum + item.activeSensors, 0), alerts: floors.reduce((sum, item) => sum + item.alerts, 0), days, hourlyProfile }
}
async function loadStats() { if (!house.value) return; loading.value = true; error.value = ''; try { const dormIDs = selectedDormID.value == null ? houseDorms.value.map(dorm => dorm.dormID) : [selectedDormID.value]; const floorStats = await Promise.all(dormIDs.map(async dormID => { const response = await fetch(apiUrl(`/api/sensor-data/admin/stats/${dormID}?days=${period.value}`), { headers }); if (!response.ok) throw new Error(t('adminWater.analyticsError')); return response.json() as Promise<FloorWaterStats> })); stats.value = selectedDormID.value == null ? combineHouseStats(floorStats) : floorStats[0] ?? null } catch (cause) { error.value = cause instanceof Error ? cause.message : t('adminWater.analyticsError') } finally { loading.value = false } }
async function loadComparisons() { const results = await Promise.all(houseDorms.value.map(async dorm => { const response = await fetch(apiUrl(`/api/sensor-data/admin/stats/${dorm.dormID}?days=${period.value}`), { headers }); if (!response.ok) return null; const data: FloorWaterStats = await response.json(); return { dormID: dorm.dormID, floor: dorm.floor, totalLiters: data.totalLiters } })); comparisons.value = results.filter((item): item is NonNullable<typeof item> => item !== null) }
async function loadSensorStats() { if (!selectedSensor.value) return; sensorLoading.value = true; sensorError.value = ''; try { const response = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${encodeURIComponent(selectedSensor.value.sensorCode)}/stats?days=${sensorPeriod.value}`), { headers }); const data = await response.json(); if (!response.ok) throw new Error(t('adminWater.meterError')); sensorStats.value = data } catch (cause) { sensorError.value = cause instanceof Error ? cause.message : t('adminWater.meterError') } finally { sensorLoading.value = false } }
function openSensor(sensor: Sensor) { selectedSensor.value = sensor; sensorPeriod.value = period.value; sensorView.value = 'usage'; showSensorModal.value = true; loadSensorStats() }
async function downloadExport() { exportError.value = ''; if (new Date(exportFrom.value) > new Date(exportTo.value)) { exportError.value = t('adminWater.invalidRange'); return } exporting.value = true; try { const dormIDs = exportDorm.value !== 'all' ? [Number(exportDorm.value)] : exportHouse.value !== 'all' ? exportDormOptions.value.map(dorm => dorm.dormID) : undefined; const sensorCodes = exportSensor.value !== 'all' ? [exportSensor.value] : undefined; const response = await fetch(apiUrl('/api/sensor-data/admin/export'), { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: new Date(exportFrom.value).toISOString(), to: new Date(exportTo.value).toISOString(), fields: exportFields.value, dormIDs, sensorCodes }) }); if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.error || t('adminWater.exportError')) } const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `water-data-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url) } catch (cause) { exportError.value = cause instanceof Error ? cause.message : t('adminWater.exportError') } finally { exporting.value = false } }
watch(house, () => { selectedDormID.value = houseDorms.value[0]?.dormID ?? null })
watch(exportHouse, () => { exportDorm.value = 'all'; exportSensor.value = 'all' })
watch(exportDorm, () => { exportSensor.value = 'all' })
watch([selectedDormID, period], () => { if (period.value === 1 && view.value === 'hourly') view.value = 'usage'; loadStats() })
watch([house, period], loadComparisons)
watch(sensorPeriod, () => { if (showSensorModal.value) loadSensorStats() })
onMounted(async () => { try { const [dormResponse, sensorResponse] = await Promise.all([fetch(apiUrl('/api/auth/admin/dorms'), { headers }), fetch(apiUrl('/api/sensor-data/admin/sensors'), { headers })]); if (!dormResponse.ok || !sensorResponse.ok) throw new Error(t('adminWater.adminError')); dorms.value = await dormResponse.json(); sensors.value = await sensorResponse.json(); house.value = houses.value[0] || '' } catch (cause) { error.value = cause instanceof Error ? cause.message : t('adminWater.adminError'); loading.value = false } })
</script>
