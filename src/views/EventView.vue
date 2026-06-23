<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4 z-50" />
  <div class="min-h-screen p-6 bg-background dark:bg-background-dark">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-text-headline">Events</h1>
        <p class="text-sm text-text opacity-70">View the calendar and upcoming event schedule.</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section class="bg-secondary dark:bg-secondary-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold mb-4">Calendar</h2>
        <div class="w-full max-w-full">
          <CalendarComponent :marked-dates="upcomingEvents.map(e => e.startDate)" class="w-full h-full" />
        </div>
      </section>

      <section class="bg-secondary dark:bg-secondary-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold mb-4">Upcoming Events</h2>
        <ul v-if="upcomingEvents.length" class="list-none">
          <li v-for="event in upcomingEvents" :key="event.id" class="flex flex-col gap-2 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div class="flex items-center justify-between">
              <div>
                <strong class="font-semibold">{{ event.title }}</strong>
                <p class="text-sm opacity-70">{{ event.description }}</p>
              </div>
              <div class="text-sm opacity-70 text-right">
                <div>{{ formatDateRange(event.startDate, event.endDate) }}</div>
                <div class="uppercase text-xs mt-1">{{ event.type }} <span v-if="!event.active" class="text-red-500">(inactive)</span></div>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm opacity-70">No upcoming events.</p>
      </section>
    </div>

    <section class="bg-secondary dark:bg-secondary-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700 mt-6">
      <h2 class="text-xl font-semibold mb-4">Create New Event</h2>
      <form @submit.prevent="addEvent" class="grid gap-4">
        <label class="grid gap-1">
          <span class="font-semibold">Title</span>
          <input v-model="newEvent.title" type="text" placeholder="Event title" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" />
        </label>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="grid gap-1">
            <span class="font-semibold">Start (date & time)</span>
            <input v-model="newEvent.startDateLocal" type="datetime-local" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" />
          </label>

          <label class="grid gap-1">
            <span class="font-semibold">End (date & time)</span>
            <input v-model="newEvent.endDateLocal" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" />
          </label>
        </div>

        <label class="grid gap-1">
          <span class="font-semibold">Description</span>
          <textarea v-model="newEvent.description" placeholder="Description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"></textarea>
        </label>

        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="newEvent.active" class="w-4 h-4" />
            <span class="text-sm">Active</span>
          </label>

          <label class="flex items-center gap-2">
            <span class="text-sm font-semibold">Type</span>
            <select v-model="newEvent.type" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded">
              <option value="SOCIAL">SOCIAL</option>
              <option value="MEETING">MEETING</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
        </div>

        <button type="submit" class="w-fit px-4 py-2 bg-primary text-white rounded cursor-pointer hover:opacity-90">Add Event</button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CalendarComponent from '@/components/CalendarComponent.vue'
import NavComponent from '@/components/NavComponent.vue'
import { getSocket } from '@/composables/socket'

type EventItem = {
  id: number
  title: string
  description: string
  startDate: string // 'YYYY-MM-DD HH:mm:ss'
  endDate?: string
  active: boolean
  type: string
}

const navMenuType = ref('home')
const socket = getSocket()

const defaultEvents: EventItem[] = [
  {
    id: 1,
    title: 'Movie Night',
    description: 'Community movie screening in common room.',
    startDate: '2026-07-05 19:00:00',
    endDate: '2026-07-05 22:00:00',
    active: true,
    type: 'SOCIAL'
  },
  {
    id: 2,
    title: 'Yoga Class',
    description: 'Morning yoga session in the gym.',
    startDate: '2026-07-10 08:00:00',
    endDate: '2026-07-10 09:00:00',
    active: true,
    type: 'OTHER'
  }
]

const upcomingEvents = ref<EventItem[]>(
  (() => {
    try {
      const raw = sessionStorage.getItem('events')
      if (raw) {
        const parsed = JSON.parse(raw) as EventItem[]
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.warn('Failed to parse cached events:', e)
    }
    return defaultEvents
  })()
)

const newEvent = ref<Partial<EventItem> & { startDateLocal?: string; endDateLocal?: string }>({
  title: '',
  description: '',
  active: true,
  type: 'SOCIAL',
  startDateLocal: '',
  endDateLocal: ''
})

const toDbDatetime = (local: string) => {
  // Convert 'YYYY-MM-DDTHH:MM' to 'YYYY-MM-DD HH:MM:00'
  if (!local) return ''
  return local.replace('T', ' ') + ':00'
}

const addEvent = () => {
  if (!newEvent.value.title || !newEvent.value.startDateLocal) return

  const start = toDbDatetime(newEvent.value.startDateLocal as string)
  const end = newEvent.value.endDateLocal ? toDbDatetime(newEvent.value.endDateLocal as string) : undefined

  // temporary negative id for optimistic UI
  const tempId = -Date.now()
  const item: EventItem = {
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
  newEvent.value.active = true
  newEvent.value.type = 'SOCIAL'
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  // accept 'YYYY-MM-DD HH:mm:ss' or ISO-like strings
  const normalized = dateString.replace(' ', 'T')
  return new Date(normalized).toLocaleString()
}

const formatDateRange = (start?: string, end?: string) => {
  if (!start) return ''
  if (!end) return formatDate(start)
  return `${formatDate(start)} — ${formatDate(end)}`
}
</script>
