<template>
  <main class="min-h-screen bg-background-light px-4 py-6 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <div v-if="isLoading" class="grid min-h-[55vh] place-items-center" role="status"><div class="text-center"><span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></span><p class="mt-4 font-semibold">Getting your residence ready…</p></div></div>

      <template v-else>
        <section v-if="loadError" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error/10 p-4" role="alert"><div><p class="font-bold">Some home information could not be updated</p><p class="text-sm opacity-70">You can keep using the app or try loading it again.</p></div><button class="rounded-xl border border-error/40 px-4 py-2 text-sm font-bold" @click="requestDashboard">Try again</button></section>

        <section v-if="alerts.length || userSurveys.length" aria-labelledby="attention-heading">
          <div class="mb-3 flex items-end justify-between gap-4"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">Up next</p><h2 id="attention-heading" class="text-2xl font-bold">Needs your attention</h2></div><span class="rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">{{ attentionCount }}</span></div>
          <div class="grid gap-3 md:grid-cols-2">
            <article v-for="alert in alerts" :key="alert.id" class="relative flex min-h-32 items-start gap-4 rounded-2xl border border-border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent dark:bg-surface-dark">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-warning/15 text-xl">!</span>
              <router-link :to="alert.route || '/home'" class="min-w-0 flex-1 pr-8 after:absolute after:inset-0 after:content-['']"><strong class="block text-lg">{{ alert.title }}</strong><span class="mt-1 block text-sm opacity-70">{{ alert.description }}</span><span class="mt-3 block text-sm font-bold text-accent">{{ alert.actionLabel || 'Open' }} →</span></router-link>
              <button v-if="alert.dismissible !== false" type="button" class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-xl opacity-60 transition hover:bg-background-light hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-background-dark" :aria-label="`Dismiss ${alert.title}`" title="Dismiss notification" @click="dismissAttentionItem(alert.id)">×</button>
            </article>
            <article v-for="survey in userSurveys" :key="survey.eID" class="relative flex min-h-32 items-start gap-4 rounded-2xl border border-border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent dark:bg-surface-dark">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-xl">≡</span>
              <router-link :to="`/answerSurvey/${survey.eID}`" class="min-w-0 flex-1 pr-8 after:absolute after:inset-0 after:content-['']"><strong class="block text-lg">Resident survey</strong><span class="mt-1 block text-sm opacity-70">{{ survey.question }}</span><span class="mt-3 block text-sm font-bold text-accent">Share your answer →</span></router-link>
              <button type="button" class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-xl opacity-60 transition hover:bg-background-light hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-background-dark" aria-label="Dismiss resident survey" title="Dismiss notification" @click="dismissAttentionItem(surveyAlertID(survey.eID))">×</button>
            </article>
          </div>
        </section>
        <section v-else class="flex items-center gap-4 rounded-2xl border border-success/20 bg-success/10 p-5"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success text-xl font-bold text-white">✓</span><div><h2 class="font-bold">You’re all caught up</h2><p class="text-sm opacity-70">No tasks or surveys need your attention right now.</p></div></section>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.65fr)]">
          <section class="rounded-3xl bg-background p-5 shadow-sm dark:bg-surface-dark sm:p-6" aria-labelledby="water-heading">
            <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">Your floor</p><h2 id="water-heading" class="text-2xl font-bold">Water use</h2><p class="mt-1 text-sm opacity-65">Last 7 complete days compared with your floor’s usual use.</p></div><router-link to="/stats" class="rounded-xl border border-border-border px-4 py-2 text-sm font-bold hover:border-accent hover:text-accent">View insights →</router-link></div>
            <div v-if="waterConsumption.available" class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><FloorWaterChart :days="waterConsumption.days" /><div class="grid grid-cols-2 gap-3 sm:w-56 sm:grid-cols-1"><div class="rounded-2xl bg-background-light p-4 dark:bg-background-dark"><p class="text-xs font-bold uppercase tracking-wide opacity-55">Last 7 days</p><p class="mt-1 text-2xl font-extrabold">{{ formatLiters(waterConsumption.currentWeekLiters) }}</p><p class="mt-1 text-sm font-semibold" :class="comparisonPercent <= 0 ? 'text-success' : 'text-warning'">{{ comparisonLabel }}</p></div><div class="rounded-2xl border border-border-border p-4"><p class="text-xs font-bold uppercase tracking-wide opacity-55">Split</p><p class="mt-2 text-sm"><strong>{{ formatLiters(waterConsumption.coldLiters) }}</strong> cold</p><p class="text-sm"><strong>{{ formatLiters(waterConsumption.warmLiters) }}</strong> warm</p></div></div></div>
            <div v-else class="mt-5 rounded-2xl bg-background-light p-8 text-center dark:bg-background-dark"><p class="font-bold">Water insights are not available yet</p><p class="mt-1 text-sm opacity-65">Readings will appear here when meters have reported data.</p></div>
          </section>

          <section class="rounded-3xl bg-background p-5 shadow-sm dark:bg-surface-dark sm:p-6" aria-labelledby="events-heading">
            <div class="flex items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">Community</p><h2 id="events-heading" class="text-2xl font-bold">Coming up</h2></div><router-link to="/events" class="text-sm font-bold text-accent">All events →</router-link></div>
            <div class="mt-5 grid grid-cols-7 gap-1" aria-label="Events during the next seven days">
              <div v-for="day in weekDays" :key="day.key" class="min-w-0 rounded-xl px-1 py-2 text-center" :class="day.isToday ? 'bg-accent text-white' : 'bg-background-light dark:bg-background-dark'">
                <p class="truncate text-[10px] font-bold uppercase tracking-wide" :class="day.isToday ? 'text-white/75' : 'opacity-50'">{{ day.weekday }}</p>
                <p class="mt-0.5 font-extrabold">{{ day.day }}</p>
                <span v-if="eventsForDay(day.date).length" class="mx-auto mt-1 block h-1.5 w-1.5 rounded-full" :class="day.isToday ? 'bg-white' : 'bg-accent'" :title="`${eventsForDay(day.date).length} event${eventsForDay(day.date).length === 1 ? '' : 's'}`"></span>
                <span v-else class="mx-auto mt-1 block h-1.5 w-1.5"></span>
              </div>
            </div>
            <div v-if="upcomingEvents.length" class="mt-4 divide-y divide-border-border"><button v-for="event in upcomingEvents" :key="event.eventID ?? event.id" class="w-full py-4 text-left first:pt-1" @click="openEventDetails(event)"><span class="flex items-start gap-3"><span class="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10">{{ event.icon || '◇' }}</span><span class="min-w-0"><strong class="block truncate">{{ event.title }}</strong><span class="mt-0.5 block text-sm opacity-60">{{ formatCompactDate(event.startDate) || event.time || 'Date to be announced' }}</span></span></span></button></div>
            <div v-else class="mt-5 rounded-2xl bg-background-light p-6 text-center dark:bg-background-dark"><p class="font-bold">No upcoming events</p><p class="mt-1 text-sm opacity-60">New activities will show up here.</p></div>
          </section>
        </div>

        <section aria-labelledby="shortcuts-heading"><div class="mb-3"><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">Explore</p><h2 id="shortcuts-heading" class="text-2xl font-bold">Your residence</h2></div><div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><router-link v-for="item in residentShortcuts" :key="item.to" :to="item.to" class="group rounded-2xl border border-border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent dark:bg-surface-dark"><span class="text-2xl">{{ item.icon }}</span><h3 class="mt-3 font-bold group-hover:text-accent">{{ item.title }}</h3><p class="mt-1 text-sm opacity-65">{{ item.description }}</p></router-link></div></section>

        <section v-if="isAdmin" class="rounded-3xl border border-accent/25 bg-accent/5 p-5 sm:p-6" aria-labelledby="admin-heading"><div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">Administrator</p><h2 id="admin-heading" class="text-2xl font-bold">Management workspace</h2><p class="mt-1 text-sm opacity-65">Manage residents, building data, and feedback.</p></div><router-link to="/admin" class="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white">Open administration</router-link></div><div class="mt-5 grid gap-3 sm:grid-cols-3"><router-link v-for="item in adminShortcuts" :key="item.to" :to="item.to" class="rounded-2xl bg-background p-4 font-bold shadow-sm hover:text-accent dark:bg-surface-dark"><span class="mr-2">{{ item.icon }}</span>{{ item.label }} →</router-link></div></section>
      </template>
    </div>

    <ModalComponent v-model="showEventModal"><div v-if="selectedEvent" class="space-y-4 p-4"><div><p v-if="selectedEvent.type" class="text-xs font-bold uppercase tracking-wider text-accent">{{ selectedEvent.type }}</p><h2 class="mt-1 text-2xl font-bold">{{ selectedEvent.title }}</h2></div><p class="font-semibold">{{ formatEventDateRange(selectedEvent.startDate, selectedEvent.endDate) || selectedEvent.time || 'Date to be announced' }}</p><p class="whitespace-pre-line opacity-75">{{ selectedEvent.description || 'No additional information is available for this event.' }}</p><router-link to="/events" class="inline-flex rounded-xl bg-accent px-4 py-2.5 font-bold text-white" @click="showEventModal = false">Open event calendar</router-link></div></ModalComponent>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FloorWaterChart from '@/components/FloorWaterChart.vue'
import ModalComponent from '@/components/ModalComponent.vue'
import { getSocket } from '@/composables/socket'
import type { AlertItem, DashboardPayload, FloorWaterConsumption, HomeEventItem, SurveyItem } from '@/types'

const socket = getSocket()
const isLoading = ref(true), loadError = ref(false)
const dashboardAlerts = ref<AlertItem[]>([]), events = ref<HomeEventItem[]>([]), dashboardSurveys = ref<SurveyItem[]>([])
const dashboardUserID = ref<number | null>(null)
const dismissedAttentionIDs = ref<Set<number>>(new Set())
const waterConsumption = ref<FloorWaterConsumption>({ available: false, latestReadingAt: null, currentWeekLiters: 0, historicalWeeklyAverageLiters: 0, coldLiters: 0, warmLiters: 0, days: [] })
const showEventModal = ref(false), selectedEvent = ref<HomeEventItem | null>(null)
const isAdmin = computed(() => sessionStorage.getItem('userRole')?.toLowerCase() === 'admin')
const alerts = computed(() => dashboardAlerts.value.filter(alert => alert.dismissible === false || !dismissedAttentionIDs.value.has(alert.id)))
const userSurveys = computed(() => dashboardSurveys.value.filter(survey => !dismissedAttentionIDs.value.has(surveyAlertID(survey.eID))))
const attentionCount = computed(() => alerts.value.length + userSurveys.value.length)
const currentEvents = computed(() => events.value
  .filter(event => event.active !== false && eventHasNotEnded(event))
  .sort((a, b) => (parseDate(a.startDate)?.getTime() || 0) - (parseDate(b.startDate)?.getTime() || 0)))
const upcomingEvents = computed(() => currentEvents.value.slice(0, 4))
const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + index)
  return { key: date.toISOString(), date, weekday: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date), day: date.getDate(), isToday: index === 0 }
}))
const comparisonPercent = computed(() => waterConsumption.value.historicalWeeklyAverageLiters ? ((waterConsumption.value.currentWeekLiters - waterConsumption.value.historicalWeeklyAverageLiters) / waterConsumption.value.historicalWeeklyAverageLiters) * 100 : 0)
const comparisonLabel = computed(() => { if (!waterConsumption.value.historicalWeeklyAverageLiters) return 'No comparison yet'; if (Math.abs(comparisonPercent.value) < 0.5) return 'About average'; return `${Math.abs(comparisonPercent.value).toFixed(0)}% ${comparisonPercent.value < 0 ? 'below' : 'above'} average` })
const residentShortcuts = [
  { title: 'Cleaning', description: 'Check your schedule and shared tasks.', to: '/cleaning', icon: '✓' },
  { title: 'Events', description: 'See what is happening in your community.', to: '/events', icon: '◇' },
  { title: 'Chats', description: 'Talk with people in your residence.', to: '/chat', icon: '○' },
  { title: 'Account', description: 'Update your profile and password.', to: '/account', icon: '◎' },
]
const adminShortcuts = [{ label: 'Users & sensors', to: '/admin', icon: '⚙' }, { label: 'Water analytics', to: '/admin/water-analytics', icon: '▥' }, { label: 'Manage surveys', to: '/survey', icon: '≡' }]

function formatLiters(value: number) { return `${Math.round(value).toLocaleString()} L` }
function parseDate(value?: string) { if (!value) return null; const date = new Date(value.replace(' ', 'T').replace('Z', '')); return Number.isNaN(date.getTime()) ? null : date }
function eventHasNotEnded(event: HomeEventItem) { const end = parseDate(event.endDate || event.startDate); return Boolean(end && end.getTime() >= Date.now()) }
function formatCompactDate(value?: string) { const date = parseDate(value); return date ? new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date) : value || '' }
function formatEventDateRange(start?: string, end?: string) { const a = formatCompactDate(start), b = formatCompactDate(end); return a && b ? `${a} — ${b}` : a }
function eventsForDay(day: Date) { return currentEvents.value.filter(event => { const date = parseDate(event.startDate); return date && date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate() }) }
function openEventDetails(event: HomeEventItem) { selectedEvent.value = event; showEventModal.value = true }
function surveyAlertID(eventID: number) { return 700000 + Number(eventID) }
function dismissedStorageKey(userID: number) { return `dismissed-home-attention:${userID}` }
function loadDismissedAttention(userID: number) {
  try { dismissedAttentionIDs.value = new Set(JSON.parse(localStorage.getItem(dismissedStorageKey(userID)) || '[]')) }
  catch { dismissedAttentionIDs.value = new Set() }
}
function dismissAttentionItem(id: number) {
  if (!dashboardUserID.value) return
  const dismissed = new Set(dismissedAttentionIDs.value)
  dismissed.add(id)
  dismissedAttentionIDs.value = dismissed
  localStorage.setItem(dismissedStorageKey(dashboardUserID.value), JSON.stringify([...dismissed].slice(-500)))
}
function applyDashboard(dashboard: DashboardPayload) {
  if (dashboardUserID.value !== dashboard.user.id) { dashboardUserID.value = dashboard.user.id; loadDismissedAttention(dashboard.user.id) }
  dashboardAlerts.value = dashboard.alerts || []; events.value = dashboard.events || []; dashboardSurveys.value = dashboard.pendingSurveys || []; waterConsumption.value = dashboard.waterConsumption || waterConsumption.value
  sessionStorage.setItem('dashboard', JSON.stringify(dashboard)); isLoading.value = false; loadError.value = false
}
function receiveError() { loadError.value = true; isLoading.value = false }
function requestDashboard() {
  if (isAdmin.value) { isLoading.value = false; loadError.value = false; return }
  loadError.value = false
  socket.emit('getDashboard')
}
function loadCache() { try { const cached = JSON.parse(sessionStorage.getItem('dashboard') || 'null') as DashboardPayload | null; if (cached) applyDashboard(cached) } catch { sessionStorage.removeItem('dashboard') } }
onMounted(() => { loadCache(); socket.on('dashboard', applyDashboard); socket.on('error', receiveError); socket.on('swapRequestUpdated', requestDashboard); requestDashboard() })
onBeforeUnmount(() => { socket.off('dashboard', applyDashboard); socket.off('error', receiveError); socket.off('swapRequestUpdated', requestDashboard) })
</script>
