<template>

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

  <main class="min-h-[calc(100dvh-4rem-env(safe-area-inset-top))] space-y-6 bg-background p-3 text-text dark:bg-background-dark dark:text-text-dark sm:p-6">
    <div class="grid h-[calc(100dvh-7rem-env(safe-area-inset-top))] min-h-[38rem] grid-rows-2 gap-3 sm:gap-6 lg:grid-cols-[1.4fr_1fr] lg:grid-rows-1">

      <!-- =====================================================
           WEEKS LIST
      ====================================================== -->
      <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-surface p-3 dark:border-gray-700 dark:bg-surface-dark sm:p-5">
        <div class="mb-3 shrink-0 sm:mb-4">
          <h2 class="text-2xl font-bold">{{ t('cleaningView.weeks') }}</h2>
          <p class="text-sm opacity-70">{{ t('cleaningView.selectHelp') }}</p>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
        <button
          type="button"
          class="mb-4 rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:border-accent hover:bg-accent/10 dark:border-gray-700"
          @click="showHistoricalWeeks = !showHistoricalWeeks"
        >
          {{ t(showHistoricalWeeks ? 'cleaningView.hideHistory' : 'cleaningView.showHistory') }}
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
                  {{ t('cleaningView.week', { week: getWeekLabel(week.startDate) }) }}
                </p>
                <p class="text-sm opacity-70">
                  {{ formatDate(week.startDate) }}
                  —
                  {{ formatDate(week.endDate) }}
                </p>
              </div>

              <div class="text-right">
                <div class="text-sm opacity-80">
                  <p>{{ week.assignedUsername }}</p>
                  <p>{{ t('cleaningView.done', { completed: week.completedTasks, total: week.totalTasks }) }}</p>
                </div>
                
                <!-- Swap button for future weeks assigned to OTHER users -->
                <button
                  v-if="canRequestSwapWith(week)"
                  @click.stop="selectedSwapTargetWeek = week; showSwapModal = true"
                  class="mt-2 text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                >
                  {{ t('cleaningView.swap') }}
                </button>
                <div
                  v-else-if="hasPendingSwapForWeek(week.weekID)"
                  class="mt-2 text-xs px-2 py-1 rounded bg-gray-400 text-white opacity-60 cursor-not-allowed"
                >
                  {{ t('cleaningView.pending') }}
                </div>              </div>
            </div>
          </button>
        </div>

        <p v-else class="text-sm opacity-70">
          {{ t(weeks.length ? 'cleaningView.noneWeeks' : 'cleaningView.loadingWeeks') }}
        </p>
        <p v-if="scheduleError" class="mt-4 text-sm text-red-500">
          {{ scheduleError }}
        </p>

        <!-- Pending Incoming Swap Requests -->
        <div v-if="getPendingIncomingSwapRequests().length" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold mb-3">{{ t('cleaningView.incoming') }}</h3>
          <div class="space-y-3">
            <div
              v-for="request in getPendingIncomingSwapRequests()"
              :key="request.requestID"
              class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-background-light dark:bg-background-dark"
            >
              <p class="text-sm mb-2">{{ t('cleaningView.incomingText', { name: request.requesterUsername, source: getWeekLabel(weeks.find(w => w.weekID === request.sourceWeekID)?.startDate || ''), target: getWeekLabel(weeks.find(w => w.weekID === request.targetWeekID)?.startDate || '') }) }}</p>
              <div class="flex gap-2">
                <button
                  @click="respondToSwap(request, true)"
                  class="flex-1 px-3 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition"
                >
                  {{ t('cleaningView.accept') }}
                </button>
                <button
                  @click="respondToSwap(request, false)"
                  class="flex-1 px-3 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
                >
                  {{ t('cleaningView.reject') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Outgoing Swap Requests -->
        <div v-if="getPendingOutgoingSwapRequests().length" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold mb-3">{{ t('cleaningView.outgoing') }}</h3>
          <div class="space-y-3">
            <div
              v-for="request in getPendingOutgoingSwapRequests()"
              :key="request.requestID"
              class="rounded-lg border border-yellow-300 dark:border-yellow-700 p-4 bg-yellow-50 dark:bg-yellow-900/20"
            >
              <p class="text-sm mb-2">
                {{ t('cleaningView.waiting', { name: request.targetUsername }) }}
              </p>
              <p class="text-xs opacity-70 mb-2">
                {{ t('cleaningView.offered', { week: getWeekLabel(weeks.find(w => w.weekID === request.sourceWeekID)?.startDate || '') }) }}
                <br />
                {{ t('cleaningView.requesting', { week: getWeekLabel(weeks.find(w => w.weekID === request.targetWeekID)?.startDate || '') }) }}
              </p>
              <div class="flex items-center gap-2 text-xs">
                <span class="inline-block h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span class="opacity-70">{{ t('cleaningView.pendingResponse') }}</span>
              </div>
            </div>
          </div>
        </div>

        </div>

      </section>

      <!-- =====================================================
           TASKS
      ====================================================== -->
      <section class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-surface p-3 dark:border-gray-700 dark:bg-surface-dark sm:p-5">

        <div class="mb-3 flex shrink-0 items-start justify-between gap-3 sm:mb-4">
          <div>
            <h2 class="text-2xl font-bold">{{ t('cleaningView.tasks') }}</h2>
            <p class="text-sm opacity-70">
              {{ t('cleaningView.checklist') }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg border border-accent px-3 py-2 text-sm font-bold text-accent transition hover:bg-accent/10"
            @click="showCleaningRulesModal = true"
          >
            {{ t('cleaningView.rulesButton') }}
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
        <div v-if="selectedWeek">

          <!-- Week header -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-4 mb-4">
            <p class="font-semibold">
              {{ t('cleaningView.week', { week: getWeekLabel(selectedWeek.startDate) }) }}
            </p>
            <p class="text-sm opacity-70">
              {{ formatDate(selectedWeek.startDate) }}
              —
              {{ formatDate(selectedWeek.endDate) }}
            </p>
            <p class="text-sm opacity-70">
              {{ t('cleaningView.assigned', { name: selectedWeek.assignedUsername }) }}
            </p>
            <p class="text-sm opacity-70">
              {{ t('cleaningView.completed', { completed: selectedWeek.completedTasks, total: selectedWeek.totalTasks }) }}
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
                      {{ task.assignedUsername ? t('cleaningView.assignedTo', { name: task.assignedUsername }) : t('cleaningView.unassigned') }}
                    </span>
                  </span>
                </label>

              </div>

              <p v-if="task.description" class="text-xs opacity-70 mt-1">
                {{ task.description }}
              </p>

              <div class="flex gap-2 mt-1">
                <p v-if="task.isImportant" class="text-xs text-red-500">
                  {{ t('cleaningView.important') }}
                </p>
                <p v-if="isUserCreatedTask(task)" class="text-xs text-blue-500">
                  {{ t('cleaningView.custom') }}
                </p>
              </div>

            </li>

          </ol>

          <p v-if="!tasks.length" class="mt-4 text-sm opacity-70">
            {{ t('cleaningView.noneTasks') }}
          </p>

          <p v-if="selectedWeek && !isCurrentWeek(selectedWeek)" class="mt-4 text-sm opacity-70">
            {{ t('cleaningView.currentOnly') }}
          </p>

          <a href="#task-votes" class="mt-4 inline-flex rounded-lg border border-accent px-4 py-2 text-sm font-bold text-accent hover:bg-accent/10">{{ t('cleaningView.communityTasks') }} →</a>

        </div>

        <p v-else class="text-sm opacity-70">
          {{ t('cleaningView.selectWeek') }}
        </p>

        <p v-if="tasksError" class="mt-4 text-sm text-red-500">
          {{ tasksError }}
        </p>
        </div>

      </section>

    </div>

    <CleaningTaskGovernance />

    <!-- Cleaning rules apply to every resident, not only the assigned cleaner. -->
    <div
      v-if="showCleaningRulesModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="cleaningRulesTitleId"
      @click.self="showCleaningRulesModal = false"
    >
      <div class="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-surface p-5 shadow-xl dark:border-gray-700 dark:bg-surface-dark sm:p-6">
        <button
          type="button"
          class="absolute right-4 top-3 text-2xl leading-none opacity-60 transition hover:opacity-100"
          :aria-label="t('cleaningView.closeRules')"
          @click="showCleaningRulesModal = false"
        >
          &times;
        </button>
        <h3 :id="cleaningRulesTitleId" class="pr-8 text-xl font-bold">{{ t('cleaningView.rulesTitle') }}</h3>
        <p class="mt-2 text-sm opacity-70">{{ t('cleaningView.rulesIntro') }}</p>
        <ul class="mt-5 list-disc space-y-3 pl-5 text-sm">
          <li v-for="ruleNumber in 4" :key="ruleNumber">
            {{ t(`cleaningView.rules.${ruleNumber}`) }}
          </li>
        </ul>
        <button
          type="button"
          class="mt-6 w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
          @click="showCleaningRulesModal = false"
        >
          {{ t('cleaningView.closeRules') }}
        </button>
      </div>
    </div>

    <!-- =====================================================
         SWAP MODAL
    ====================================================== -->
    <div
      v-if="showSwapModal && selectedSwapTargetWeek"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-3"
      @click.self="showSwapModal = false"
    >
      <div class="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-surface p-5 dark:border-gray-700 dark:bg-surface-dark sm:p-6">
        <h3 class="text-xl font-bold mb-4">{{ t('cleaningView.swapTitle') }}</h3>

        <p class="text-sm mb-4">
          {{ t('cleaningView.swapIntro') }}
        </p>

        <div class="space-y-3 mb-4">
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-background-light dark:bg-background-dark">
            <p class="text-xs opacity-70">{{ t('cleaningView.yourWeek') }}</p>
            <p class="font-semibold">
              {{ t('cleaningView.week', { week: selectedWeek ? getWeekLabel(selectedWeek.startDate) : '' }) }}
            </p>
            <p class="text-xs opacity-70">
              {{ selectedWeek ? formatDate(selectedWeek.startDate) : '' }}
              —
              {{ selectedWeek ? formatDate(selectedWeek.endDate) : '' }}
            </p>
          </div>

          <div class="text-center">
            <p class="text-2xl">↔</p>
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-background-light dark:bg-background-dark">
            <p class="text-xs opacity-70">{{ t('cleaningView.theirWeek') }}</p>
            <p class="font-semibold">
              {{ t('cleaningView.week', { week: selectedSwapTargetWeek ? getWeekLabel(selectedSwapTargetWeek.startDate) : '' }) }}
            </p>
            <p class="text-xs opacity-70">
              {{ selectedSwapTargetWeek ? formatDate(selectedSwapTargetWeek.startDate) : '' }}
              —
              {{ selectedSwapTargetWeek ? formatDate(selectedSwapTargetWeek.endDate) : '' }}
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
            {{ t('cleaningView.cancel') }}
          </button>
          <button
            @click="requestSwap(selectedSwapTargetWeek)"
            class="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm hover:opacity-90 transition"
          >
            {{ t('cleaningView.requestSwap') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getSocket } from '@/composables/socket'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CleaningTaskGovernance from '@/components/CleaningTaskGovernance.vue'
import type { CleaningWeek, CleaningWeekSwapRequest, CleaningWeekTask } from '@/types/cleaning'

const socket = getSocket()
const route = useRoute()
const { t, locale } = useI18n()
const userID = Number(sessionStorage.getItem('userID') || 0)
const dormID = Number(sessionStorage.getItem('dormID') || 0)

const weeks = ref<CleaningWeek[]>([])
const selectedWeek = ref<CleaningWeek | null>(null)
const tasks = ref<CleaningWeekTask[]>([])
const swapRequests = ref<CleaningWeekSwapRequest[]>([])

const scheduleError = ref('')
const tasksError = ref('')
const showHistoricalWeeks = ref(false)
const showSwapModal = ref(false)
const showCleaningRulesModal = ref(false)
const cleaningRulesTitleId = 'cleaning-rules-title'
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
      message: t('cleaningView.swapAccepted', { name: data.requesterUsername }),
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
    const message = error?.message || t('cleaningView.genericError')
    scheduleError.value = message
    tasksError.value = message
  })
}

/* -------------------------
   FETCH DATA
--------------------------*/
const fetchWeeks = () => {
  if (!dormID) {
    scheduleError.value = t('cleaningView.missingDorm')
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
    tasksError.value = t('cleaningView.assignedOnly')
    return
  }
  if (!selectedWeek.value || !isCurrentWeek(selectedWeek.value)) {
    tasksError.value = t('cleaningView.weekOnly')
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
      tasksError.value = t('cleaningView.genericError')
    }
  })
}

const requestSwap = (targetWeek: CleaningWeek) => {
  if (!selectedWeek.value || !canRequestSwapWith(targetWeek)) return
  
  if (hasOutgoingPendingSwapForWeek(selectedWeek.value.weekID)) {
    swapError.value = t('cleaningView.alreadyPending')
    return
  }
  
  swapError.value = ''
  socket.emit('requestCleaningWeekSwap', {
    sourceWeekID: selectedWeek.value.weekID,
    targetWeekID: targetWeek.weekID
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      swapError.value = t('cleaningView.genericError')
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
      swapError.value = t('cleaningView.genericError')
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

const formatDate = (dateValue: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(dateValue))

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
