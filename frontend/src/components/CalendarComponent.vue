<template>
  <div class="grid gap-4">
    <!-- Header: month/year + navigation -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        @click="goToPrevMonth"
        class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
        :aria-label="t('calendar.previous')"
      >
        &lsaquo;
      </button>

      <h3 class="text-lg font-semibold">
        {{ monthLabel }} {{ currentYear }}
      </h3>

      <button
        type="button"
        @click="goToNextMonth"
        class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
        :aria-label="t('calendar.next')"
      >
        &rsaquo;
      </button>
    </div>

    <!-- Weekday labels -->
    <div class="grid grid-cols-7 text-center text-xs font-semibold opacity-70">
      <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(cell, index) in calendarCells"
        :key="index"
        class="aspect-square flex flex-col items-center justify-center gap-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer"
          @click="cell.day && emitDayClick(cell.dateKey)"
        :class="cellClasses(cell)"
      >
        <span v-if="cell.day">{{ cell.day }}</span>
        <span v-if="cell.day && (cell.hasEvent || cell.hasCleaning || cell.hasExternal)" class="flex gap-1">
          <span v-if="cell.hasEvent" class="h-1.5 w-1.5 rounded-full bg-accent"></span>
          <span v-if="cell.hasCleaning" class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span v-if="cell.hasExternal" class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        </span>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-4 text-xs opacity-70">
      <span class="inline-flex items-center gap-2">
        <span class="w-3 h-3 rounded bg-gray-800 inline-block"></span>
        {{ t('calendar.today') }}
      </span>
      <span class="inline-flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-accent inline-block"></span>
        {{ t('calendar.event') }}
      </span>
      <span class="inline-flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
        {{ t('calendar.cleaning') }}
      </span>
      <span class="inline-flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
        {{ t('calendar.external') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps({
  // Optional: pass in event dates (YYYY-MM-DD strings) to mark on the calendar
  markedDates: {
    type: Array,
    default: () => []
  },
  cleaningDates: {
    type: Array,
    default: () => []
  },
  externalDates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['day-click'])

const today = new Date()
const viewDate = ref(new Date(today.getFullYear(), today.getMonth(), 1))

const weekdayLabels = computed(() => Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(new Date(2024, 0, 7 + day))))

const currentYear = computed(() => viewDate.value.getFullYear())
const monthLabel = computed(() => new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(viewDate.value))

const markedSet = computed(() => new Set(props.markedDates))
const cleaningSet = computed(() => new Set(props.cleaningDates))
const externalSet = computed(() => new Set(props.externalDates))


function toDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

const calendarCells = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null })
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()

    const dateKey = toDateKey(year, month, day)

    cells.push({
      day,
      dateKey,
      isToday,
      hasEvent: markedSet.value.has(dateKey),
      hasCleaning: cleaningSet.value.has(dateKey),
      hasExternal: externalSet.value.has(dateKey)
    })
  }

  return cells
})

function cellClasses(cell) {
  if (!cell.day) return ''
  const classes = []
  
  if (cell.isToday) {
    // Give Today a distinct dark/neutral background with an accent border/ring
    classes.push('bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-950 font-semibold ring-2 ring-accent')
  } else if (cell.hasEvent || cell.hasCleaning || cell.hasExternal) {
    if (cell.hasCleaning) {
      classes.push('border border-emerald-500 text-text dark:text-text-dark')
    } else if (cell.hasEvent) {
      classes.push('border border-accent text-text dark:text-text-dark')
    } else {
      classes.push('border border-blue-500 text-text dark:text-text-dark')
    }
  }
  return classes.join(' ')
}

function emitDayClick(dateKey) {
  if (!dateKey) return
  emit('day-click', dateKey)
}

function goToPrevMonth() {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() - 1,
    1
  )
}

function goToNextMonth() {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + 1,
    1
  )
}
</script>
