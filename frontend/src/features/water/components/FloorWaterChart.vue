<template>
  <div class="relative h-56 w-full min-w-0 max-w-full overflow-hidden xl:h-64">
    <canvas ref="canvas" class="max-w-full" :aria-label="t('charts.dailyFloorAria')"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js'
import type { FloorWaterDay } from '@/types'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/shared/composables/theme'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{ days: FloorWaterDay[] }>()
const { t, locale } = useI18n()
const { isDark } = useTheme()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'bar'> | null = null

function renderChart() {
  if (!canvas.value) return
  const textColor = isDark.value ? '#FFF4E8' : '#382E38'
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.days.map(day => new Intl.DateTimeFormat(locale.value, { weekday: 'short', day: 'numeric' }).format(new Date(`${day.date}T12:00:00`))),
      datasets: [
        { label: t('charts.lastSevenDays'), data: props.days.map(day => day.currentLiters), backgroundColor: '#2563eb', borderRadius: 5 },
        { label: t('charts.historicalAverage'), data: props.days.map(day => day.historicalAverageLiters), backgroundColor: '#94a3b8', borderRadius: 5 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor } }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${Number(context.raw).toLocaleString(locale.value)} L` } } },
      scales: {
        y: { beginAtZero: true, ticks: { color: textColor }, title: { display: true, text: t('charts.liters'), color: textColor } },
        x: { grid: { display: false }, ticks: { color: textColor } },
      },
    },
  })
}

onMounted(renderChart)
watch(() => [props.days, locale.value, isDark.value], renderChart, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>
