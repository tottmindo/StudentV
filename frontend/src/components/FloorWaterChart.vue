<template>
  <div class="relative h-72 w-full">
    <canvas ref="canvas" aria-label="Daily floor water consumption compared with the historical average"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js'
import type { FloorWaterDay } from '@/types'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps<{ days: FloorWaterDay[] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'bar'> | null = null

function renderChart() {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.days.map(day => new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' }).format(new Date(`${day.date}T12:00:00`))),
      datasets: [
        { label: 'Last 7 days', data: props.days.map(day => day.currentLiters), backgroundColor: '#2563eb', borderRadius: 5 },
        { label: 'Historical daily average', data: props.days.map(day => day.historicalAverageLiters), backgroundColor: '#94a3b8', borderRadius: 5 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${Number(context.raw).toLocaleString()} L` } } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Liters' } }, x: { grid: { display: false } } },
    },
  })
}

onMounted(renderChart)
watch(() => props.days, renderChart, { deep: true })
onBeforeUnmount(() => chart?.destroy())
</script>
