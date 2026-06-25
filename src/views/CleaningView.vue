<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4 z-50" />
  <div class="min-h-screen p-6 bg-background dark:bg-background-dark">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-headline dark:text-text-dark">Cleaning Schedule</h1>
        <p class="text-sm text-text dark:text-text-dark opacity-70">See whose week it is to clean shared spaces and complete your personal checklist.</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold">Weekly assignments</h2>
            <p class="text-sm opacity-70">Tap any week to view tasks assigned to you.</p>
          </div>
        </div>
        <div v-if="schedule.length" class="space-y-3">
          <button
            v-for="entry in schedule"
            :key="entry.weekId"
            @click="selectWeek(entry)"
            :class="[
              'w-full text-left rounded-lg border p-4 transition hover:border-accent hover:bg-accent/10',
              entry.weekId === selectedWeek?.weekId ? 'border-accent bg-accent/10' : 'border-gray-200 dark:border-gray-700'
            ]"
          >
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-semibold">{{ weekEntryTitle(entry) }}</p>
                <p class="text-sm opacity-70">{{ formatDateRange(entry) }}</p>
              </div>
              <div class="text-sm text-right opacity-80">
                <p>{{ entry.assignedTo }}</p>
                <p class="mt-1 uppercase text-xs">{{ entry.notes || 'Shared areas' }}</p>
              </div>
            </div>
          </button>
        </div>
        <p v-else class="text-sm opacity-70">Loading schedule...</p>
        <p v-if="scheduleError" class="mt-4 text-sm text-red-500">{{ scheduleError }}</p>
      </section>

      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <div class="mb-4">
          <h2 class="text-2xl font-bold">My cleaning tasks</h2>
          <p class="text-sm opacity-70">A per-user checklist for the selected cleaning week.</p>
        </div>

        <div v-if="selectedWeek">
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-4 mb-4">
            <p class="font-semibold">{{ weekEntryTitle(selectedWeek) }}</p>
            <p class="text-sm opacity-70">Assigned to: {{ selectedWeek.assignedTo }}</p>
            <p class="text-sm opacity-70">{{ formatDateRange(selectedWeek) }}</p>
          </div>

          <ol class="space-y-3">
            <li
              v-for="task in cleaningTasks"
              :key="task.id"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-surface dark:bg-surface-dark"
            >
              <label class="flex items-center gap-3">
                <input
                  type="checkbox"
                  :checked="task.completed"
                  @change="handleTaskToggle(task.id, $event)"
                  class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span :class="task.completed ? 'line-through opacity-70' : ''">{{ task.title }}</span>
              </label>
            </li>
          </ol>

          <p v-if="!cleaningTasks.length" class="mt-4 text-sm opacity-70">No tasks assigned for this week yet.</p>
          <p v-if="tasksError" class="mt-4 text-sm text-red-500">{{ tasksError }}</p>
        </div>

        <p v-else class="text-sm opacity-70">Select a week to load your cleaning checklist.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import NavComponent from '@/components/NavComponent.vue'
import { getSocket } from '@/composables/socket'
import type { CleaningScheduleEntry, CleaningTask } from '@/types'

const navMenuType = ref('home')
const socket = getSocket()
const userID = Number(sessionStorage.getItem('userID') || 0)
const dormID = Number(sessionStorage.getItem('dormID') || 0)

const schedule = ref<CleaningScheduleEntry[]>([])
const selectedWeek = ref<CleaningScheduleEntry | null>(null)
const cleaningTasks = ref<CleaningTask[]>([])
const scheduleError = ref('')
const tasksError = ref('')

const scheduleCacheKey = 'cleaningScheduleCache'
const cacheTTL = 1000 * 60 * 10

const parseDate = (value?: string) => {
  if (!value) return undefined
  return new Date(value.replace(' ', 'T'))
}

const formatDate = (value: string) => {
  const date = parseDate(value)
  if (!date) return ''
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

const formatDateRange = (entry: CleaningScheduleEntry) => {
  if (!entry.weekStart || !entry.weekEnd) return ''
  return `${formatDate(entry.weekStart)} — ${formatDate(entry.weekEnd)}`
}

const weekEntryTitle = (entry: CleaningScheduleEntry) => `Week ${entry.weekNumber}, ${entry.year}`

const weekCacheKey = (weekId: string | undefined) => {
  if (!weekId) return ''
  return `cleaningTasks_${userID}_${weekId}`
}

const saveScheduleCache = (items: CleaningScheduleEntry[]) => {
  sessionStorage.setItem(scheduleCacheKey, JSON.stringify({
    fetchedAt: Date.now(),
    schedule: items,
  }))
}

const loadScheduleCache = (): { fetchedAt: number; schedule: CleaningScheduleEntry[] } | null => {
  try {
    const raw = sessionStorage.getItem(scheduleCacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { fetchedAt: number; schedule: CleaningScheduleEntry[] }
    if (!parsed || !Array.isArray(parsed.schedule)) return null
    return parsed
  } catch {
    return null
  }
}

const saveTasksCache = (weekId: string, tasks: CleaningTask[]) => {
  const key = weekCacheKey(weekId)
  sessionStorage.setItem(key, JSON.stringify(tasks))
}

const loadTasksCache = (weekId: string) => {
  try {
    const key = weekCacheKey(weekId)
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CleaningTask[]
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

const buildDefaultTasks = (weekId: string) => [
  { id: 1, weekId, title: 'Empty shared trash bins', completed: false },
  { id: 2, weekId, title: 'Wipe kitchen counters and tables', completed: false },
  { id: 3, weekId, title: 'Sweep and mop common area floors', completed: false },
  { id: 4, weekId, title: 'Clean door handles and light switches', completed: false },
  { id: 5, weekId, title: 'Restock shared cleaning supplies', completed: false },
]

const sortSchedule = (items: CleaningScheduleEntry[]) => {
  return items.slice().sort((a, b) => {
    const aStart = parseDate(a.weekStart)
    const bStart = parseDate(b.weekStart)
    if (!aStart || !bStart) return 0
    return aStart.getTime() - bStart.getTime()
  })
}

const isCurrentWeekEntry = (entry: CleaningScheduleEntry) => {
  const start = parseDate(entry.weekStart)
  const end = parseDate(entry.weekEnd)
  if (!start || !end) return false
  const now = Date.now()
  return now >= start.getTime() && now <= end.getTime()
}

const determineDefaultWeek = (items: CleaningScheduleEntry[]) => {
  if (!items.length) return null
  const sorted = sortSchedule(items)
  const current = sorted.find(isCurrentWeekEntry)
  if (current) return current
  const next = sorted.find((entry) => {
    const start = parseDate(entry.weekStart)
    return start ? start.getTime() > Date.now() : false
  })
  return next || sorted[0]
}

const selectWeek = (entry: CleaningScheduleEntry) => {
  selectedWeek.value = entry
}

const loadTasksForWeek = (weekId: string) => {
  if (!weekId) return
  const cachedTasks = loadTasksCache(weekId)
  if (cachedTasks) {
    cleaningTasks.value = cachedTasks
  }

  if (!userID) {
    tasksError.value = 'Missing user identity. Tasks cannot be loaded.'
    return
  }

    socket.emit("getCleaningTasks", { userID, weekId });

    socket.on("cleaningTasks", (tasks) => {
    cleaningTasks.value = tasks;
    });
}

const persistTaskState = () => {
  const weekId = selectedWeek.value?.weekId
  if (!weekId) return

  saveTasksCache(weekId, cleaningTasks.value)

  if (!userID) return
  socket.emit('saveCleaningTasks', { userID, weekId, tasks: cleaningTasks.value }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      tasksError.value = response.error
    }
  })
}

const handleTaskToggle = (id: number, event: Event) => {
  const input = event.target as HTMLInputElement
  toggleTask(id, input.checked)
}

const toggleTask = (id: number, completed: boolean) => {
  const index = cleaningTasks.value.findIndex((task) => task.id === id)
  if (index === -1) return
  cleaningTasks.value[index].completed = completed
  persistTaskState()
}

const fetchSchedule = () => {
  if (!dormID) {
    scheduleError.value = 'Dorm ID is missing from session.'
    return
  }

  socket.emit('getCleaningSchedule', { dormID }, (response: { schedule?: CleaningScheduleEntry[]; error?: string }) => {
    if (response?.schedule && Array.isArray(response.schedule) && response.schedule.length) {
      schedule.value = sortSchedule(response.schedule)
      saveScheduleCache(schedule.value)
      if (!selectedWeek.value) {
        selectedWeek.value = determineDefaultWeek(schedule.value)
      }
      if (selectedWeek.value) {
        loadTasksForWeek(selectedWeek.value.weekId)
      }
    } else {
      scheduleError.value = response?.error || 'Could not load cleaning schedule from server.'
    }
  })
}

const loadCachedSchedule = () => {
  const cached = loadScheduleCache()
  if (!cached || !cached.schedule?.length) return
  schedule.value = sortSchedule(cached.schedule)
  selectedWeek.value = determineDefaultWeek(schedule.value)
  const age = Date.now() - cached.fetchedAt
  if (age <= cacheTTL && selectedWeek.value) {
    loadTasksForWeek(selectedWeek.value.weekId)
  }
}

watch(selectedWeek, (newWeek) => {
  if (newWeek) {
    loadTasksForWeek(newWeek.weekId)
  }
})

onMounted(() => {
  loadCachedSchedule()
  fetchSchedule()
})
</script>
