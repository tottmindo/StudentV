<template>
  <div class="min-h-screen bg-background-light px-4 py-8 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-10">
    <main class="mx-auto max-w-7xl">
      <div class="mb-6 grid items-stretch gap-4 lg:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)]">
        <section class="flex flex-col justify-between rounded-2xl border border-border-border bg-background p-5 shadow-sm dark:bg-surface-dark">
          <label class="text-sm font-bold">Choose house<select v-model="house" class="mt-2 block w-full rounded-xl border border-border-border bg-transparent p-3 font-normal"><option v-for="value in houses" :key="value" :value="value">{{ value }}</option></select></label>
          <div class="mt-5 flex flex-wrap gap-1"><button v-for="value in periods" :key="value" class="rounded-xl px-3 py-2.5 text-sm font-bold" :class="period === value ? 'bg-text text-white dark:bg-text-dark dark:text-primary-dark' : 'bg-surface dark:bg-black/20'" @click="period = value">{{ value === 1 ? 'Today' : `${value}d` }}</button></div>
        </section>
        <section class="rounded-2xl border border-border-border bg-background p-5 shadow-sm dark:bg-surface-dark">
          <div class="flex flex-wrap items-end justify-between gap-4"><div><h2 class="text-xl font-bold">Floors in {{ house || 'house' }}</h2><p class="text-sm opacity-60">Select a floor from the list or click its consumption bar</p></div><label class="min-w-40 text-sm font-bold">Choose floor<select v-model.number="selectedDormID" class="mt-1 block w-full rounded-xl border border-border-border bg-transparent p-2.5 font-normal"><option v-for="dorm in houseDorms" :key="dorm.dormID" :value="dorm.dormID">Floor {{ dorm.floor }}</option></select></label></div>
          <div class="mt-5 space-y-4"><button v-for="item in comparisons" :key="item.dormID" class="grid w-full grid-cols-[5rem_1fr_auto] items-center gap-3 rounded-lg p-1 text-left transition hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent" @click="selectedDormID = item.dormID"><span class="font-bold">Floor {{ item.floor }}</span><span class="h-3 overflow-hidden rounded-full bg-surface dark:bg-black/20"><span class="block h-full rounded-full transition-all" :class="item.dormID === selectedDormID ? 'bg-accent' : 'bg-blue-500'" :style="{ width: `${comparisonWidth(item.totalLiters)}%` }"></span></span><span class="min-w-24 text-right font-semibold">{{ liters(item.totalLiters) }}</span></button><p v-if="!comparisons.length" class="py-5 text-center opacity-60">No comparable readings available.</p></div>
        </section>
      </div>

      <p v-if="error" class="mb-5 rounded-xl bg-error/10 p-4 font-semibold text-error">{{ error }}</p>
      <div v-if="loading" class="rounded-2xl bg-background py-24 text-center font-semibold opacity-60 dark:bg-surface-dark">Loading analytics…</div>
      <template v-else-if="stats">
        <section class="mb-6 rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark">
          <div class="mb-5 flex flex-wrap justify-between gap-3"><div><h2 class="text-xl font-bold">Floor {{ stats.floor }} consumption</h2><p class="text-sm opacity-60">{{ period === 1 ? 'Hourly volume so far today' : 'Daily volume for the selected house and floor' }}</p></div><div class="flex gap-1 rounded-xl bg-surface p-1 dark:bg-black/20"><button v-for="item in visibleViews" :key="item.value" class="rounded-lg px-3 py-2 text-sm font-bold" :class="view === item.value ? 'bg-background shadow dark:bg-surface-dark' : 'opacity-60'" @click="view = item.value">{{ item.label }}</button></div></div>
          <WaterStatsChart :stats="stats" :view="view" />
        </section>

        <section class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-2xl bg-[#172554] p-5 text-white"><p class="text-sm text-blue-200">Total use</p><p class="mt-3 text-3xl font-bold">{{ liters(stats.totalLiters) }}</p><p class="mt-2 text-sm text-blue-200">Floor {{ stats.floor }}, {{ period === 1 ? 'today' : `${period} days` }}</p></article>
          <article class="rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark"><p class="text-sm opacity-60">Daily average</p><p class="mt-3 text-3xl font-bold">{{ liters(stats.averageDailyLiters) }}</p></article>
          <article class="rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark"><p class="text-sm opacity-60">Registered meters</p><p class="mt-3 text-3xl font-bold">{{ floorSensors.length }}</p><p class="mt-2 text-sm opacity-60">{{ staleCount }} stale or without data</p></article>
          <article class="rounded-2xl border p-5" :class="alertCount ? 'border-warning bg-warning/10' : 'border-border-border bg-background dark:bg-surface-dark'"><p class="text-sm opacity-60">Operational alerts</p><p class="mt-3 text-3xl font-bold">{{ alertCount }}</p><p class="mt-2 text-sm opacity-60">Errors or detected leaks</p></article>
        </section>

        <section class="rounded-2xl border border-border-border bg-background p-5 dark:bg-surface-dark">
          <div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="text-xl font-bold">Meter operations</h2><p class="text-sm opacity-60">Each row uses the latest complete reading from a single timestamp</p></div><span class="text-xs opacity-60">Stale means no complete reading in 26 hours</span></div>
          <div class="mt-5 overflow-x-auto"><table class="w-full min-w-[900px] text-left text-sm"><thead><tr class="border-b border-border-border"><th class="p-3">Meter</th><th class="p-3">Type</th><th class="p-3">Location</th><th class="p-3">Last reading</th><th class="p-3">Battery</th><th class="p-3">Ambient temp.</th><th class="p-3">Used last 24h</th><th class="p-3">Status</th></tr></thead><tbody><tr v-for="sensor in floorSensors" :key="sensor.sensorCode" tabindex="0" class="cursor-pointer border-b border-border-border/60 transition hover:bg-accent/5 focus:bg-accent/10 focus:outline-none" title="Open meter charts" @click="openSensor(sensor)" @keydown.enter="openSensor(sensor)"><td class="p-3 font-mono">{{ sensor.sensorCode }}</td><td class="p-3">{{ sensor.type }}</td><td class="p-3">{{ sensor.location }}</td><td class="p-3">{{ date(sensor.recordedAt) }}</td><td class="p-3">{{ value(sensor.battery, ' V') }}</td><td class="p-3">{{ value(sensor.ambientTemp, ' °C') }}</td><td class="p-3"><span class="font-bold" :class="isHighUsage(sensor) ? 'text-error' : ''">{{ value(sensor.last24HoursLiters, ' L') }}</span><span v-if="isHighUsage(sensor)" class="ml-2 rounded-full bg-error/15 px-2 py-1 text-xs font-bold text-error">High</span></td><td class="p-3"><span class="rounded-full px-2 py-1 text-xs font-bold" :class="status(sensor).class">{{ status(sensor).label }}</span></td></tr><tr v-if="!floorSensors.length"><td colspan="8" class="p-8 text-center opacity-60">No meters registered for this floor.</td></tr></tbody></table></div>
        </section>
      </template>

      <ModalComponent v-model="showSensorModal">
        <div class="pr-8 text-text">
          <p class="text-sm font-bold uppercase tracking-wider text-accent">Meter detail</p>
          <h2 class="mt-1 text-2xl font-bold">{{ selectedSensor?.location || selectedSensor?.sensorCode }}</h2>
          <p class="mt-1 font-mono text-sm opacity-60">{{ selectedSensor?.sensorCode }} · {{ selectedSensor?.type }}</p>
          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div class="flex gap-1 rounded-xl bg-surface p-1"><button v-for="item in periods" :key="item" class="rounded-lg px-3 py-2 text-sm font-bold" :class="sensorPeriod === item ? 'bg-white shadow' : 'opacity-60'" @click="sensorPeriod = item">{{ item === 1 ? 'Today' : `${item}d` }}</button></div>
            <div class="flex gap-1 rounded-xl bg-surface p-1"><button v-for="item in sensorViews" :key="item.value" class="rounded-lg px-3 py-2 text-sm font-bold" :class="sensorView === item.value ? 'bg-white shadow' : 'opacity-60'" @click="sensorView = item.value">{{ item.label }}</button></div>
          </div>
          <div v-if="sensorLoading" class="grid h-80 place-items-center font-semibold opacity-60">Loading meter readings…</div>
          <p v-else-if="sensorError" class="mt-6 rounded-xl bg-error/10 p-4 font-semibold text-error">{{ sensorError }}</p>
          <div v-else-if="sensorStats" class="mt-5"><div class="mb-3 flex flex-wrap gap-5 text-sm"><span><strong>{{ liters(sensorStats.totalLiters) }}</strong> total</span><span v-if="sensorStats.latestReadingAt" class="opacity-60">Through {{ date(sensorStats.latestReadingAt) }}</span></div><WaterStatsChart :stats="sensorStats" :view="sensorView" /></div>
        </div>
      </ModalComponent>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import WaterStatsChart from '@/components/WaterStatsChart.vue'
import ModalComponent from '@/components/ModalComponent.vue'
import { apiUrl } from '@/composables/api'
import { getSocket } from '@/composables/socket'
import type { FloorWaterStats } from '@/types'

type Dorm = { dormID: number; floor: number; address: string }
type Sensor = { sensorCode: string; type: string; location: string; dormID: number; recordedAt: string | null; battery: number | null; ambientTemp: number | null; last24HoursLiters: number | null; errorCode: number | null; leakStatus: boolean | null }
type View = 'usage' | 'split' | 'temperature' | 'hourly'
const socket = getSocket(), periods = [1, 7, 30, 90] as const, period = ref<(typeof periods)[number]>(30)
const dorms = ref<Dorm[]>([]), sensors = ref<Sensor[]>([]), house = ref(''), selectedDormID = ref<number | null>(null), stats = ref<FloorWaterStats | null>(null), loading = ref(true), error = ref(''), view = ref<View>('usage')
const comparisons = ref<{ dormID: number; floor: number; totalLiters: number }[]>([])
const showSensorModal = ref(false), selectedSensor = ref<Sensor | null>(null), sensorStats = ref<FloorWaterStats | null>(null), sensorLoading = ref(false), sensorError = ref(''), sensorPeriod = ref<(typeof periods)[number]>(30), sensorView = ref<Exclude<View, 'hourly'>>('usage')
const sensorViews: { label: string; value: Exclude<View, 'hourly'> }[] = [{ label: 'Usage', value: 'usage' }, { label: 'Water mix', value: 'split' }, { label: 'Temperature', value: 'temperature' }]
const views: { label: string; value: View }[] = [{ label: 'Usage', value: 'usage' }, { label: 'Water mix', value: 'split' }, { label: 'Temperature', value: 'temperature' }, { label: 'By hour', value: 'hourly' }]
const visibleViews = computed(() => period.value === 1 ? views.filter(item => item.value !== 'hourly') : views)
const headers = { Authorization: `Bearer ${sessionStorage.getItem('authToken')}` }
const houses = computed(() => [...new Set(dorms.value.map(item => item.address))].sort())
const houseDorms = computed(() => dorms.value.filter(item => item.address === house.value).sort((a, b) => a.floor - b.floor))
const floorSensors = computed(() => sensors.value.filter(item => item.dormID === selectedDormID.value))
const isStale = (sensor: Sensor) => !sensor.recordedAt || Date.now() - new Date(sensor.recordedAt).getTime() > 26 * 60 * 60 * 1000
const staleCount = computed(() => floorSensors.value.filter(isStale).length)
const alertCount = computed(() => floorSensors.value.filter(item => item.leakStatus || Number(item.errorCode)).length)
const isHighUsage = (sensor: Sensor) => { const others = floorSensors.value.filter(item => item.sensorCode !== sensor.sensorCode && item.last24HoursLiters != null); if (!others.length) return false; const baseline = others.reduce((sum, item) => sum + Number(item.last24HoursLiters), 0) / others.length; return Number(sensor.last24HoursLiters) > Math.max(baseline * 2, 0) && Number(sensor.last24HoursLiters) > 0 }
const comparisonMax = computed(() => Math.max(...comparisons.value.map(item => item.totalLiters), 1))
const comparisonWidth = (total: number) => total / comparisonMax.value * 100
const liters = (number: number) => `${Math.round(number).toLocaleString()} L`
const date = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No data'
const value = (number: number | null, suffix: string) => number == null ? '—' : `${Number(number).toLocaleString()}${suffix}`
const status = (sensor: Sensor) => sensor.leakStatus ? { label: 'Leak', class: 'bg-error/15 text-error' } : Number(sensor.errorCode) ? { label: `Error ${sensor.errorCode}`, class: 'bg-warning/20 text-yellow-800 dark:text-yellow-300' } : isStale(sensor) ? { label: 'Stale', class: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' } : { label: 'Online', class: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' }
async function loadStats() { if (!selectedDormID.value) return; loading.value = true; error.value = ''; try { const response = await fetch(apiUrl(`/api/sensor-data/admin/stats/${selectedDormID.value}?days=${period.value}`), { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); stats.value = data } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load analytics.' } finally { loading.value = false } }
async function loadComparisons() { const results = await Promise.all(houseDorms.value.map(async dorm => { const response = await fetch(apiUrl(`/api/sensor-data/admin/stats/${dorm.dormID}?days=${period.value}`), { headers }); if (!response.ok) return null; const data: FloorWaterStats = await response.json(); return { dormID: dorm.dormID, floor: dorm.floor, totalLiters: data.totalLiters } })); comparisons.value = results.filter((item): item is NonNullable<typeof item> => item !== null) }
async function loadSensorStats() { if (!selectedSensor.value) return; sensorLoading.value = true; sensorError.value = ''; try { const response = await fetch(apiUrl(`/api/sensor-data/admin/sensors/${encodeURIComponent(selectedSensor.value.sensorCode)}/stats?days=${sensorPeriod.value}`), { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.error); sensorStats.value = data } catch (cause) { sensorError.value = cause instanceof Error ? cause.message : 'Could not load meter readings.' } finally { sensorLoading.value = false } }
function openSensor(sensor: Sensor) { selectedSensor.value = sensor; sensorPeriod.value = period.value; sensorView.value = 'usage'; showSensorModal.value = true; loadSensorStats() }
watch(house, () => { selectedDormID.value = houseDorms.value[0]?.dormID ?? null })
watch([selectedDormID, period], () => { if (period.value === 1 && view.value === 'hourly') view.value = 'usage'; loadStats() })
watch([house, period], loadComparisons)
watch(sensorPeriod, () => { if (showSensorModal.value) loadSensorStats() })
onMounted(async () => { try { const [dormResponse, sensorResponse] = await Promise.all([fetch(apiUrl('/api/auth/admin/dorms'), { headers }), fetch(apiUrl('/api/sensor-data/admin/sensors'), { headers })]); if (!dormResponse.ok || !sensorResponse.ok) throw new Error('Could not load administration data.'); dorms.value = await dormResponse.json(); sensors.value = await sensorResponse.json(); house.value = houses.value[0] || '' } catch (cause) { error.value = cause instanceof Error ? cause.message : 'Could not load administration data.'; loading.value = false } })
</script>
