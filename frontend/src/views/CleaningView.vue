<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4 z-50" />

  <!-- Notification -->
  <div
    v-if="notification"
    :class="[
      'fixed top-4 left-4 z-50 px-4 py-3 rounded-lg text-white shadow-lg transition-all',
      notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
    ]"
  >
    {{ notification.message }}
  </div>

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
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <p class="font-semibold">
                  Week {{ getWeekLabel(week.startDate) }}
                </p>
                <p class="text-sm opacity-70">
                  {{ new Date(week.startDate).toLocaleDateString() }}
                  —
                  {{ new Date(week.endDate).toLocaleDateString() }}
                </p>
              </div>

              <div class="text-right">
                <div class="text-sm opacity-80">
                  <p>{{ week.assignedUsername }}</p>
                  <p>{{ week.completedTasks }} / {{ week.totalTasks }} done</p>
                </div>
                
                <!-- Swap button for future weeks assigned to OTHER users -->
                <button
                  v-if="canRequestSwapWith(week)"
                  @click.stop="selectedSwapTargetWeek = week; showSwapModal = true"
                  class="mt-2 text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  Swap
                </button>
                <div
                  v-else-if="hasPendingSwapForWeek(week.weekID)"
                  class="mt-2 text-xs px-2 py-1 rounded bg-gray-400 text-white opacity-60 cursor-not-allowed"
                >
                  Pending
                </div>              </div>
            </div>
          </button>
        </div>

        <p v-else class="text-sm opacity-70">
          {{ weeks.length ? 'No current or upcoming cleaning weeks.' : 'Loading cleaning weeks...' }}
        </p>
        <p v-if="scheduleError" class="mt-4 text-sm text-red-500">
          {{ scheduleError }}
        </p>

        <!-- Pending Incoming Swap Requests -->
        <div v-if="getPendingIncomingSwapRequests().length" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold mb-3">Pending swap requests</h3>
          <div class="space-y-3">
            <div
              v-for="request in getPendingIncomingSwapRequests()"
              :key="request.requestID"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-background-light dark:bg-background-dark"
            >
              <p class="text-sm mb-2">
                <strong>{{ request.requesterUsername }}</strong> wants to swap their
                <strong>Week {{ getWeekLabel(weeks.find(w => w.weekID === request.sourceWeekID)?.startDate || '') }}</strong>
                for your
                <strong>Week {{ getWeekLabel(weeks.find(w => w.weekID === request.targetWeekID)?.startDate || '') }}</strong>
              </p>
              <div class="flex gap-2">
                <button
                  @click="respondToSwap(request, true)"
                  class="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition"
                >
                  Accept
                </button>
                <button
                  @click="respondToSwap(request, false)"
                  class="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Outgoing Swap Requests -->
        <div v-if="getPendingOutgoingSwapRequests().length" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold mb-3">Your pending swap requests</h3>
          <div class="space-y-3">
            <div
              v-for="request in getPendingOutgoingSwapRequests()"
              :key="request.requestID"
              class="rounded-lg border border-yellow-300 dark:border-yellow-700 p-4 bg-yellow-50 dark:bg-yellow-900/20"
            >
              <p class="text-sm mb-2">
                Waiting for <strong>{{ request.targetUsername }}</strong> to respond to your swap request
              </p>
              <p class="text-xs opacity-70 mb-2">
                You offered: Week {{ getWeekLabel(weeks.find(w => w.weekID === request.sourceWeekID)?.startDate || '') }}
                <br />
                Requesting: Week {{ getWeekLabel(weeks.find(w => w.weekID === request.targetWeekID)?.startDate || '') }}
              </p>
              <div class="flex items-center gap-2 text-xs">
                <span class="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span class="opacity-70">Pending response</span>
              </div>
            </div>
          </div>
        </div>

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
                  v-if="isUserCreatedTask(task) && isAssignedToCurrentUser(task)"
                  @click="deleteTask(task)"
                  class="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>

              </div>

              <p v-if="task.description" class="text-xs opacity-70 mt-1">
                {{ task.description }}
              </p>

              <div class="flex gap-2 mt-1">
                <p v-if="task.isImportant" class="text-xs text-red-500">
                  Important
                </p>
                <p v-if="isUserCreatedTask(task)" class="text-xs text-blue-500">
                  Custom task
                </p>
              </div>

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

    <!-- =====================================================
         SWAP MODAL
    ====================================================== -->
    <div
      v-if="showSwapModal && selectedSwapTargetWeek"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showSwapModal = false"
    >
      <div class="bg-surface dark:bg-surface-dark rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-bold mb-4">Request cleaning week swap</h3>

        <p class="text-sm mb-4">
          You're about to request a swap between:
        </p>

        <div class="space-y-3 mb-4">
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-background-light dark:bg-background-dark">
            <p class="text-xs opacity-70">Your week (offering)</p>
            <p class="font-semibold">
              Week {{ selectedWeek ? getWeekLabel(selectedWeek.startDate) : '' }}
            </p>
            <p class="text-xs opacity-70">
              {{ selectedWeek ? new Date(selectedWeek.startDate).toLocaleDateString() : '' }}
              —
              {{ selectedWeek ? new Date(selectedWeek.endDate).toLocaleDateString() : '' }}
            </p>
          </div>

          <div class="text-center">
            <p class="text-2xl">↔</p>
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-background-light dark:bg-background-dark">
            <p class="text-xs opacity-70">Their week (requesting)</p>
            <p class="font-semibold">
              Week {{ selectedSwapTargetWeek ? getWeekLabel(selectedSwapTargetWeek.startDate) : '' }}
            </p>
            <p class="text-xs opacity-70">
              {{ selectedSwapTargetWeek ? new Date(selectedSwapTargetWeek.startDate).toLocaleDateString() : '' }}
              —
              {{ selectedSwapTargetWeek ? new Date(selectedSwapTargetWeek.endDate).toLocaleDateString() : '' }}
            </p>
            <p class="text-sm font-semibold mt-2">
              {{ selectedSwapTargetWeek?.assignedUsername }}
            </p>
          </div>
        </div>

        <p v-if="swapError" class="text-sm text-red-500 mb-4">
          {{ swapError }}
        </p>

        <div class="flex gap-2">
          <button
            @click="showSwapModal = false"
            class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            @click="requestSwap(selectedSwapTargetWeek)"
            class="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm hover:opacity-90 transition"
          >
            Request swap
          </button>
        </div>
      </div>
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

type CleaningWeekSwapRequest = {
  requestID: number
  dormID: number
  requesterUserID: number
  requesterUsername?: string
  targetUserID: number
  targetUsername?: string
  sourceWeekID: number
  targetWeekID: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
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
  createdByUserID?: number | null
}

const navMenuType = ref('home')

const weeks = ref<CleaningWeek[]>([])
const selectedWeek = ref<CleaningWeek | null>(null)
const tasks = ref<CleaningWeekTask[]>([])
const swapRequests = ref<CleaningWeekSwapRequest[]>([])

const scheduleError = ref('')
const tasksError = ref('')
const newTaskTitle = ref('')
const newTaskDescription = ref('')
const isSavingTask = ref(false)
const showHistoricalWeeks = ref(false)
const showSwapModal = ref(false)
const selectedSwapTargetWeek = ref<CleaningWeek | null>(null)
const swapError = ref('')
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)

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
  socket.off('cleaningWeekSwapRequests')
  socket.off('cleaningWeekSwapRequestCreated')
  socket.off('cleaningWeekSwapRequestResponded')
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

  socket.on('cleaningWeekSwapRequests', (data: CleaningWeekSwapRequest[]) => {
    swapRequests.value = data
  })

  socket.on('cleaningWeekSwapRequestCreated', () => {
    swapError.value = ''
    showSwapModal.value = false
    selectedSwapTargetWeek.value = null
    fetchSwapRequests()
  })

  socket.on('cleaningWeekSwapRequestResponded', () => {
    swapError.value = ''
    fetchSwapRequests()
    fetchWeeks()
  })

  socket.on('cleaningWeekSwapAccepted', (data: { requesterUsername: string; sourceWeekLabel: string; targetWeekLabel: string }) => {
    notification.value = {
      message: `Your swap request was accepted! ${data.requesterUsername} swapped with you.`,
      type: 'success'
    }
    setTimeout(() => {
      notification.value = null
    }, 5000)
  })

  socket.on('swapRequestUpdated', () => {
    fetchSwapRequests()
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

const fetchSwapRequests = () => {
  if (!dormID) return
  socket.emit('getCleaningWeekSwapRequests', { dormID })
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
  // Only allow deletion of user-created tasks (createdByUserID is set and matches current user)
  if (!isUserCreatedTask(task) || !isAssignedToCurrentUser(task)) {
    tasksError.value = 'You can only delete custom tasks you created.'
    return
  }

  socket.emit('deleteCleaningTask', {
    weekTaskID: task.weekTaskID
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      tasksError.value = response.error
    }
  })
}

const requestSwap = (targetWeek: CleaningWeek) => {
  if (!selectedWeek.value || !canRequestSwapWith(targetWeek)) return
  
  if (hasOutgoingPendingSwapForWeek(selectedWeek.value.weekID)) {
    swapError.value = 'You already have a pending swap request for this week.'
    return
  }
  
  swapError.value = ''
  socket.emit('requestCleaningWeekSwap', {
    sourceWeekID: selectedWeek.value.weekID,
    targetWeekID: targetWeek.weekID
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      swapError.value = response.error
    } else {
      showSwapModal.value = false
      selectedSwapTargetWeek.value = null
      fetchSwapRequests()
    }
  })
}

const respondToSwap = (request: CleaningWeekSwapRequest, accepted: boolean) => {
  swapError.value = ''
  socket.emit('respondCleaningWeekSwapRequest', {
    requestID: request.requestID,
    accepted
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      swapError.value = response.error
    } else {
      fetchSwapRequests()
      fetchWeeks()
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

const isUserCreatedTask = (task: CleaningWeekTask) => {
  return task.createdByUserID !== null && task.createdByUserID !== undefined
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

const getPendingIncomingSwapRequests = () => {
  return swapRequests.value.filter(req => 
    req.targetUserID === userID && req.status === 'pending'
  )
}

const getPendingOutgoingSwapRequests = () => {
  return swapRequests.value.filter(req => 
    req.requesterUserID === userID && req.status === 'pending'
  )
}

const hasPendingSwapForWeek = (weekID: number) => {
  return swapRequests.value.some(req =>
    (req.sourceWeekID === weekID || req.targetWeekID === weekID) &&
    req.status === 'pending'
  )
}

const hasOutgoingPendingSwapForWeek = (weekID: number) => {
  return swapRequests.value.some(req =>
    req.sourceWeekID === weekID &&
    req.requesterUserID === userID &&
    req.status === 'pending'
  )
}

const canRequestSwapWith = (targetWeek: CleaningWeek) => {
  const sourceWeek = selectedWeek.value
  return Boolean(
    sourceWeek &&
    sourceWeek.assignedUserID === userID &&
    sourceWeek.weekID !== targetWeek.weekID &&
    targetWeek.assignedUserID !== userID &&
    new Date(sourceWeek.startDate) > new Date() &&
    new Date(targetWeek.startDate) > new Date() &&
    !hasPendingSwapForWeek(sourceWeek.weekID) &&
    !hasPendingSwapForWeek(targetWeek.weekID)
  )
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
  fetchSwapRequests()
})

onUnmounted(() => {
  socket.off('cleaningWeeks')
  socket.off('cleaningWeekTasks')
  socket.off('cleaningTaskUpdated')
  socket.off('cleaningTaskDeleted')
  socket.off('cleaningWeekSwapRequests')
  socket.off('cleaningWeekSwapRequestCreated')
  socket.off('cleaningWeekSwapRequestResponded')
  socket.off('cleaningWeekSwapAccepted')
  socket.off('swapRequestUpdated')
  socket.off('error')
})
</script>
