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

        <div v-if="weeks.length" class="space-y-3">
          <button
            v-for="week in weeks"
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
                  Week {{ week.weekID }}
                </p>
                <p class="text-sm opacity-70">
                  {{ new Date(week.startDate).toLocaleDateString() }}
                  —
                  {{ new Date(week.endDate).toLocaleDateString() }}
                </p>
              </div>

              <div class="text-sm opacity-80 text-right">
                <p>Assigned user: {{ week.assignedUserID }}</p>
              </div>
            </div>
          </button>
        </div>

        <p v-else class="text-sm opacity-70">Loading cleaning weeks...</p>
        <p v-if="scheduleError" class="mt-4 text-sm text-red-500">
          {{ scheduleError }}
        </p>
      </section>

      <!-- =====================================================
           TASKS
      ====================================================== -->
      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">

        <div class="mb-4">
          <h2 class="text-2xl font-bold">My cleaning tasks</h2>
          <p class="text-sm opacity-70">
            Checklist for the selected week.
          </p>
        </div>

        <div v-if="selectedWeek">

          <!-- Week header -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-4 mb-4">
            <p class="font-semibold">
              Week {{ selectedWeek.weekID }}
            </p>
            <p class="text-sm opacity-70">
              {{ new Date(selectedWeek.startDate).toLocaleDateString() }}
              —
              {{ new Date(selectedWeek.endDate).toLocaleDateString() }}
            </p>
            <p class="text-sm opacity-70">
              Assigned to user: {{ selectedWeek.assignedUserID }}
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
                    @change="toggleTask(task)"
                    class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />

                  <span :class="task.isCompleted ? 'line-through opacity-70' : ''">
                    {{ task.title }}
                  </span>
                </label>

                <button
                  @click="deleteTask(task)"
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

          <button
            @click="addTask"
            class="mt-4 px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90"
          >
            + Add task
          </button>

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
import { onMounted, ref, watch } from 'vue'
import NavComponent from '@/components/NavComponent.vue'
import { getSocket } from '@/composables/socket'

const socket = getSocket()
const userID = Number(sessionStorage.getItem('userID') || 0)
const dormID = Number(sessionStorage.getItem('dormID') || 0)

type CleaningWeek = {
  weekID: number
  dormID: number
  startDate: string
  endDate: string
  assignedUserID: number
}

type CleaningWeekTask = {
  weekTaskID: number
  weekID: number
  assignedUserID: number
  title: string
  description?: string
  isCompleted: boolean
  isImportant: boolean
}

const navMenuType = ref('home')

const weeks = ref<CleaningWeek[]>([])
const selectedWeek = ref<CleaningWeek | null>(null)
const tasks = ref<CleaningWeekTask[]>([])

const scheduleError = ref('')
const tasksError = ref('')

/* -------------------------
   SOCKET CLEANUP HELPERS
--------------------------*/

const bindSocket = () => {
  socket.off('cleaningWeeks')
  socket.off('cleaningWeekTasks')
  socket.off('cleaningTaskUpdated')
  socket.off('cleaningTaskDeleted')

  socket.on('cleaningWeeks', (data: CleaningWeek[]) => {
    weeks.value = sortWeeks(data)
    if (!selectedWeek.value && weeks.value.length) {
      selectedWeek.value = weeks.value[0]
    }
  })

  socket.on('cleaningWeekTasks', (data: CleaningWeekTask[]) => {
    tasks.value = data
  })

  socket.on('cleaningTaskUpdated', (payload) => {
    const t = tasks.value.find(t => t.weekTaskID === payload.weekTaskID)
    if (t) t.isCompleted = payload.completed
  })

  socket.on('cleaningTaskDeleted', (payload) => {
    tasks.value = tasks.value.filter(t => t.weekTaskID !== payload.weekTaskID)
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
  socket.emit('getCleaningWeekTasks', { weekID })
}

/* -------------------------
   ACTIONS
--------------------------*/

const toggleTask = (task: CleaningWeekTask) => {
  socket.emit('toggleCleaningTask', {
    weekTaskID: task.weekTaskID,
    completed: !task.isCompleted
  })

  task.isCompleted = !task.isCompleted
}

const addTask = () => {
  if (!selectedWeek.value) return

  socket.emit('addCleaningTask', {
    weekID: selectedWeek.value.weekID,
    title: 'New task',
    description: '',
    isImportant: false
  })
}

const deleteTask = (task: CleaningWeekTask) => {
  socket.emit('deleteCleaningTask', {
    weekTaskID: task.weekTaskID
  })
}

/* -------------------------
   WEEK SELECTION
--------------------------*/

const selectWeek = (week: CleaningWeek) => {
  selectedWeek.value = week
  fetchTasks(week.weekID)
}

/* -------------------------
   HELPERS
--------------------------*/

const sortWeeks = (items: CleaningWeek[]) => {
  return items.slice().sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
}

/* -------------------------
   WATCHERS
--------------------------*/

watch(selectedWeek, (w) => {
  if (w) fetchTasks(w.weekID)
})

/* -------------------------
   INIT
--------------------------*/

onMounted(() => {
  bindSocket()
  fetchWeeks()
})
</script>
