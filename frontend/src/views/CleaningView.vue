<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4 z-50" />

  <div class="min-h-screen p-6 bg-background dark:bg-background-dark">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-headline dark:text-text-dark">
          Cleaning Schedule
        </h1>
        <p class="text-sm text-text dark:text-text-dark opacity-70">
          See whose week it is and complete your cleaning checklist.
        </p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">

      <!-- =====================================================
           WEEKS LIST
      ====================================================== -->
      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <div class="mb-4">
          <h2 class="text-2xl font-bold">Cleaning weeks</h2>
          <p class="text-sm opacity-70">Select a week to view your tasks.</p>
        </div>

        <button
          type="button"
          class="mb-4 rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:border-accent hover:bg-accent/10 dark:border-gray-700"
          @click="showHistoricalWeeks = !showHistoricalWeeks"
        >
          {{ showHistoricalWeeks ? 'Hide historical weeks' : 'Show historical weeks' }}
        </button>

        <div v-if="visibleWeeks.length" class="space-y-3">
          <button
            v-for="week in visibleWeeks"
            :key="week.weekID"
            @click="selectWeek(week)"
            :class="[
              'w-full text-left rounded-lg border p-4 transition hover:border-accent hover:bg-accent/10',
              week.weekID === selectedWeek?.weekID
                ? 'border-accent bg-accent/10'
                : 'border-gray-200 dark:border-gray-700'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">
                  Week {{ getWeekLabel(week.startDate) }}
                </p>
                <p class="text-sm opacity-70">
                  {{ new Date(week.startDate).toLocaleDateString() }}
                  —
                  {{ new Date(week.endDate).toLocaleDateString() }}
                </p>
              </div>

              <div class="text-sm opacity-80 text-right">
                <p>{{ week.assignedUsername }}</p>
                <p>{{ week.completedTasks }} / {{ week.totalTasks }} done</p>
              </div>
            </div>
          </button>
        </div>

        <p v-else class="text-sm opacity-70">
          {{ weeks.length ? 'No current or upcoming cleaning weeks.' : 'Loading cleaning weeks...' }}
        </p>
        <p v-if="scheduleError" class="mt-4 text-sm text-red-500">
          {{ scheduleError }}
        </p>
      </section>

      <!-- =====================================================
           TASKS
      ====================================================== -->
      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">

        <div class="mb-4">
          <h2 class="text-2xl font-bold">Cleaning tasks</h2>
          <p class="text-sm opacity-70">
            Checklist for the selected week.
          </p>
        </div>

        <div v-if="selectedWeek">

          <!-- Week header -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-4 mb-4">
            <p class="font-semibold">
              Week {{ getWeekLabel(selectedWeek.startDate) }}
            </p>
            <p class="text-sm opacity-70">
              {{ new Date(selectedWeek.startDate).toLocaleDateString() }}
              —
              {{ new Date(selectedWeek.endDate).toLocaleDateString() }}
            </p>
            <p class="text-sm opacity-70">
              Assigned: {{ selectedWeek.assignedUsername }}
            </p>
            <p class="text-sm opacity-70">
              {{ selectedWeek.completedTasks }} of {{ selectedWeek.totalTasks }} tasks completed
            </p>
          </div>

          <!-- Task list -->
          <ol class="space-y-3">

            <li
              v-for="task in tasks"
              :key="task.weekTaskID"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-surface dark:bg-surface-dark"
            >

              <div class="flex items-center justify-between gap-4">

                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="task.isCompleted"
                    :disabled="!canUpdateTask(task)"
                    @change="toggleTask(task)"
                    class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <span>
                    <span :class="task.isCompleted ? 'line-through opacity-70' : ''">
                      {{ task.title }}
                    </span>
                    <span class="block text-xs opacity-60">
                      {{ task.assignedUsername ? `Assigned to ${task.assignedUsername}` : 'Unassigned' }}
                    </span>
                  </span>
                </label>

                <button
                  v-if="isAssignedToCurrentUser(task)"
                  @click="deleteTask(task)"
                  class="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>

              </div>

              <p v-if="task.description" class="text-xs opacity-70 mt-1">
                {{ task.description }}
              </p>

              <p v-if="task.isImportant" class="text-xs text-red-500 mt-1">
                Important
              </p>

            </li>

          </ol>

          <p v-if="!tasks.length" class="mt-4 text-sm opacity-70">
            No tasks for this week.
          </p>

          <p v-if="selectedWeek && !isCurrentWeek(selectedWeek)" class="mt-4 text-sm opacity-70">
            Tasks can only be checked off during this cleaning week.
          </p>

          <form
            v-if="isSelectedWeekAssignedToCurrentUser()"
            class="mt-4 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            @submit.prevent="addTask"
          >
            <input
              v-model.trim="newTaskTitle"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-background-dark dark:text-text-dark"
              placeholder="Task title"
            />
            <textarea
              v-model.trim="newTaskDescription"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-background-dark dark:text-text-dark"
              rows="2"
              placeholder="Description"
            />
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50"
              :disabled="!newTaskTitle || isSavingTask"
            >
              Add task
            </button>
          </form>
          <p v-else class="mt-4 text-sm opacity-70">
            Only {{ selectedWeek.assignedUsername }} can add tasks for this week.
          </p>

        </div>

        <p v-else class="text-sm opacity-70">
          Select a week to load tasks.
        </p>

        <p v-if="tasksError" class="mt-4 text-sm text-red-500">
          {{ tasksError }}
        </p>

      </section>

    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import NavComponent from '@/components/NavComponent.vue'
import { getSocket } from '@/composables/socket'
import { useRoute } from 'vue-router'

const socket = getSocket()
const route = useRoute()
const userID = Number(sessionStorage.getItem('userID') || 0)
const dormID = Number(sessionStorage.getItem('dormID') || 0)

type CleaningWeek = {
  weekID: number
  dormID: number
  assignedUserID: number
  assignedUsername: string
  startDate: string
  endDate: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
}

type CleaningWeekTask = {
  weekTaskID: number
  weekID: number
  assignedUserID: number
  title: string
  description?: string
  assignedUsername?: string | null
  isCompleted: boolean
  isImportant: boolean
}

const navMenuType = ref('home')

const weeks = ref<CleaningWeek[]>([])
const selectedWeek = ref<CleaningWeek | null>(null)
const tasks = ref<CleaningWeekTask[]>([])

const scheduleError = ref('')
const tasksError = ref('')
const newTaskTitle = ref('')
const newTaskDescription = ref('')
const isSavingTask = ref(false)
const showHistoricalWeeks = ref(false)

const visibleWeeks = computed(() => {
  const sorted = sortWeeks(weeks.value)
  return showHistoricalWeeks.value ? sorted : sorted.filter(isCurrentOrUpcomingWeek)
})

/* -------------------------
   SOCKET CLEANUP HELPERS
--------------------------*/

const bindSocket = () => {
  socket.off('cleaningWeeks')
  socket.off('cleaningWeekTasks')
  socket.off('cleaningTaskUpdated')
  socket.off('cleaningTaskDeleted')
  socket.off('error')

  socket.on('cleaningWeeks', (data: CleaningWeek[]) => {
    weeks.value = sortWeeks(data)
    const selectableWeeks = visibleWeeks.value
    const requestedWeek = getRequestedWeek(selectableWeeks)

    if (requestedWeek) {
      selectedWeek.value = requestedWeek
    } else if (!selectedWeek.value && selectableWeeks.length) {
      selectedWeek.value = getCurrentWeek(selectableWeeks) ?? selectableWeeks[0]
    } else if (selectedWeek.value) {
      selectedWeek.value = selectableWeeks.find(week => week.weekID === selectedWeek.value?.weekID)
        ?? (selectableWeeks.length ? getCurrentWeek(selectableWeeks) ?? selectableWeeks[0] : null)
    }
  })

  socket.on('cleaningWeekTasks', (data: CleaningWeekTask[]) => {
    tasks.value = data
    tasksError.value = ''
  })

  socket.on('cleaningTaskUpdated', (payload) => {
    const t = tasks.value.find(t => t.weekTaskID === payload.weekTaskID)
    if (t) t.isCompleted = payload.completed
    fetchWeeks()
  })

  socket.on('cleaningTaskDeleted', (payload) => {
    tasks.value = tasks.value.filter(t => t.weekTaskID !== payload.weekTaskID)
    fetchWeeks()
  })

  socket.on('error', (error: { message?: string }) => {
    const message = error?.message || 'Something went wrong.'
    scheduleError.value = message
    tasksError.value = message
  })
}

/* -------------------------
   FETCH DATA
--------------------------*/
const generateCleaningSchedule = () => {
  console.log('generateCleaningSchedule')
  socket.emit('rungenerateCleaningWeekForDorm')
}
const fetchWeeks = () => {
  if (!dormID) {
    scheduleError.value = 'Missing dormID'
    return
  }
  socket.emit('getCleaningWeeks')
}

const fetchTasks = (weekID: number) => {
  if (!userID) return
  tasksError.value = ''
  socket.emit('getCleaningWeekTasks', { weekID })
}

/* -------------------------
   ACTIONS
--------------------------*/

const toggleTask = (task: CleaningWeekTask) => {
  if (!isAssignedToCurrentUser(task)) {
    tasksError.value = 'Only the assigned user can update this task.'
    return
  }
  if (!selectedWeek.value || !isCurrentWeek(selectedWeek.value)) {
    tasksError.value = 'Cleaning tasks can only be updated during their assigned week.'
    return
  }

  const nextValue = !task.isCompleted
  task.isCompleted = nextValue

  socket.emit('toggleCleaningTask', {
    weekTaskID: task.weekTaskID,
    completed: nextValue
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      task.isCompleted = !nextValue
      tasksError.value = response.error
    }
  })
}

const addTask = () => {
  if (!selectedWeek.value || !isSelectedWeekAssignedToCurrentUser() || !newTaskTitle.value || isSavingTask.value) return

  isSavingTask.value = true
  socket.emit('addCleaningTask', {
    weekID: selectedWeek.value.weekID,
    title: newTaskTitle.value,
    description: newTaskDescription.value,
    isImportant: false
  }, (response: { success?: boolean; error?: string }) => {
    isSavingTask.value = false
    if (response?.error) {
      tasksError.value = response.error
      return
    }

    newTaskTitle.value = ''
    newTaskDescription.value = ''
    fetchWeeks()
  })
}

const deleteTask = (task: CleaningWeekTask) => {
  if (!isAssignedToCurrentUser(task)) return

  socket.emit('deleteCleaningTask', {
    weekTaskID: task.weekTaskID
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      tasksError.value = response.error
    }
  })
}

/* -------------------------
   WEEK SELECTION
--------------------------*/

const selectWeek = (week: CleaningWeek) => {
  selectedWeek.value = week
}

/* -------------------------
   HELPERS
--------------------------*/

const sortWeeks = (items: CleaningWeek[]) => {
  return items.slice().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

const isCurrentOrUpcomingWeek = (week: CleaningWeek) => {
  const today = startOfLocalDay(new Date()).getTime()
  return startOfLocalDay(new Date(week.endDate)).getTime() >= today
}

const getCurrentWeek = (items: CleaningWeek[]) => {
  return items.find((week) => {
    return isCurrentWeek(week)
  })
}

const getRequestedWeek = (items: CleaningWeek[]) => {
  const requestedWeekID = Number(route.query.weekID)
  if (!requestedWeekID) return undefined

  return items.find((week) => week.weekID === requestedWeekID)
}

const startOfLocalDay = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const getWeekLabel = (dateValue: string) => {
  const date = startOfLocalDay(new Date(dateValue))
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7))
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000)
  return `${week}, ${thursday.getFullYear()}`
}

const isAssignedToCurrentUser = (task: CleaningWeekTask) => {
  return task.assignedUserID === userID
}

const isCurrentWeek = (week: CleaningWeek) => {
  const start = startOfLocalDay(new Date(week.startDate)).getTime()
  const end = startOfLocalDay(new Date(week.endDate)).getTime()
  const current = startOfLocalDay(new Date()).getTime()
  return start <= current && end >= current
}

const canUpdateTask = (task: CleaningWeekTask) => {
  return isAssignedToCurrentUser(task) && Boolean(selectedWeek.value && isCurrentWeek(selectedWeek.value))
}

const isSelectedWeekAssignedToCurrentUser = () => {
  return selectedWeek.value?.assignedUserID === userID
}

/* -------------------------
   WATCHERS
--------------------------*/

watch(selectedWeek, (w) => {
  if (w) fetchTasks(w.weekID)
})

watch(visibleWeeks, (items) => {
  const requestedWeek = getRequestedWeek(items)
  if (requestedWeek) {
    selectedWeek.value = requestedWeek
    return
  }

  if (!selectedWeek.value || !items.some(week => week.weekID === selectedWeek.value?.weekID)) {
    selectedWeek.value = items.length ? getCurrentWeek(items) ?? items[0] : null
  }
})

/* -------------------------
   INIT
--------------------------*/

onMounted(() => {
  bindSocket()
  fetchWeeks()
})

onUnmounted(() => {
  socket.off('cleaningWeeks')
  socket.off('cleaningWeekTasks')
  socket.off('cleaningTaskUpdated')
  socket.off('cleaningTaskDeleted')
  socket.off('error')
})
</script>
