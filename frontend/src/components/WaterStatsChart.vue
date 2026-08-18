<template>
  <div class="relative h-80 w-full md:h-96">
    <canvas ref="canvas" :aria-label="ariaLabel"></canvas>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarController, BarElement, CategoryScale, Chart, Filler, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js'
import type { FloorWaterStats } from '@/types'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/theme'

Chart.register(BarController, BarElement, CategoryScale, LineController, LineElement, LinearScale, PointElement, Tooltip, Legend, Filler)

const props = defineProps<{ stats: FloorWaterStats; view: 'usage' | 'split' | 'temperature' | 'hourly' }>()
const { t, locale } = useI18n()
const { isDark } = useTheme()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const ariaLabel = computed(() => ({
  usage: t('charts.usageAria'), split: t('charts.splitAria'),
  temperature: t('charts.temperatureAria'), hourly: t('charts.hourlyAria'),
}[props.view]))

const shortDate = (value: string) => new Intl.DateTimeFormat(locale.value, { month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))

function renderChart() {
  if (!canvas.value) return
  const textColor = isDark.value ? '#FFF4E8' : '#382E38'
  chart?.destroy()
  const isHourly = props.view === 'hourly' || props.stats.periodDays === 1
  const labels = isHourly ? Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`) : props.stats.days.map(day => shortDate(day.date))
  const hourly = new Map(props.stats.hourlyProfile.map(point => [point.hour, point]))
  const common = { borderWidth: 2, pointRadius: props.stats.days.length > 31 ? 0 : 2, tension: 0.3 }
  let datasets: any[]
  if (props.view === 'split') datasets = [
    { label: t('charts.coldWater'), data: isHourly ? labels.map((_, hour) => hourly.get(hour)?.averageColdLiters ?? 0) : props.stats.days.map(day => day.coldLiters), backgroundColor: '#2563eb', borderRadius: 4, stack: 'water' },
    { label: t('charts.warmWater'), data: isHourly ? labels.map((_, hour) => hourly.get(hour)?.averageWarmLiters ?? 0) : props.stats.days.map(day => day.warmLiters), backgroundColor: '#f97316', borderRadius: 4, stack: 'water' },
  ]
  else if (props.view === 'temperature') datasets = [
    { ...common, label: t('charts.averageTemperature'), data: isHourly ? labels.map((_, hour) => hourly.get(hour)?.averageWaterTemp ?? null) : props.stats.days.map(day => day.averageWaterTemp), borderColor: '#cf2e2e', backgroundColor: 'rgba(207,46,46,.12)', fill: true },
    { ...common, label: t('charts.peakTemperature'), data: isHourly ? labels.map((_, hour) => hourly.get(hour)?.averagePeakWaterTemp ?? null) : props.stats.days.map(day => day.peakWaterTemp), borderColor: '#f97316', borderDash: [5, 5] },
  ]
  else if (props.view === 'hourly') datasets = [{ ...common, label: t('charts.averageUsage'), data: labels.map((_, hour) => hourly.get(hour)?.averageLiters ?? 0), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.14)', fill: true }]
  else datasets = [{ ...common, label: isHourly ? t('charts.hourlyUsage') : t('charts.dailyUsage'), data: isHourly ? labels.map((_, hour) => hourly.get(hour)?.averageLiters ?? 0) : props.stats.days.map(day => day.totalLiters), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.14)', fill: true }]

  chart = new Chart(canvas.value, {
    type: props.view === 'split' ? 'bar' : 'line', data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${Number(context.raw).toLocaleString(locale.value, { maximumFractionDigits: 1 })}${props.view === 'temperature' ? ' °C' : ' L'}` } } },
      scales: {
        x: { stacked: props.view === 'split', grid: { display: false }, ticks: { color: textColor, maxTicksLimit: isHourly ? 12 : 10 } },
        y: { stacked: props.view === 'split', beginAtZero: props.view !== 'temperature', ticks: { color: textColor }, title: { display: true, text: props.view === 'temperature' ? t('charts.temperature') : t('charts.liters'), color: textColor } },
      },
    },
  })
}

onMounted(renderChart)
watch(() => [props.stats, props.view, locale.value, isDark.value], renderChart, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>
