<template>
  <div class="grid gap-6 p-6">
    <section class="bg-secondary dark:bg-secondary-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold mb-4">Events</h1>
      <CalendarComponent :marked-dates="upcomingEvents.map(e => e.date)" />
    </section>

    <section class="bg-secondary dark:bg-secondary-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4">Upcoming Events</h2>
      <ul v-if="upcomingEvents.length" class="list-none">
        <li v-for="event in upcomingEvents" :key="event.id" class="flex justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <div>
            <strong class="font-semibold">{{ event.title }}</strong>
            <p class="text-sm opacity-70">{{ event.description }}</p>
          </div>
          <span class="text-sm opacity-70 whitespace-nowrap">{{ formatDate(event.date) }}</span>
        </li>
      </ul>
      <p v-else class="text-sm opacity-70">No upcoming events.</p>
    </section>

    <section class="bg-secondary dark:bg-secondary-dark rounded-lg p-5 border border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold mb-4">Create New Event</h2>
      <form @submit.prevent="addEvent" class="grid gap-4">
        <label class="grid gap-1">
          <span class="font-semibold">Title</span>
          <input v-model="newEvent.title" type="text" placeholder="Event title" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" />
        </label>
        <label class="grid gap-1">
          <span class="font-semibold">Date</span>
          <input v-model="newEvent.date" type="date" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded" />
        </label>
        <label class="grid gap-1">
          <span class="font-semibold">Description</span>
          <textarea v-model="newEvent.description" placeholder="Description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"></textarea>
        </label>
        <button type="submit" class="w-fit px-4 py-2 bg-primary text-white rounded cursor-pointer hover:opacity-90">Add Event</button>
      </form>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue'
import CalendarComponent from '@/components/CalendarComponent.vue'

export default {
  name: 'EventView',
  components: {
    CalendarComponent
  },
  setup() {

    const newEvent = ref({
      title: '',
      date: '',
      description: ''
    })
    
    const upcomingEvents = ref([
    {
        id: 1,
        title: 'Team Meeting',
        date: '2026-07-01',
        description: 'Monthly planning session'
    },
    {
        id: 2,
        title: 'Project Demo',
        date: '2026-07-10',
        description: 'Client presentation'
    },
    {
        id: 3,
        title: 'Design Review',
        date: '2026-06-25',
        description: 'Walkthrough of new dashboard mockups'
    },
    {
        id: 4,
        title: 'Quarterly Budget Sync',
        date: '2026-07-15',
        description: 'Finance check-in for Q3 planning'
    },
    {
        id: 5,
        title: 'Onboarding: New Hires',
        date: '2026-06-22',
        description: 'Intro session for the two new engineers'
    },
    {
        id: 6,
        title: 'Product Launch',
        date: '2026-08-01',
        description: 'Public release of v2.0'
    }
    ])

    function addEvent() {
      if (!newEvent.value.title || !newEvent.value.date) {
        return
      }

      upcomingEvents.value.push({
        id: Date.now(),
        title: newEvent.value.title,
        date: newEvent.value.date,
        description: newEvent.value.description
      })

      newEvent.value.title = ''
      newEvent.value.date = ''
      newEvent.value.description = ''
    }

    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }

    return {
      upcomingEvents,
      newEvent,
      addEvent,
      formatDate
    }
  }
}
</script>
