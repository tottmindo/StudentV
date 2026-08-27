<template>

  <!-- Notification -->
  <div
    v-if="notification"
    :class="[
      'fixed left-4 right-4 top-4 z-50 max-w-xl break-words rounded-lg px-4 py-3 text-white shadow-lg transition-all sm:right-auto',
      notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
    ]"
  >
    {{ notification.message }}
  </div>

  <main class="min-h-[calc(100dvh-4rem-env(safe-area-inset-top))] min-w-0 max-w-full space-y-6 overflow-x-clip bg-background p-3 text-text dark:bg-background-dark dark:text-text-dark sm:p-6 lg:min-h-[calc(100dvh-7.75rem-env(safe-area-inset-top))] xl:min-h-[calc(100dvh-4rem-env(safe-area-inset-top))]">
    <div class="cleaning-grid grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:gap-6 lg:h-[calc(100dvh-7.75rem-3rem-env(safe-area-inset-top))] lg:min-h-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-1 xl:h-[calc(100dvh-4rem-3rem-env(safe-area-inset-top))]">

      <!-- =====================================================
           WEEKS LIST
      ====================================================== -->
      <section class="cleaning-weeks flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-surface p-3 dark:border-gray-700 dark:bg-surface-dark sm:p-5">
        <div class="mb-3 shrink-0 sm:mb-4">
          <h2 class="break-words text-xl font-bold sm:text-2xl">{{ t('cleaningView.weeks') }}</h2>
          <p class="break-words text-sm opacity-70">{{ t('cleaningView.selectHelp') }}</p>
        </div>

        <div class="weeks-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
        <div class="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:border-accent hover:bg-accent/10 dark:border-gray-700"
            @click="showHistoricalWeeks = !showHistoricalWeeks"
          >
            {{ t(showHistoricalWeeks ? 'cleaningView.hideHistory' : 'cleaningView.showHistory') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-white transition hover:opacity-90"
            @click="toggleSwapMode"
          >
            {{ t(swapMode ? 'cleaningView.cancelSwap' : 'cleaningView.swapWeeks') }}
          </button>
        </div>

        <div v-if="swapMode" class="mb-4 rounded-lg border-2 border-accent/40 bg-accent/5 p-3">
          <p class="break-words text-sm font-bold">{{ t('cleaningView.swapSelectionTitle') }}</p>
          <p class="mt-1 break-words text-xs opacity-70">{{ t('cleaningView.swapSelectionHelp') }}</p>
          <div class="mt-3 space-y-1 text-sm">
            <p><span class="font-bold">1.</span> {{ swapSourceWeek ? t('cleaningView.week', { week: getWeekLabel(swapSourceWeek.startDate) }) : t('cleaningView.chooseYourWeek') }}</p>
            <p><span class="font-bold">2.</span> {{ swapTargetWeek ? `${t('cleaningView.week', { week: getWeekLabel(swapTargetWeek.startDate) })} — ${swapTargetWeek.assignedUsername}` : t('cleaningView.chooseTheirWeek') }}</p>
          </div>
          <p v-if="swapError" class="mt-2 text-sm text-red-500">{{ swapError }}</p>
          <button
            type="button"
            :disabled="!swapSourceWeek || !swapTargetWeek"
            class="mt-3 w-full rounded-lg bg-accent px-3 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            @click="sendSelectedSwapRequest"
          >
            {{ t('cleaningView.sendSwapRequest') }}
          </button>
        </div>

        <div v-if="visibleWeeks.length" class="week-list space-y-2 sm:space-y-3">
          <button
            v-for="week in visibleWeeks"
            :key="week.weekID"
            @click="handleWeekClick(week)"
            :aria-current="!swapMode && week.weekID === selectedWeek?.weekID ? 'true' : undefined"
            :class="[
              'week-card w-full text-left rounded-lg border p-4 transition hover:border-accent hover:bg-accent/10',
              isSwapWeekSelected(week)
                ? 'border-accent bg-accent/20 shadow-lg ring-2 ring-accent'
                : !swapMode && week.weekID === selectedWeek?.weekID
                ? 'border-accent bg-accent/15 shadow-lg ring-2 ring-accent ring-offset-2 ring-offset-surface dark:ring-offset-surface-dark'
                : isWeekAssignedToCurrentUser(week)
                  ? 'border-accent/60 bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700',
              isWeekAssignedToCurrentUser(week) ? 'border-l-4 border-l-accent' : '',
              swapMode && !isWeekEligibleForSwapSelection(week) ? 'cursor-not-allowed opacity-45' : ''
            ]"
          >
            <div class="week-card-row flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span
                v-if="swapMode"
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-sm font-black"
                :class="isSwapWeekSelected(week) ? 'border-accent bg-accent text-white' : 'border-gray-400'"
                aria-hidden="true"
              >
                {{ isSwapWeekSelected(week) ? '✓' : '' }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="break-words font-semibold">
                  {{ t('cleaningView.week', { week: getWeekLabel(week.startDate) }) }}
                  <span
                    v-if="!swapMode && week.weekID === selectedWeek?.weekID"
                    class="ml-2 inline-flex items-center rounded-md border border-accent bg-surface px-2 py-0.5 text-xs font-extrabold text-accent shadow-sm dark:bg-surface-dark"
                  >
                    ✓ {{ t('cleaningView.selected') }}
                  </span>
                </p>
                <p class="break-words text-sm opacity-70">
                  {{ formatDate(week.startDate) }}
                  —
                  {{ formatDate(week.endDate) }}
                </p>
              </div>

              <div class="min-w-0 break-words text-left sm:text-right">
                <div class="text-sm opacity-80">
                  <span
                    v-if="isWeekAssignedToCurrentUser(week)"
                    class="mb-1 inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white"
                  >
                    {{ t('cleaningView.assignedToYou') }}
                  </span>
                  <p class="break-all">{{ week.assignedUsername }}</p>
                  <p>{{ t('cleaningView.done', { completed: week.completedTasks, total: week.totalTasks }) }}</p>
                </div>
                
                <div
                  v-if="hasPendingSwapForWeek(week.weekID)"
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
        </div>

        <div
          v-if="getPendingIncomingSwapRequests().length || getPendingOutgoingSwapRequests().length"
          class="mt-4 max-h-[45%] shrink-0 space-y-4 overflow-y-auto overscroll-contain border-t border-gray-200 pt-4 pr-1 dark:border-gray-700 [scrollbar-gutter:stable]"
        >
          <!-- Pending Incoming Swap Requests -->
          <div v-if="getPendingIncomingSwapRequests().length">
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
          <div v-if="getPendingOutgoingSwapRequests().length">
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
      <section class="cleaning-tasks flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-surface p-3 dark:border-gray-700 dark:bg-surface-dark sm:p-5">

        <div class="mb-3 flex shrink-0 flex-col items-start gap-3 sm:mb-4 sm:flex-row sm:justify-between">
          <div class="min-w-0 break-words">
            <h2 class="break-words text-xl font-bold sm:text-2xl">{{ t('cleaningView.tasks') }}</h2>
            <p class="text-sm opacity-70">
              {{ t('cleaningView.checklist') }}
            </p>
          </div>
          <button
            type="button"
            class="max-w-full whitespace-normal break-words rounded-lg border border-accent px-3 py-2 text-sm font-bold text-accent transition hover:bg-accent/10 sm:shrink-0"
            @click="showCleaningRulesModal = true"
          >
            {{ t('cleaningView.rulesButton') }}
          </button>
        </div>

        <div class="tasks-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
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
          <ol class="task-list space-y-3">

            <li
              v-for="task in tasks"
              :key="task.weekTaskID"
              class="task-card min-w-0 break-words rounded-lg border border-gray-200 bg-surface p-4 dark:border-gray-700 dark:bg-surface-dark"
            >

              <div class="flex min-w-0 items-center justify-between gap-4">

                <label class="flex min-w-0 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    :checked="task.isCompleted"
                    :disabled="!canUpdateTask(task)"
                    @change="toggleTask(task)"
                    class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <span class="min-w-0 break-words">
                    <span :class="task.isCompleted ? 'line-through opacity-70' : ''">
                      {{ task.title }}
                    </span>
                    <span class="block text-xs opacity-60">
                      {{ task.assignedUsername ? t('cleaningView.assignedTo', { name: task.assignedUsername }) : t('cleaningView.unassigned') }}
                    </span>
                  </span>
                </label>

              </div>

              <p v-if="task.description" class="mt-1 break-words text-xs opacity-70">
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

        </div>

        <p v-else class="text-sm opacity-70">
          {{ t('cleaningView.selectWeek') }}
        </p>

        <p v-if="tasksError" class="mt-4 text-sm text-red-500">
          {{ tasksError }}
        </p>
        </div>

      </section>

      <!-- =====================================================
           TASK ROTATION
      ====================================================== -->
      <div class="cleaning-governance min-h-0 min-w-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-gutter:stable]">
        <CleaningTaskGovernance />
      </div>

    </div>

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
          class="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-2xl leading-none opacity-70 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent sm:right-3 sm:top-2"
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

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getSocket } from '@/shared/composables/socket'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CleaningTaskGovernance from '@/features/cleaning/components/CleaningTaskGovernance.vue'
import type { CleaningWeek, CleaningWeekSwapRequest, CleaningWeekTask } from '@/features/cleaning/types'

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
const showCleaningRulesModal = ref(false)
const cleaningRulesTitleId = 'cleaning-rules-title'
const swapMode = ref(false)
const swapSourceWeek = ref<CleaningWeek | null>(null)
const swapTargetWeek = ref<CleaningWeek | null>(null)
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
    resetSwapSelection()
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

const sendSelectedSwapRequest = () => {
  const sourceWeek = swapSourceWeek.value
  const targetWeek = swapTargetWeek.value
  if (!sourceWeek || !targetWeek || !canPairWeeksForSwap(sourceWeek, targetWeek)) return
  
  if (hasOutgoingPendingSwapForWeek(sourceWeek.weekID)) {
    swapError.value = t('cleaningView.alreadyPending')
    return
  }
  
  swapError.value = ''
  socket.emit('requestCleaningWeekSwap', {
    sourceWeekID: sourceWeek.weekID,
    targetWeekID: targetWeek.weekID
  }, (response: { success?: boolean; error?: string }) => {
    if (response?.error) {
      swapError.value = t('cleaningView.genericError')
    } else {
      resetSwapSelection()
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

const resetSwapSelection = () => {
  swapMode.value = false
  swapSourceWeek.value = null
  swapTargetWeek.value = null
  swapError.value = ''
}

const toggleSwapMode = () => {
  if (swapMode.value) resetSwapSelection()
  else swapMode.value = true
}

const handleWeekClick = (week: CleaningWeek) => {
  if (!swapMode.value) {
    selectWeek(week)
    return
  }
  if (!isWeekEligibleForSwapSelection(week)) return
  if (isWeekAssignedToCurrentUser(week)) swapSourceWeek.value = swapSourceWeek.value?.weekID === week.weekID ? null : week
  else swapTargetWeek.value = swapTargetWeek.value?.weekID === week.weekID ? null : week
  swapError.value = ''
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

const isWeekAssignedToCurrentUser = (week: CleaningWeek) => {
  return week.assignedUserID === userID
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

const isWeekEligibleForSwapSelection = (week: CleaningWeek) => {
  return new Date(week.startDate) > new Date() && !hasPendingSwapForWeek(week.weekID)
}

const isSwapWeekSelected = (week: CleaningWeek) => {
  return swapSourceWeek.value?.weekID === week.weekID || swapTargetWeek.value?.weekID === week.weekID
}

const canPairWeeksForSwap = (sourceWeek: CleaningWeek, targetWeek: CleaningWeek) => {
  return sourceWeek.assignedUserID === userID &&
    targetWeek.assignedUserID !== userID &&
    sourceWeek.weekID !== targetWeek.weekID &&
    isWeekEligibleForSwapSelection(sourceWeek) &&
    isWeekEligibleForSwapSelection(targetWeek)
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

<style scoped>
@media (max-width: 639px) {
  /* Keep the checklist immediately available while containing long lists. */
  .cleaning-tasks {
    order: 1;
    min-height: min(18rem, 60dvh);
    max-height: min(60dvh, 36rem);
  }

  .cleaning-weeks {
    order: 2;
    max-height: min(84dvh, 44rem);
    padding: 0.75rem;
  }

  .cleaning-governance {
    order: 3;
    max-height: min(55dvh, 32rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  .cleaning-weeks h2 {
    font-size: 1.125rem;
    line-height: 1.4;
  }

  .cleaning-weeks .weeks-scroll,
  .cleaning-tasks .tasks-scroll {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .cleaning-weeks .week-card {
    padding: 0.5rem 0.625rem;
  }

  .cleaning-weeks .week-card-row {
    gap: 0.25rem;
  }

  .cleaning-weeks .week-card p {
    line-height: 1.25;
  }

  .cleaning-tasks .task-card {
    padding: 0.75rem;
  }
}
</style>
