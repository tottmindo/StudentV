<template>
  <div class="min-h-screen p-6 bg-background dark:bg-background-dark">
    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-2xl font-bold">{{ t('eventsView.calendar') }}</h2>
          <button type="button" class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent dark:border-gray-600" :aria-pressed="showHistoricalEvents" @click="showHistoricalEvents = !showHistoricalEvents">
            {{ t(showHistoricalEvents ? 'eventsView.hideHistory' : 'eventsView.showHistory') }}
          </button>
        </div>
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <span class="text-sm font-semibold opacity-80">{{ t('eventsView.filter') }}</span>

          <button
            type="button"
            @click="filters.events = !filters.events"
            class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
            :class="filters.events ? 'bg-accent text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 opacity-50'"
          >
            {{ t('eventsView.internal') }}
          </button>

          <button
            type="button"
            @click="filters.cleaning = !filters.cleaning"
            class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
            :class="filters.cleaning ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 opacity-50'"
          >
            {{ t('eventsView.cleaningWeeks') }}
          </button>

          <button
            type="button"
            @click="filters.external = !filters.external"
            class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
            :class="filters.external ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 opacity-50'"
          >
            {{ t('eventsView.external') }}
          </button>
        </div>
        <div class="w-full max-w-full">
                <CalendarComponent
                  :marked-dates="filteredEventDates"
                  :cleaning-dates="filteredCleaningWeeks"
                  :external-dates="filteredExternalDates"
                  @day-click="onCalendarDayClick"
                  class="w-full h-full"
                />
        </div>
      </section>

      <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold" :class="showHistoricalEvents ? 'mb-1' : 'mb-4'">{{ t(showHistoricalEvents ? 'eventsView.all' : 'eventsView.upcoming') }}</h2>
        <p v-if="showHistoricalEvents" class="mb-4 text-sm opacity-65">{{ t('eventsView.historyHelp') }}</p>
        <ul v-if="filteredEvents.length" class="list-none">
          <li
            v-for="event in filteredEvents"
            :key="event.id"
            @click="openEventDetail(event)"
            class="cursor-pointer flex flex-col gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div class="flex items-center justify-between">
              <div>
                <strong class="font-semibold">{{ event.title }}</strong>
                <p class="text-sm opacity-70">{{ event.description }}</p>
              </div>
              <div class="text-sm opacity-70 text-right">
                <div>{{ formatDateRange(event.startDate, event.endDate) }}</div>
                <div class="uppercase text-xs mt-1">
                  <!-- Highlight external events in blue -->
                  <span :class="event.isExternal ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''">
                    {{ event.type }}
                  </span>
                  <span v-if="!event.isExternal && !event.active" class="text-red-500"> ({{ t('eventsView.inactive') }})</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm opacity-70">{{ t(showHistoricalEvents ? 'eventsView.none' : 'eventsView.noneUpcoming') }}</p>
      </section>
    </div>

    <ModalComponent v-model="showEventDetailsModal">
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">{{ eventModalTitle }}</h3>
        <template v-if="selectedEvents.length || selectedCleaningWeeks.length || selectedExternalEvents.length">
          <div
            v-for="event in selectedEvents"
            :key="event.id"
            class="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-gray-900
                  dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-lg font-semibold">{{ event.title }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ event.type }}
                  <span v-if="!event.active" class="text-red-600 dark:text-red-400">
                    ({{ t('eventsView.inactive') }})
                  </span>
                </p>
              </div>
              <div class="text-sm opacity-70 text-right">
                <div>{{ formatDateRange(event.startDate, event.endDate) }}</div>
              </div>
            </div>
            <p class="text-sm opacity-80">{{ event.description }}</p>
          </div>
          <div
              v-for="week in selectedCleaningWeeks"
              :key="week.weekID"
              class="space-y-2 rounded-lg border border-emerald-300
                    bg-emerald-50 p-4 text-emerald-950
                    dark:border-emerald-700
                    dark:bg-emerald-950/50
                    dark:text-emerald-100"
            >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-lg font-semibold">{{ t('calendar.cleaning') }}</p>
                <p class="text-sm text-emerald-800 dark:text-emerald-300">
                  {{ t('eventsView.assignedTo', { name: week.assignedUsername }) }}
                </p>
              </div>
              <div class="text-sm opacity-80 text-right">
                <div>{{ formatDateRange(week.startDate, week.endDate) }}</div>
              </div>
            </div>
            <p class="text-sm opacity-80">
              {{ t('eventsView.tasksCompleted', { completed: week.completedTasks, total: week.totalTasks }) }}
            </p>
          </div>
          <div
            v-for="event in selectedExternalEvents"
            :key="event.eventID"
            class="space-y-2 rounded-lg border border-blue-300
                  bg-blue-50 p-4 text-blue-950
                  dark:border-blue-700
                  dark:bg-blue-950/50
                  dark:text-blue-100"
          >
            <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-lg font-semibold">{{ event.title }}</p>
              <p class="text-sm font-medium uppercase text-blue-700 dark:text-blue-300">
                {{ t('eventsView.externalEvent') }}
              </p>
            </div>
            <div class="text-sm opacity-80 text-right">
              <div>{{ formatDateRange(event.startDate, event.endDate) }}</div>
            </div>
          </div>
          <a
            :href="event.externalurl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-semibold text-blue-600 hover:underline
                  dark:text-blue-400"
          >
            {{ t('eventsView.viewPage') }} →
          </a>
        </div>
        </template>
        <p v-else class="text-sm opacity-70">{{ t('eventsView.noneDay') }}</p>
      </div>
    </ModalComponent>

    <section class="bg-surface dark:bg-surface-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700 mt-6">
      <h2 class="text-xl font-semibold mb-4">{{ t('eventsView.create') }}</h2>
      <form @submit.prevent="addEvent" class="grid gap-4">
        <label class="grid gap-1">
          <span class="font-semibold">{{ t('eventsView.title') }}</span>
          <input v-model="newEvent.title" type="text" :placeholder="t('eventsView.titlePlaceholder')" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" />
        </label>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="grid gap-1">
            <span class="font-semibold">{{ t('eventsView.startDate') }}</span>
            <input
              v-model="newEvent.startDateLocal"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
            />
          </label>

          <label class="grid gap-1">
            <span class="font-semibold">{{ t('eventsView.endDate') }}</span>
            <input
              v-model="newEvent.endDateLocal"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
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

        <div v-if="newEvent.hasTime" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="grid gap-1">
            <span class="font-semibold">{{ t('eventsView.startTime') }}</span>
            <input
              v-model="newEvent.startTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
            />
          </label>

          <label class="grid gap-1">
            <span class="font-semibold">{{ t('eventsView.endTime') }}</span>
            <input
              v-model="newEvent.endTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
            />
          </label>
        </div>

        <label class="grid gap-1">
          <span class="font-semibold">{{ t('eventsView.description') }}</span>
          <textarea v-model="newEvent.description" :placeholder="t('eventsView.description')" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"></textarea>
        </label>

        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="newEvent.active" class="w-4 h-4" />
            <span class="text-sm">{{ t('common.active') }}</span>
          </label>

          <label class="flex items-center gap-2">
            <span class="text-sm font-semibold">{{ t('eventsView.type') }}</span>
            <select v-model="newEvent.type" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded">
              <option value="SOCIAL">{{ t('eventsView.social') }}</option>
              <option value="MEETING">{{ t('eventsView.meeting') }}</option>
              <option value="OTHER">{{ t('eventsView.other') }}</option>
            </select>
          </label>
        </div>

        <button type="submit" class="w-fit px-4 py-2 bg-accent text-background-light rounded cursor-pointer hover:opacity-90">{{ t('eventsView.add') }}</button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import CalendarComponent from '@/components/CalendarComponent.vue'
import ModalComponent from '@/components/ModalComponent.vue'
import { getSocket } from '@/composables/socket'
import { useRoute } from 'vue-router'
import type { CalendarEvent } from '@/types'
import { useI18n } from 'vue-i18n'

const socket = getSocket()
const route = useRoute()
const { t, locale } = useI18n()
const userID = Number(sessionStorage.getItem('userID') || 0)

//Variable deiding how many upcoming events to show
const numberOfUpcomingEvents = 10;

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

type ExternalEvents = {
  eventID: number,
  externalurl: string,
  title: string,
  startDate: string,
  endDate: string
}

type DisplayEvent = {
  id: string | number
  title: string
  description?: string
  startDate: string
  endDate?: string
  type: string
  active?: boolean
  externalUrl?: string
  isExternal: boolean
}


const filters = ref({
  events : true,
  cleaning : true,
  external : true
})
const showHistoricalEvents = ref(false)

const externalEvents = ref<ExternalEvents[]>([]);

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

const selectedExternalEvents = ref<ExternalEvents[]>([]);

const externalEventDates = computed(() => {
  const dates = new Set<string>()

  externalEvents.value
    .filter((event) => showHistoricalEvents.value || displayEventHasNotEnded(event))
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

  const normalized = dateString
    .replace(' ', 'T')
    .replace('Z', '')

  return new Date(normalized)
}

const eventHasNotEnded = (event: CalendarEvent) => {
  const end = parseEventDate(event.endDate || event.startDate)
  if (!end) return false
  return end.getTime() >= Date.now()
}

const displayEventHasNotEnded = (event: { startDate: string; endDate?: string }) => {
  const end = parseEventDate(event.endDate || event.startDate)
  return Boolean(end && end.getTime() >= Date.now())
}

const allEvents = computed(() => {
  return upcomingEvents.value.filter((event) => showHistoricalEvents.value || eventHasNotEnded(event)).sort((a, b) => {
    const aStart = parseEventDate(a.startDate)
    const bStart = parseEventDate(b.startDate)
    if (!aStart || !bStart) return 0
    return aStart.getTime() - bStart.getTime()
  })
})

const allEventDates = computed(() => {
  const dates = new Set<string>()

  allEvents.value.forEach((event) => {
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

const cleaningCalendarDates = computed(() => {
  const dates = new Set<string>()
  ownCleaningWeeks.value.forEach((week) => {
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
      if (showHistoricalEvents.value || eventHasNotEnded(event)) {
        const uniqueKey = `${event.title}-${event.startDate}`
        if (!seenEventKeys.has(uniqueKey)) {
          seenEventKeys.add(uniqueKey)
          list.push({
            id: `internal-${event.id !== undefined ? event.id : index}`,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            type: event.type,
            active: event.active,
            isExternal: false
          })
        }
      }
    })
  }

  // 2. Process External Events (if filter is active)
  if (filters.value.external) {
    externalEvents.value.forEach((event, index) => {
      const end = parseEventDate(event.endDate || event.startDate)
      if (end && (showHistoricalEvents.value || end.getTime() >= now)) {
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
            isExternal: true
          })
        }
      }
    })
  }

  // 3. Sort chronologically by start date first, THEN slice to 10
  return list
    .sort((a, b) => {
      const aStart = parseEventDate(a.startDate)?.getTime() || 0
      const bStart = parseEventDate(b.startDate)?.getTime() || 0
      return aStart - bStart
    })
    .slice(0, numberOfUpcomingEvents)
})

const showEventDetailsModal = ref(false)
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

const openEventDetails = (events: CalendarEvent[], dayKey = '') => {
  selectedEvents.value = filters.value.events ? events : []
  selectedCleaningWeeks.value = (dayKey && filters.value.cleaning)
    ? ownCleaningWeeks.value.filter((week) => dateIsInRange(dayKey, week.startDate, week.endDate))
    : []
  selectedExternalEvents.value = (dayKey && filters.value.external)
  ? externalEvents.value.filter((event) => {
      return dateIsInRange(
        dayKey,
        event.startDate,
        event.endDate || event.startDate
      )
    })
  : []
  selectedEventDay.value = dayKey
  showEventDetailsModal.value = true
}

const onCalendarDayClick = (dateKey: string) => {
  const matchingEvents = allEvents.value.filter((event) => {
    if (!event.startDate) return false

    return dateIsInRange(
      dateKey,
      event.startDate,
      event.endDate || event.startDate
    )
  })

  openEventDetails(matchingEvents, dateKey)
}

const openEventDetail = (event: CalendarEvent | DisplayEvent) => {
  // If it's a merged DisplayEvent and it's external, open the link
  if ('isExternal' in event && event.isExternal && event.externalUrl) {
    window.open(event.externalUrl, '_blank', 'noopener,noreferrer')
    return
  }

  // If it's a merged internal event from the list, find the original CalendarEvent
  let targetEvent = event as CalendarEvent
  if ('isExternal' in event && !event.isExternal) {
    const found = upcomingEvents.value.find((e) => `internal-${e.id}` === event.id)
    if (!found) return
    targetEvent = found
  }

  selectedCleaningWeeks.value = []
  openEventDetails([targetEvent])
}

const getEventIdentifier = (event: CalendarEvent) => {
  return Number(event.id ?? (event as any).eventID)
}

const openRequestedEvent = () => {
  const requestedEventID = Number(route.query.eventID)
  if (!requestedEventID) return

  const requestedEvent = allEvents.value.find((event) => getEventIdentifier(event) === requestedEventID)
  if (requestedEvent) {
    openEventDetail(requestedEvent)
  }
}

const bindSocket = () => {
  socket.off('eventsData')
  socket.off('cleaningWeeks')
  socket.off('externalEvents')

  socket.on('eventsData', (events: CalendarEvent[]) => {
    console.log('EVENTS FROM SERVER:', events)
    upcomingEvents.value = events
    sessionStorage.setItem('events', JSON.stringify(events))
    openRequestedEvent()
  })

  socket.on('cleaningWeeks', (weeks: CleaningWeek[]) => {
    cleaningWeeks.value = weeks
  })

  socket.on('externalEvents', (eEvents: ExternalEvents[]) => {
    externalEvents.value = eEvents
  })
}

const fetchCalendarData = () => {
  socket.emit('getEvents', { active: true, dormID: sessionStorage.getItem('dormID') })
  socket.emit('getCleaningWeeks')
  socket.emit('getExternalEvents')
}

const newEvent = ref<Partial<CalendarEvent> & {
  startDateLocal?: string
  endDateLocal?: string
  startTime?: string
  endTime?: string
  hasTime?: boolean
}>({
  title: '',
  description: '',
  active: true,
  type: 'SOCIAL',
  startDateLocal: '',
  endDateLocal: '',
  startTime: '',
  endTime: '',
  hasTime: false
})

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
  const item: CalendarEvent = {
    id: tempId,
    title: String(newEvent.value.title),
    description: String(newEvent.value.description || ''),
    startDate: start,
    endDate: end,
    active: Boolean(newEvent.value.active),
    type: String(newEvent.value.type || 'OTHER')
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
            type: saved.type || item.type
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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return dateObj.toLocaleString(locale.value, {
    year: 'numeric',
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
    return `${formatDate(start, true)} — ${formatDate(end, true)}`
  }

  // Different dates
  return `${formatDate(start, true)} — ${formatDate(end, true)}`
}
const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfLocalDay = (dateValue: string) => {
  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getDateKeysInRange = (start: string, end: string) => {
  const dates: string[] = []
  const cursor = startOfLocalDay(start)
  const endDate = startOfLocalDay(end)

  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

const dateIsInRange = (dateKey: string, start: string, end: string) => {
  const day = startOfLocalDay(dateKey).getTime()
  return day >= startOfLocalDay(start).getTime() && day <= startOfLocalDay(end).getTime()
}

onMounted(() => {
  bindSocket()
  fetchCalendarData()
  openRequestedEvent()
})

onUnmounted(() => {
  socket.off('eventsData')
  socket.off('cleaningWeeks')
  socket.off('externalEvents')
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



</script>
