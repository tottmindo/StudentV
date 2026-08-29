<template>
  <div class="events-page min-h-screen min-w-0 max-w-full overflow-x-clip bg-background p-3 text-text dark:bg-background-dark dark:text-text-dark sm:p-6 lg:min-h-0 lg:overflow-hidden">
    <div class="events-workspace grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section class="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-surface p-3 dark:border-gray-700 dark:bg-surface-dark sm:p-5 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <div class="h-[22rem] min-h-0 w-full min-w-0 max-w-full flex-none sm:h-[28rem] lg:h-auto lg:flex-1">
                <CalendarComponent
                  :marked-dates="filteredEventDates"
                  :cleaning-dates="filteredCleaningWeeks"
                  :external-dates="filteredExternalDates"
                  :nation-dates="filteredNationDates"
                  @day-click="onCalendarDayClick"
                  @month-change="onCalendarMonthChange"
                  class="h-full w-full min-w-0"
                />
        </div>
        <div class="mt-4 flex flex-wrap items-stretch justify-end gap-2 sm:items-center">
          <button
            type="button"
            class="w-full max-w-full cursor-pointer whitespace-normal rounded-lg border px-3 py-2 text-sm font-semibold leading-snug [overflow-wrap:anywhere] transition-colors sm:w-auto"
            :class="showHistoricalEvents ? 'border-gray-700 bg-gray-700 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900' : 'border-gray-300 bg-surface text-text hover:bg-gray-100 dark:border-gray-600 dark:bg-surface-dark dark:text-text-dark dark:hover:bg-gray-800'"
            :aria-pressed="showHistoricalEvents"
            @click="showHistoricalEvents = !showHistoricalEvents"
          >
            {{ t(showHistoricalEvents ? 'eventsView.hideHistory' : 'eventsView.showHistory') }}
          </button>

          <button type="button" class="w-full max-w-full cursor-pointer whitespace-normal rounded-lg bg-accent px-3 py-2 text-sm font-semibold leading-snug text-white [overflow-wrap:anywhere] transition-opacity hover:opacity-90 sm:w-auto" @click="openCreateEvent()">
            {{ t('eventsView.add') }}
          </button>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-background/60 p-2 dark:border-gray-700 dark:bg-background-dark/60" role="group" :aria-label="t('eventsView.filter')">
          <span class="max-w-full px-1 text-xs font-bold uppercase tracking-wide opacity-60 [overflow-wrap:anywhere]">{{ t('eventsView.filter') }}</span>

          <button type="button" @click="filters.events = !filters.events" class="max-w-full cursor-pointer whitespace-normal rounded-md border px-3 py-1.5 text-xs font-semibold leading-snug [overflow-wrap:anywhere] transition-colors" :class="filters.events ? 'border-accent bg-accent text-white' : 'border-gray-300 bg-surface text-text opacity-60 dark:border-gray-600 dark:bg-surface-dark dark:text-text-dark'" :aria-pressed="filters.events">
            {{ t('eventsView.internal') }}
          </button>

          <button type="button" @click="filters.cleaning = !filters.cleaning" class="max-w-full cursor-pointer whitespace-normal rounded-md border px-3 py-1.5 text-xs font-semibold leading-snug [overflow-wrap:anywhere] transition-colors" :class="filters.cleaning ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300 bg-surface text-text opacity-60 dark:border-gray-600 dark:bg-surface-dark dark:text-text-dark'" :aria-pressed="filters.cleaning">
            {{ t('eventsView.cleaningWeeks') }}
          </button>

          <button type="button" @click="filters.external = !filters.external" class="max-w-full cursor-pointer whitespace-normal rounded-md border px-3 py-1.5 text-xs font-semibold leading-snug [overflow-wrap:anywhere] transition-colors" :class="filters.external ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-surface text-text opacity-60 dark:border-gray-600 dark:bg-surface-dark dark:text-text-dark'" :aria-pressed="filters.external">
            {{ t('eventsView.external') }}
          </button>

          <button type="button" @click="filters.nation = !filters.nation" class="max-w-full cursor-pointer whitespace-normal rounded-md border px-3 py-1.5 text-xs font-semibold leading-snug [overflow-wrap:anywhere] transition-colors" :class="filters.nation ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 bg-surface text-text opacity-60 dark:border-gray-600 dark:bg-surface-dark dark:text-text-dark'" :aria-pressed="filters.nation">
            {{ t('eventsView.nationEvent') }}
          </button>

        </div>
      </section>

      <section class="flex min-h-80 min-w-0 flex-col rounded-lg border border-gray-200 bg-surface p-3 dark:border-gray-700 dark:bg-surface-dark sm:p-5 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <div class="mb-4 flex shrink-0 flex-col items-stretch gap-3 xl:flex-row xl:items-start xl:justify-between">
          <h2 class="min-w-0 text-lg font-semibold leading-tight [overflow-wrap:anywhere] sm:text-xl">
            {{ showMultiDayEvents ? t('eventsView.multiDayEventsTitle', { month: selectedMonthLabel }) : t(showHistoricalEvents ? 'eventsView.all' : 'eventsView.upcoming') }}
          </h2>
          <button
            type="button"
            class="inline-flex min-h-10 w-full max-w-full cursor-pointer items-center justify-center whitespace-normal rounded-lg border border-accent px-3 py-2 text-center text-sm font-semibold leading-tight text-accent [overflow-wrap:anywhere] transition-colors hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-text disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text xl:w-52 xl:shrink-0 dark:disabled:border-gray-600 dark:disabled:text-text-dark dark:disabled:hover:text-text-dark"
            :disabled="!showMultiDayEvents && !monthlyMultiDayEvents.length"
            @click="showMultiDayEvents = !showMultiDayEvents"
          >
            {{ showMultiDayEvents ? t('eventsView.backToUpcoming') : t('eventsView.multiDayEvents', { count: monthlyMultiDayEvents.length }) }}
          </button>
        </div>
        <p v-if="showMultiDayEvents" class="mb-4 text-sm opacity-65">{{ t('eventsView.multiDayEventsHelp') }}</p>
        <p v-else-if="showHistoricalEvents" class="mb-4 text-sm opacity-65">{{ t('eventsView.historyHelp') }}</p>
        <ul v-if="displayedEvents.length" class="min-h-0 min-w-0 flex-1 list-none lg:overflow-y-auto lg:pr-2 lg:[scrollbar-gutter:stable]">
          <li
            v-for="event in displayedEvents"
            :key="event.id"
            @click="openEventDetail(event)"
            class="flex min-w-0 cursor-pointer flex-col gap-2 border-b border-gray-100 py-3 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <div class="flex min-w-0 flex-col items-start gap-2 xl:flex-row xl:items-center xl:justify-between">
              <!-- Event information -->
              <div class="min-w-0 max-w-full">
                <strong class="block font-semibold [overflow-wrap:anywhere]">
                  {{ event.title }}
                </strong>

                <p class="text-sm opacity-70 [overflow-wrap:anywhere]">
                  {{ event.description }}
                </p>
              </div>

              <!-- Date + type -->
              <div class="max-w-full text-left text-sm opacity-70 [overflow-wrap:anywhere] xl:shrink-0 xl:text-right">
                <div>
                  {{ showMultiDayEvents ? formatDateRange(event.startDate, event.endDate) : isMultiDayEvent(event) ? formatDate(event.startDate, false) : formatDateRange(event.startDate, event.endDate) }}
                </div>

                <div class="uppercase text-xs mt-1">

                  <!-- Destination Uppsala -->
                  <span
                    v-if="event.source === 'destination'"
                    class="text-blue-600 dark:text-blue-400 font-semibold"
                  >
                    {{ event.type }}
                  </span>

                  <!-- Nationsguiden -->
                  <span
                    v-else-if="event.source === 'nationsguiden'"
                    class="text-purple-600 dark:text-purple-400 font-semibold"
                  >
                    {{ event.type }}
                  </span>

                  <!-- Internal event -->
                  <span v-else>
                    {{ event.type }}

                    <span
                      v-if="!event.active"
                      class="text-red-500"
                    >
                      ({{ t('eventsView.inactive') }})
                    </span>
                  </span>

                </div>
              </div>
            </div>
          </li>
        </ul>

        <p v-else class="text-sm opacity-70">
          {{ showMultiDayEvents ? t('eventsView.noneMultiDay') : t(showHistoricalEvents ? 'eventsView.none' : 'eventsView.noneUpcoming') }}
        </p>
      </section>
    </div>

    <ModalComponent v-model="showEventDetailsModal">
      <div class="min-w-0 max-w-full space-y-4">
        <div class="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h3 class="min-w-0 pr-8 text-lg font-semibold leading-tight [overflow-wrap:anywhere] sm:pr-12 sm:text-xl">{{ eventModalTitle }}</h3>
          <button v-if="selectedEventDay" type="button" class="w-full max-w-full cursor-pointer whitespace-normal rounded-lg bg-accent px-3 py-2 text-sm font-semibold leading-snug text-white [overflow-wrap:anywhere] transition-opacity hover:opacity-90 sm:w-auto sm:shrink-0" @click="openCreateEvent(selectedEventDay)">
            {{ t('eventsView.addOnThisDay') }}
          </button>
        </div>
        <template v-if="selectedEvents.length || selectedCleaningWeeks.length || selectedExternalEvents.length || selectedNationEvents.length">
          <div
            v-for="event in selectedEvents"
            :key="event.id"
            class="min-w-0 max-w-full space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-gray-900 sm:p-4
                  dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <div class="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
              <div class="min-w-0 max-w-full">
                <p class="font-semibold [overflow-wrap:anywhere] sm:text-lg">{{ event.title }}</p>
                <p class="text-sm text-gray-600 [overflow-wrap:anywhere] dark:text-gray-400">
                  {{ event.type }}
                  <span v-if="!event.active" class="text-red-600 dark:text-red-400">
                    ({{ t('eventsView.inactive') }})
                  </span>
                </p>
              </div>
              <div class="max-w-full text-left text-sm opacity-70 [overflow-wrap:anywhere] sm:shrink-0 sm:text-right">
                <div>{{ formatDateRange(event.startDate, event.endDate) }}</div>
              </div>
            </div>
            <p class="text-sm opacity-80 [overflow-wrap:anywhere]">{{ event.description }}</p>
            <div v-if="event.invitationStatus" class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <p class="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">
                {{ t('eventsView.attendingCount', { count: event.attendeeCount || 0 }) }}
                <span class="ml-2 font-normal opacity-70">{{ t(`eventsView.rsvp.${event.invitationStatus}`) }}</span>
              </p>
              <div v-if="event.createdByUserID !== userID" class="flex max-w-full flex-wrap gap-2">
                <button
                  type="button"
                  class="min-w-0 flex-1 whitespace-normal rounded-lg px-3 py-2 text-sm font-bold leading-snug [overflow-wrap:anywhere] disabled:cursor-not-allowed sm:flex-none"
                  :class="event.invitationStatus === 'accepted' ? 'bg-gray-400 text-gray-700 dark:bg-gray-600 dark:text-gray-300' : 'bg-accent text-white disabled:opacity-50'"
                  :disabled="eventActionPending || event.invitationStatus === 'accepted'"
                  @click="respondToInvitation(event, true)"
                >{{ t('eventsView.accept') }}</button>
                <button type="button" class="min-w-0 flex-1 whitespace-normal rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold leading-snug [overflow-wrap:anywhere] disabled:opacity-50 sm:flex-none dark:border-gray-600" :disabled="eventActionPending" @click="respondToInvitation(event, false)">{{ t('eventsView.decline') }}</button>
              </div>
            </div>
            <button v-if="event.createdByUserID === userID && event.active" type="button" class="max-w-full whitespace-normal rounded-lg bg-red-600 px-3 py-2 text-sm font-bold leading-snug text-white [overflow-wrap:anywhere] disabled:opacity-50 sm:w-fit" :disabled="eventActionPending" @click="cancelEvent(event)">{{ t('eventsView.cancelEvent') }}</button>
            <p v-if="eventActionError" class="text-sm font-semibold text-red-600 [overflow-wrap:anywhere] dark:text-red-400">{{ eventActionError }}</p>
          </div>
          <div
              v-for="week in selectedCleaningWeeks"
              :key="week.weekID"
              class="min-w-0 max-w-full space-y-2 rounded-lg border border-emerald-300
                    bg-emerald-50 p-3 text-emerald-950 sm:p-4
                    dark:border-emerald-700
                    dark:bg-emerald-950/50
                    dark:text-emerald-100"
            >
            <div class="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
              <div class="min-w-0 max-w-full">
                <p class="font-semibold [overflow-wrap:anywhere] sm:text-lg">{{ t('calendar.cleaning') }}</p>
                <p class="text-sm text-emerald-800 [overflow-wrap:anywhere] dark:text-emerald-300">
                  {{ t('eventsView.assignedTo', { name: week.assignedUsername }) }}
                </p>
              </div>
              <div class="max-w-full text-left text-sm opacity-80 [overflow-wrap:anywhere] sm:shrink-0 sm:text-right">
                <div>{{ formatDateRange(week.startDate, week.endDate) }}</div>
              </div>
            </div>
            <p class="text-sm opacity-80 [overflow-wrap:anywhere]">
              {{ t('eventsView.tasksCompleted', { completed: week.completedTasks, total: week.totalTasks }) }}
            </p>
          </div>
          <div
            v-for="event in selectedExternalEvents"
            :key="event.eventID"
            class="min-w-0 max-w-full space-y-2 rounded-lg border border-blue-300
                  bg-blue-50 p-3 text-blue-950 sm:p-4
                  dark:border-blue-700
                  dark:bg-blue-950/50
                  dark:text-blue-100"
          >
            <div class="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
            <div class="min-w-0 max-w-full">
              <p class="font-semibold [overflow-wrap:anywhere] sm:text-lg">{{ event.title }}</p>
              <p class="text-sm font-medium uppercase text-blue-700 [overflow-wrap:anywhere] dark:text-blue-300">
                {{ t('eventsView.externalEvent') }}
              </p>
            </div>
            <div class="max-w-full text-left text-sm opacity-80 [overflow-wrap:anywhere] sm:shrink-0 sm:text-right">
              <div>{{ formatDateRange(event.startDate, event.endDate) }}</div>
            </div>
          </div>
          <a
            :href="event.externalurl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block max-w-full text-sm font-semibold text-blue-600 [overflow-wrap:anywhere] hover:underline
                  dark:text-blue-400"
          >
            {{ t('eventsView.viewPage') }} →
          </a>
        </div>
        <div
          v-for="event in selectedNationEvents"
          :key="event.eventID"
          class="min-w-0 max-w-full space-y-2 rounded-lg border border-purple-300
                bg-purple-50 p-3 text-purple-950 sm:p-4
                dark:border-purple-700
                dark:bg-purple-950/50
                dark:text-purple-100"
        >
          <div class="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-4">
            <div class="min-w-0 max-w-full">
              <p class="font-semibold [overflow-wrap:anywhere] sm:text-lg">
                {{ event.title }}
              </p>

              <p class="text-sm font-medium uppercase text-purple-700 [overflow-wrap:anywhere] dark:text-purple-300">
                {{ t('eventsView.nationEvent') }}
              </p>

              <p
                v-if="event.organiser"
                class="text-sm opacity-80 [overflow-wrap:anywhere]"
              >
                {{ event.organiser }}
              </p>

              <p
                v-if="event.category"
                class="text-sm opacity-80 [overflow-wrap:anywhere]"
              >
                {{ event.category }}
              </p>
            </div>

            <div class="max-w-full text-left text-sm opacity-80 [overflow-wrap:anywhere] sm:shrink-0 sm:text-right">
              <div>
                {{ formatDateRange(event.startDate, event.endDate) }}
              </div>
            </div>
          </div>

          <a
            :href="event.externalurl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block max-w-full text-sm font-semibold text-purple-600 [overflow-wrap:anywhere] hover:underline
                  dark:text-purple-400"
          >
            {{ t('eventsView.viewPage') }} →
          </a>
        </div>
        </template>
        <p v-else class="text-sm opacity-70">{{ t('eventsView.noneDay') }}</p>
      </div>
    </ModalComponent>

    <ModalComponent v-model="showCreateEventModal">
      <div class="min-w-0 max-w-full space-y-4">
      <h2 class="pr-8 text-lg font-semibold leading-tight [overflow-wrap:anywhere] sm:pr-12 sm:text-xl">{{ t('eventsView.create') }}</h2>
      <form @submit.prevent="addEvent" class="grid min-w-0 max-w-full gap-4">
        <label class="grid min-w-0 gap-1">
          <span class="font-semibold">{{ t('eventsView.title') }}</span>
          <input v-model="newEvent.title" type="text" :placeholder="t('eventsView.titlePlaceholder')" required class="min-w-0 max-w-full w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600" />
        </label>

        <div class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label class="grid min-w-0 gap-1">
            <span class="font-semibold">{{ t('eventsView.startDate') }}</span>
            <input
              v-model="newEvent.startDateLocal"
              type="date"
              required
              class="w-full min-w-0 max-w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600"
            />
          </label>

          <label class="grid min-w-0 gap-1">
            <span class="font-semibold">{{ t('eventsView.endDate') }}</span>
            <input
              v-model="newEvent.endDateLocal"
              type="date"
              class="w-full min-w-0 max-w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600"
            />
          </label>
        </div>

        <label class="flex items-center gap-2">
          <input
            v-model="newEvent.hasTime"
            type="checkbox"
            class="w-4 h-4"
          />
          <span class="text-sm font-semibold">{{ t('eventsView.specifyTime') }}</span>
        </label>

        <div v-if="newEvent.hasTime" class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label class="grid min-w-0 gap-1">
            <span class="font-semibold">{{ t('eventsView.startTime') }}</span>
            <input
              v-model="newEvent.startTime"
              type="time"
              class="w-full min-w-0 max-w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600"
            />
          </label>

          <label class="grid min-w-0 gap-1">
            <span class="font-semibold">{{ t('eventsView.endTime') }}</span>
            <input
              v-model="newEvent.endTime"
              type="time"
              class="w-full min-w-0 max-w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600"
            />
          </label>
        </div>

        <label class="grid min-w-0 gap-1">
          <span class="font-semibold">{{ t('eventsView.description') }}</span>
          <textarea v-model="newEvent.description" :placeholder="t('eventsView.description')" class="w-full min-w-0 max-w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600"></textarea>
        </label>

        <div class="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <label class="flex min-w-0 flex-wrap items-center gap-2">
            <input type="checkbox" v-model="newEvent.active" class="w-4 h-4" />
            <span class="text-sm">{{ t('common.active') }}</span>
          </label>

          <label class="flex items-center gap-2">
            <span class="text-sm font-semibold">{{ t('eventsView.type') }}</span>
            <select v-model="newEvent.type" class="min-w-0 max-w-full flex-1 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 sm:flex-none">
              <option value="SOCIAL">{{ t('eventsView.social') }}</option>
              <option value="MEETING">{{ t('eventsView.meeting') }}</option>
              <option value="OTHER">{{ t('eventsView.other') }}</option>
            </select>
          </label>
        </div>

        <label class="flex items-start gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <input type="checkbox" v-model="newEvent.inviteFloor" class="mt-0.5 h-4 w-4 shrink-0" />
          <span class="min-w-0 [overflow-wrap:anywhere]"><span class="block text-sm font-semibold">{{ t('eventsView.inviteFloor') }}</span><span class="block text-xs opacity-70">{{ t('eventsView.inviteFloorHelp') }}</span></span>
        </label>

        <button type="submit" class="w-full max-w-full cursor-pointer whitespace-normal rounded bg-accent px-4 py-2 leading-snug text-background-light [overflow-wrap:anywhere] hover:opacity-90 sm:w-fit">{{ t('eventsView.add') }}</button>
      </form>
      </div>
    </ModalComponent>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CalendarComponent from '@/features/events/components/CalendarComponent.vue'
import ModalComponent from '@/shared/components/ModalComponent.vue'
import { getSocket } from '@/shared/composables/socket'
import { dateIsInRange, eventHasNotEnded, getDateKeysInRange, startOfLocalDay, toDateKey } from '@/features/events/calendarDates'
import { useRoute } from 'vue-router'
import type { CalendarEvent } from '@/types'
import type { CleaningWeek } from '@/features/cleaning/types'
import type { DisplayEvent, ExternalEvent, NationEvent } from '@/features/events/types'
import { useI18n } from 'vue-i18n'

const socket = getSocket()
const route = useRoute()
const { t, locale } = useI18n()
const userID = Number(sessionStorage.getItem('userID') || 0)
const eventActionPending = ref(false)
const eventActionError = ref('')
const openedRequestedEventID = ref<number | null>(null)

const filters = ref({
  events : true,
  cleaning : true,
  external : true,
  nation: true
})
const showHistoricalEvents = ref(false)
const showMultiDayEvents = ref(false)
const today = new Date()
const selectedCalendarMonth = ref({ year: today.getFullYear(), month: today.getMonth() + 1 })

const externalEvents = ref<ExternalEvent[]>([]);
const nationEvents = ref<NationEvent[]>([])
const selectedNationEvents = ref<NationEvent[]>([])

const defaultEvents: CalendarEvent[] = [
  {
    id: 1,
    title: t('eventSamples.movie'),
    description: t('eventSamples.movieHelp'),
    startDate: '2026-07-05 19:00:00',
    endDate: '2026-07-05 22:00:00',
    active: true,
    type: 'SOCIAL'
  },
  {
    id: 2,
    title: t('eventSamples.yoga'),
    description: t('eventSamples.yogaHelp'),
    startDate: '2026-07-10 08:00:00',
    endDate: '2026-07-10 09:00:00',
    active: true,
    type: 'OTHER'
  }
]

const upcomingEvents = ref<CalendarEvent[]>(
  (() => {
    try {
      const raw = sessionStorage.getItem('events')
      if (raw) {
        const parsed = JSON.parse(raw) as CalendarEvent[]
        if (Array.isArray(parsed)) return parsed
        console.log(parsed)
      }
    } catch (e) {
      console.warn('Failed to parse cached events:', e)
    }
    return defaultEvents
  })()
)
const cleaningWeeks = ref<CleaningWeek[]>([])

const selectedExternalEvents = ref<ExternalEvent[]>([]);

const externalEventDates = computed(() => {
  const dates = new Set<string>()

  externalEvents.value
    .filter((event) => !isMultiDayEvent(event) && (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate)))
    .forEach((event) => {
      if (!event.startDate) return

      getDateKeysInRange(
        event.startDate,
        event.endDate || event.startDate
      ).forEach((dateKey) => {
        dates.add(dateKey)
      })
    })

  return Array.from(dates)
})

const nationEventDates = computed(() => {
  const dates = new Set<string>()

  nationEvents.value
    .filter((event) => !isMultiDayEvent(event) && (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate)))
    .forEach((event) => {
      if (!event.startDate) return

      getDateKeysInRange(
        event.startDate,
        event.endDate || event.startDate
      ).forEach((dateKey) => {
        dates.add(dateKey)
      })
    })

  return Array.from(dates)
})

const parseEventDate = (dateString?: string) => {
  if (!dateString) return undefined

  const normalized = dateString.replace(' ', 'T')

  return new Date(normalized)
}

const isMultiDayEvent = (event: { startDate: string; endDate?: string }) => {
  if (!event.endDate) return false
  return event.startDate.slice(0, 10) !== event.endDate.slice(0, 10)
}

const allEvents = computed(() => {
  return upcomingEvents.value.filter((event) => showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate)).sort((a, b) => {
    const aStart = parseEventDate(a.startDate)
    const bStart = parseEventDate(b.startDate)
    if (!aStart || !bStart) return 0
    return aStart.getTime() - bStart.getTime()
  })
})

const allEventDates = computed(() => {
  const dates = new Set<string>()

  allEvents.value.filter((event) => !isMultiDayEvent(event)).forEach((event) => {
    if (!event.startDate) return

    const start = event.startDate
    const end = event.endDate || event.startDate

    getDateKeysInRange(start, end).forEach((dateKey) => {
      dates.add(dateKey)
    })
  })

  return Array.from(dates)
})

const ownCleaningWeeks = computed(() => {
  return cleaningWeeks.value.filter((week) => week.assignedUserID === userID)
})

const currentOwnCleaningWeeks = computed(() => {
  const today = startOfLocalDay(toDateKey(new Date())).getTime()
  return ownCleaningWeeks.value.filter((week) => {
    return startOfLocalDay(week.endDate).getTime() >= today
  })
})

const cleaningCalendarDates = computed(() => {
  const dates = new Set<string>()
  currentOwnCleaningWeeks.value.forEach((week) => {
    getDateKeysInRange(week.startDate, week.endDate).forEach((dateKey) => dates.add(dateKey))
  })
  return Array.from(dates)
})

const filteredEvents = computed<DisplayEvent[]>(() => {
  const list: DisplayEvent[] = []
  const now = Date.now()
  const seenEventKeys = new Set<string>()

  // 1. Process Internal Events (if filter is active)
  if (filters.value.events) {
    upcomingEvents.value.forEach((event, index) => {
      if (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate)) {
        const uniqueKey = `${event.title}-${event.startDate}`
        if (!seenEventKeys.has(uniqueKey)) {
          seenEventKeys.add(uniqueKey)
          list.push({
            id: `internal-${getEventIdentifier(event) || index}`,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            type: event.type,
            active: event.active,
            source: 'internal'
          })
        }
      }
    })
  }

  // 2. Process External Events (if filter is active)
  if (filters.value.external) {
    externalEvents.value.forEach((event, index) => {
      if (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate, new Date(now))) {
        const uniqueKey = `${event.title}-${event.startDate}`
        if (!seenEventKeys.has(uniqueKey)) {
          seenEventKeys.add(uniqueKey)
          list.push({
            id: `external-${event.eventID !== undefined ? event.eventID : index}`,
            title: event.title,
            description: t('eventsView.externalEvent'),
            startDate: event.startDate,
            endDate: event.endDate,
            type: 'EXTERNAL',
            active: true,
            externalUrl: event.externalurl,
            source: 'destination'
          })
        }
      }
    })
  }

  // 3. Process Nationsguiden Events
  if (filters.value.nation) {
    nationEvents.value.forEach((event, index) => {
      if (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate, new Date(now))) {
        const uniqueKey = `nation-${event.title}-${event.startDate}`

        if (!seenEventKeys.has(uniqueKey)) {
          seenEventKeys.add(uniqueKey)

          list.push({
            id: `nation-${event.eventID !== undefined ? event.eventID : index}`,
            title: event.title,
            description: event.organiser
              ? `${event.category || ''} · ${event.organiser}`
              : event.category || t('eventsView.nationEvent'),
            startDate: event.startDate,
            endDate: event.endDate,
            type: 'NATION',
            active: true,
            externalUrl: event.externalurl,
            source: 'nationsguiden'
          })
        }
      }
    })
  }

  // Cleaning weeks intentionally stay out of this list; they are shown only
  // in the calendar. Sort all internal, external, and nation events by date.
  return list
    .sort((a, b) => {
      const aStart = parseEventDate(a.startDate)?.getTime() || 0
      const bStart = parseEventDate(b.startDate)?.getTime() || 0
      return aStart - bStart
    })
})

const monthlyMultiDayEvents = computed(() => {
  const { year, month } = selectedCalendarMonth.value
  const monthStart = new Date(year, month - 1, 1).getTime()
  const monthEnd = new Date(year, month, 1).getTime()

  return filteredEvents.value.filter((event) => {
    if (!isMultiDayEvent(event)) return false
    const start = startOfLocalDay(event.startDate).getTime()
    const end = startOfLocalDay(event.endDate || event.startDate).getTime()
    return start < monthEnd && end >= monthStart
  })
})

const displayedEvents = computed(() => showMultiDayEvents.value ? monthlyMultiDayEvents.value : filteredEvents.value)

const selectedMonthLabel = computed(() => new Intl.DateTimeFormat(locale.value, {
  month: 'long',
  year: 'numeric'
}).format(new Date(selectedCalendarMonth.value.year, selectedCalendarMonth.value.month - 1, 1)))

const onCalendarMonthChange = (value: { year: number; month: number }) => {
  selectedCalendarMonth.value = value
}

const showEventDetailsModal = ref(false)
const showCreateEventModal = ref(false)
const selectedEvents = ref<CalendarEvent[]>([])
const selectedCleaningWeeks = ref<CleaningWeek[]>([])
const selectedEventDay = ref('')

const eventModalTitle = computed(() => {
  if (selectedEventDay.value) {
    return t('eventsView.onDate', { date: new Date(`${selectedEventDay.value}T12:00:00`).toLocaleDateString(locale.value) })
  }
  if (selectedEvents.value.length === 1) {
    return selectedEvents.value[0].title
  }
  return t('eventsView.details')
})

const openEventDetails = (events: CalendarEvent[], dayKey = '', forceEvents = false) => {
    eventActionError.value = ''
    selectedEvents.value = (forceEvents || filters.value.events) ? events : []

    selectedCleaningWeeks.value = (dayKey && filters.value.cleaning)
      ? currentOwnCleaningWeeks.value.filter((week) =>
          dateIsInRange(dayKey, week.startDate, week.endDate)
        )
      : []

    selectedExternalEvents.value = (dayKey && filters.value.external)
      ? externalEvents.value.filter((event) =>
          !isMultiDayEvent(event) && (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate)) && dateIsInRange(
            dayKey,
            event.startDate,
            event.endDate || event.startDate
          )
        )
      : []

    selectedNationEvents.value = (dayKey && filters.value.nation)
      ? nationEvents.value.filter((event) =>
          !isMultiDayEvent(event) && (showHistoricalEvents.value || eventHasNotEnded(event.startDate, event.endDate)) && dateIsInRange(
            dayKey,
            event.startDate,
            event.endDate || event.startDate
          )
        )
      : []

    selectedEventDay.value = dayKey
    showEventDetailsModal.value = true
  }

const onCalendarDayClick = (dateKey: string) => {
  const matchingEvents = allEvents.value.filter((event) => {
    if (!event.startDate || isMultiDayEvent(event)) return false

    return dateIsInRange(
      dateKey,
      event.startDate,
      event.endDate || event.startDate
    )
  })

  openEventDetails(matchingEvents, dateKey)
}

const openEventDetail = (event: CalendarEvent | DisplayEvent) => {
  if ('source' in event) {
    if (
      event.source === 'destination' ||
      event.source === 'nationsguiden'
    ) {
      if (event.externalUrl) {
        window.open(event.externalUrl, '_blank', 'noopener,noreferrer')
      }

      return
    }

    const found = upcomingEvents.value.find(
      (e) => `internal-${getEventIdentifier(e)}` === event.id
    )

    if (!found) return

    selectedCleaningWeeks.value = []
    openEventDetails([found], '', true)
    return
  }

  selectedCleaningWeeks.value = []
  openEventDetails([event], '', true)
}

const getEventIdentifier = (event: CalendarEvent) => {
  return Number(event.id ?? (event as any).eventID)
}

const openRequestedEvent = () => {
  const requestedEventID = Number(route.query.eventID)
  if (!requestedEventID || openedRequestedEventID.value === requestedEventID) return

  const requestedEvent = upcomingEvents.value.find((event) => getEventIdentifier(event) === requestedEventID)
  if (requestedEvent) {
    openedRequestedEventID.value = requestedEventID
    openEventDetail(requestedEvent)
  }
}

watch(() => route.query.eventID, () => {
  openedRequestedEventID.value = null
  openRequestedEvent()
})

const bindSocket = () => {
  socket.off('eventsData')
  socket.off('cleaningWeeks')
  socket.off('cleaningTemplatesUpdated', fetchCalendarData)
  socket.off('externalEvents')
  socket.off('nationsguidenEvents')
  socket.off('eventInvitationsUpdated', fetchCalendarData)
  socket.off('eventCancelled', fetchCalendarData)
  socket.off('eventCreated', fetchCalendarData)

  socket.on('eventsData', (events: CalendarEvent[]) => {
    console.log('EVENTS FROM SERVER:', events)
    upcomingEvents.value = events
    if (showEventDetailsModal.value && selectedEvents.value.length) {
      selectedEvents.value = selectedEvents.value
        .map(selected => events.find(event => getEventIdentifier(event) === getEventIdentifier(selected)))
        .filter((event): event is CalendarEvent => Boolean(event))
    }
    sessionStorage.setItem('events', JSON.stringify(events))
    openRequestedEvent()
  })

  socket.on('cleaningWeeks', (weeks: CleaningWeek[]) => {
    cleaningWeeks.value = weeks
  })
  socket.on('cleaningTemplatesUpdated', fetchCalendarData)

  socket.on('externalEvents', (eEvents: ExternalEvent[]) => {
    externalEvents.value = eEvents
  })
  socket.on('nationsguidenEvents', (events: NationEvent[]) => {
    nationEvents.value = events
  })
  socket.on('eventInvitationsUpdated', fetchCalendarData)
  socket.on('eventCancelled', fetchCalendarData)
  socket.on('eventCreated', fetchCalendarData)
}

const fetchCalendarData = () => {
  socket.emit('getEvents', { active: true, dormID: sessionStorage.getItem('dormID') })
  socket.emit('getCleaningWeeks')
  socket.emit('getExternalEvents')
  socket.emit('getNationsguidenEvents')
}

const newEvent = ref<Partial<CalendarEvent> & {
  startDateLocal?: string
  endDateLocal?: string
  startTime?: string
  endTime?: string
  hasTime?: boolean
  inviteFloor?: boolean
}>({
  title: '',
  description: '',
  active: true,
  type: 'SOCIAL',
  startDateLocal: '',
  endDateLocal: '',
  startTime: '',
  endTime: '',
  hasTime: false,
  inviteFloor: false
})

const openCreateEvent = (date = '') => {
  newEvent.value = {
    title: '',
    description: '',
    active: true,
    type: 'SOCIAL',
    startDateLocal: date,
    endDateLocal: '',
    startTime: '',
    endTime: '',
    hasTime: false,
    inviteFloor: false
  }
  showEventDetailsModal.value = false
  showCreateEventModal.value = true
}

const toDbDatetime = (date: string, time?: string) => {
  if (!date) return ''

  if (!time) {
    return `${date} 00:00:00`
  }

  return `${date} ${time}:00`
}

const addEvent = () => {
  if (!newEvent.value.title || !newEvent.value.startDateLocal) return

  const start = toDbDatetime(
  newEvent.value.startDateLocal as string,
  newEvent.value.hasTime ? newEvent.value.startTime : undefined
)

const end = newEvent.value.endDateLocal
  ? toDbDatetime(
      newEvent.value.endDateLocal,
      newEvent.value.hasTime ? newEvent.value.endTime : undefined
    )
  : undefined

  // temporary negative id for optimistic UI
  const tempId = -Date.now()
  const item: CalendarEvent & { inviteFloor?: boolean } = {
    id: tempId,
    title: String(newEvent.value.title),
    description: String(newEvent.value.description || ''),
    startDate: start,
    endDate: end,
    active: Boolean(newEvent.value.active),
    type: String(newEvent.value.type || 'OTHER'),
    inviteFloor: Boolean(newEvent.value.inviteFloor),
    createdByUserID: userID,
    invitationStatus: newEvent.value.inviteFloor ? 'accepted' : null,
    attendeeCount: newEvent.value.inviteFloor ? 1 : 0
  }

  // optimistic update
  upcomingEvents.value.unshift(item)
  sessionStorage.setItem('events', JSON.stringify(upcomingEvents.value))

  // Emit to backend with acknowledgement callback
  try {
    socket.emit('createEvent', item, (response: any) => {
      if (response && (response.id || response.insertId)) {
        // server returned saved event
        const saved = response.event || response || { id: response.id || response.insertId }
        // replace temporary item with saved event (match by tempId)
        const idx = upcomingEvents.value.findIndex((e) => e.id === tempId)
        if (idx !== -1) {
          upcomingEvents.value[idx] = {
            id: saved.id || saved.insertId || Date.now(),
            title: saved.title || item.title,
            description: saved.description || item.description,
            startDate: saved.startDate || item.startDate,
            endDate: saved.endDate || item.endDate,
            active: typeof saved.active === 'boolean' ? saved.active : item.active,
            type: saved.type || item.type,
            createdByUserID: saved.createdByUserID ?? item.createdByUserID,
            invitationStatus: saved.invitationStatus ?? item.invitationStatus,
            attendeeCount: saved.attendeeCount ?? item.attendeeCount
          }
          sessionStorage.setItem('events', JSON.stringify(upcomingEvents.value))
        }
      } else {
        console.warn('createEvent ack did not include id, server response:', response)
      }
    })
  } catch (err) {
    console.error('Failed to emit createEvent:', err)
  }

  // reset form
  newEvent.value.title = ''
  newEvent.value.description = ''
  newEvent.value.startDateLocal = ''
  newEvent.value.endDateLocal = ''
  newEvent.value.startTime = ''
  newEvent.value.endTime = ''
  newEvent.value.hasTime = false
  newEvent.value.active = true
  newEvent.value.type = 'SOCIAL'
  newEvent.value.inviteFloor = false
  showCreateEventModal.value = false
}

const respondToInvitation = (event: CalendarEvent, accepted: boolean) => {
  if (eventActionPending.value || (accepted && event.invitationStatus === 'accepted')) return
  eventActionPending.value = true
  eventActionError.value = ''
  socket.emit('respondToEventInvitation', { eventID: getEventIdentifier(event), accepted }, (response: any) => {
    if (response?.error) {
      eventActionPending.value = false
      eventActionError.value = response.error
      return
    }

    const previousStatus = event.invitationStatus
    event.invitationStatus = accepted ? 'accepted' : 'declined'
    if (previousStatus !== event.invitationStatus) {
      event.attendeeCount = Math.max(0, Number(event.attendeeCount || 0) + (accepted ? 1 : previousStatus === 'accepted' ? -1 : 0))
    }
    eventActionPending.value = false
    fetchCalendarData()
    socket.emit('getDashboard')
  })
}

const cancelEvent = (event: CalendarEvent) => {
  if (!window.confirm(t('eventsView.cancelConfirm'))) return
  eventActionPending.value = true
  eventActionError.value = ''
  socket.emit('cancelEvent', { eventID: getEventIdentifier(event) }, (response: any) => {
    eventActionPending.value = false
    if (response?.error) { eventActionError.value = response.error; return }
    showEventDetailsModal.value = false
    fetchCalendarData()
  })
}

const formatDate = (dateString?: string, showTime = true) => {
  if (!dateString) return ''

  const normalized = dateString
    .replace(' ', 'T')
    .replace('Z', '')

  const dateObj = new Date(normalized)

  if (isNaN(dateObj.getTime())) return dateString

  if (!showTime) {
    return dateObj.toLocaleDateString(locale.value, {
      month: 'long',
      day: 'numeric'
    })
  }

  return dateObj.toLocaleString(locale.value, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatDateRange = (start?: string, end?: string) => {
  if (!start) return ''

  const normalizedStart = start
    .replace(' ', 'T')
    .replace('Z', '')

  const startDate = new Date(normalizedStart)

  if (isNaN(startDate.getTime())) {
    return start
  }

  // No end date
  if (!end) {
    const startIsMidnight =
      startDate.getHours() === 0 &&
      startDate.getMinutes() === 0 &&
      startDate.getSeconds() === 0

    return formatDate(start, !startIsMidnight)
  }

  const normalizedEnd = end
    .replace(' ', 'T')
    .replace('Z', '')

  const endDate = new Date(normalizedEnd)

  if (isNaN(endDate.getTime())) {
    return `${formatDate(start)} — ${formatDate(end)}`
  }

  // Same exact datetime
  if (startDate.getTime() === endDate.getTime()) {
    return formatDate(start, false)
  }

  const sameDate =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  // Same date, different times
  if (sameDate) {
    const dateLabel = startDate.toLocaleDateString(locale.value, {
      month: 'long',
      day: 'numeric'
    })
    const startTime = startDate.toLocaleTimeString(locale.value, {
      hour: 'numeric',
      minute: '2-digit'
    })
    const endTime = endDate.toLocaleTimeString(locale.value, {
      hour: 'numeric',
      minute: '2-digit'
    })
    return `${dateLabel}, ${startTime} — ${endTime}`
  }

  // Different dates
  return `${formatDate(start, true)} — ${formatDate(end, true)}`
}
onMounted(() => {
  bindSocket()
  fetchCalendarData()
  openRequestedEvent()
})

onUnmounted(() => {
  socket.off('eventsData')
  socket.off('cleaningWeeks')
  socket.off('cleaningTemplatesUpdated', fetchCalendarData)
  socket.off('externalEvents')
  socket.off('nationsguidenEvents')
  socket.off('eventInvitationsUpdated', fetchCalendarData)
  socket.off('eventCancelled', fetchCalendarData)
  socket.off('eventCreated', fetchCalendarData)
})


const filteredEventDates = computed(() => {
  if (!filters.value.events) return []
  return allEventDates.value
});

const filteredCleaningWeeks = computed(() => {
  if (!filters.value.cleaning) return []
  return cleaningCalendarDates.value
});

const filteredExternalDates = computed (() => {
  if (!filters.value.external) return []
  return externalEventDates.value
})

const filteredNationDates = computed(() => {
  if (!filters.value.nation) return []
  return nationEventDates.value
})



</script>

<style scoped>
@media (min-width: 1024px) {
  .events-page {
    height: calc(100dvh - 7.75rem - env(safe-area-inset-top));
  }

  .events-workspace {
    height: 100%;
  }
}

@media (min-width: 1280px) {
  .events-page {
    height: calc(100dvh - 4rem - env(safe-area-inset-top));
  }
}
</style>
