<template>
  <main class="home-dashboard min-h-[calc(100dvh-4rem)] bg-background-light px-4 py-4 text-text dark:bg-background-dark dark:text-text-dark sm:px-6 lg:h-[calc(100dvh-4rem)] lg:min-h-0 lg:px-8 lg:py-3">
    <div class="mx-auto max-w-7xl space-y-4 lg:h-full">
      <div v-if="isLoading" class="grid min-h-[55vh] place-items-center" role="status"><div class="text-center"><span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></span><p class="mt-4 font-semibold">{{ t('home.loading') }}</p></div></div>

      <template v-else>
        <section v-if="loadError" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error/10 p-4" role="alert"><div><p class="font-bold">{{ t('home.partialError') }}</p><p class="text-sm opacity-70">{{ t('home.partialErrorHelp') }}</p></div><button class="rounded-xl border border-error/40 px-4 py-2 text-sm font-bold" @click="requestDashboard">{{ t('common.retry') }}</button></section>

        <section v-if="alerts.length || userSurveys.length" aria-labelledby="attention-heading">
          <div class="mb-3 flex items-end justify-between gap-4"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('home.upNext') }}</p><h2 id="attention-heading" class="text-2xl font-bold">{{ t('home.needsAttention') }}</h2></div><span class="rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent">{{ attentionCount }}</span></div>
          <div class="grid gap-3 md:grid-cols-2">
            <article v-for="alert in alerts" :key="alert.id" class="relative flex min-h-32 items-start gap-4 rounded-2xl border border-border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent dark:bg-surface-dark">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-warning/15 text-xl">!</span>
              <router-link :to="alert.route || '/home'" class="min-w-0 flex-1 pr-8 after:absolute after:inset-0 after:content-['']"><strong class="block text-lg">{{ alert.title }}</strong><span class="mt-1 block text-sm opacity-70">{{ alert.description }}</span><span class="mt-3 block text-sm font-bold text-accent">{{ alert.actionLabel || t('home.open') }} →</span></router-link>
              <button v-if="alert.dismissible !== false" type="button" class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-xl opacity-60 transition hover:bg-background-light hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-background-dark" :aria-label="t('home.dismiss', { title: alert.title })" :title="t('home.dismissNotification')" @click="dismissAttentionItem(alert.id)">×</button>
            </article>
            <article v-for="survey in userSurveys" :key="survey.eID" class="relative flex min-h-32 items-start gap-4 rounded-2xl border border-border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent dark:bg-surface-dark">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-xl">≡</span>
              <router-link :to="`/answerSurvey/${survey.eID}`" class="min-w-0 flex-1 pr-8 after:absolute after:inset-0 after:content-['']"><strong class="block text-lg">{{ t('notifications.residentSurvey') }}</strong><span class="mt-1 block text-sm opacity-70">{{ survey.question }}</span><span class="mt-3 block text-sm font-bold text-accent">{{ t('notifications.shareAnswer') }} →</span></router-link>
              <button type="button" class="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-xl opacity-60 transition hover:bg-background-light hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent dark:hover:bg-background-dark" :aria-label="t('home.dismissSurvey')" :title="t('home.dismissNotification')" @click="dismissAttentionItem(surveyAlertID(survey.eID))">×</button>
            </article>
          </div>
        </section>
        <section v-else class="flex items-center gap-4 rounded-2xl border border-success/20 bg-success/10 p-5"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success text-xl font-bold text-white">✓</span><div><h2 class="font-bold">{{ t('notifications.caughtUp') }}</h2><p class="text-sm opacity-70">{{ t('home.caughtUpHelp') }}</p></div></section>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.65fr)]">
          <section class="rounded-3xl bg-background p-5 shadow-sm dark:bg-surface-dark sm:p-6" aria-labelledby="water-heading">
            <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('topbar.yourFloor') }}</p><h2 id="water-heading" class="text-2xl font-bold">{{ t('home.waterUse') }}</h2><p class="mt-1 text-sm opacity-65">{{ t('home.waterHelp') }}</p></div><router-link to="/stats" class="rounded-xl border border-border-border px-4 py-2 text-sm font-bold hover:border-accent hover:text-accent">{{ t('home.viewInsights') }} →</router-link></div>
            <div v-if="waterConsumption.available" class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><FloorWaterChart :days="waterConsumption.days" /><div class="grid grid-cols-2 gap-3 sm:w-56 sm:grid-cols-1"><div class="rounded-2xl bg-background-light p-4 dark:bg-background-dark"><p class="text-xs font-bold uppercase tracking-wide opacity-55">{{ t('charts.lastSevenDays') }}</p><p class="mt-1 text-2xl font-extrabold">{{ formatLiters(waterConsumption.currentWeekLiters) }}</p><p class="mt-1 text-sm font-semibold" :class="comparisonPercent <= 0 ? 'text-success' : 'text-warning'">{{ comparisonLabel }}</p></div><div class="rounded-2xl border border-border-border p-4"><p class="text-xs font-bold uppercase tracking-wide opacity-55">{{ t('home.split') }}</p><p class="mt-2 text-sm"><strong>{{ formatLiters(waterConsumption.coldLiters) }}</strong> {{ t('home.cold') }}</p><p class="text-sm"><strong>{{ formatLiters(waterConsumption.warmLiters) }}</strong> {{ t('home.warm') }}</p></div></div></div>
            <div v-else class="mt-5 rounded-2xl bg-background-light p-8 text-center dark:bg-background-dark"><p class="font-bold">{{ t('home.noWater') }}</p><p class="mt-1 text-sm opacity-65">{{ t('home.noWaterHelp') }}</p></div>
          </section>

          <section class="rounded-3xl bg-background p-5 shadow-sm dark:bg-surface-dark sm:p-6" aria-labelledby="events-heading">
            <div class="flex items-center justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('nav.community') }}</p><h2 id="events-heading" class="text-2xl font-bold">{{ t('home.comingUp') }}</h2></div><router-link to="/events" class="text-sm font-bold text-accent">{{ t('home.allEvents') }} →</router-link></div>
            <div class="mt-5 grid grid-cols-7 gap-1" :aria-label="t('home.weekAria')">
              <div v-for="day in weekDays" :key="day.key" class="min-w-0 rounded-xl px-1 py-2 text-center" :class="day.isToday ? 'bg-accent text-white' : 'bg-background-light dark:bg-background-dark'">
                <p class="truncate text-[10px] font-bold uppercase tracking-wide" :class="day.isToday ? 'text-white/75' : 'opacity-50'">{{ day.weekday }}</p>
                <p class="mt-0.5 font-extrabold">{{ day.day }}</p>
                <span v-if="eventsForDay(day.date).length" class="mx-auto mt-1 block h-1.5 w-1.5 rounded-full" :class="day.isToday ? 'bg-white' : 'bg-accent'" :title="t('home.eventCount', { count: eventsForDay(day.date).length })"></span>
                <span v-else class="mx-auto mt-1 block h-1.5 w-1.5"></span>
              </div>
            </div>
            <div v-if="upcomingEvents.length" class="mt-4 divide-y divide-border-border"><button v-for="event in upcomingEvents" :key="event.id ?? event.eventID" class="w-full py-4 text-left first:pt-1" @click="openEventDetails(event)"><span class="flex items-start gap-3"><span class="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10">{{ event.icon || '◇' }}</span><span class="min-w-0"><strong class="block truncate">{{ event.title }}</strong><span class="mt-0.5 block text-sm opacity-60">{{ formatCompactDate(event.startDate) || event.time || t('home.dateTba') }}</span></span></span></button></div>
            <div v-else class="mt-5 rounded-2xl bg-background-light p-6 text-center dark:bg-background-dark"><p class="font-bold">{{ t('home.noEvents') }}</p><p class="mt-1 text-sm opacity-60">{{ t('home.noEventsHelp') }}</p></div>
          </section>
        </div>

        <section v-if="isAdmin" class="rounded-3xl border border-accent/25 bg-accent/5 p-5 sm:p-6" aria-labelledby="admin-heading"><div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-[.14em] text-accent">{{ t('topbar.administrator') }}</p><h2 id="admin-heading" class="text-2xl font-bold">{{ t('home.managementWorkspace') }}</h2><p class="mt-1 text-sm opacity-65">{{ t('home.managementHelp') }}</p></div><router-link to="/admin" class="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white">{{ t('home.openAdmin') }}</router-link></div><div class="mt-5 grid gap-3 sm:grid-cols-3"><router-link v-for="item in adminShortcuts" :key="item.to" :to="item.to" class="rounded-2xl bg-background p-4 font-bold shadow-sm hover:text-accent dark:bg-surface-dark"><span class="mr-2">{{ item.icon }}</span>{{ item.label }} →</router-link></div></section>
      </template>
    </div>

    <ModalComponent v-model="showEventModal"><div v-if="selectedEvent" class="space-y-4 p-4"><div><p v-if="selectedEvent.type" class="text-xs font-bold uppercase tracking-wider text-accent">{{ selectedEvent.type }}</p><h2 class="mt-1 text-2xl font-bold">{{ selectedEvent.title }}</h2></div><p class="font-semibold">{{ formatEventDateRange(selectedEvent.startDate, selectedEvent.endDate) || selectedEvent.time || t('home.dateTba') }}</p><p class="whitespace-pre-line opacity-75">{{ selectedEvent.description || t('home.noEventInfo') }}</p><a v-if="selectedEvent.externalUrl" :href="selectedEvent.externalUrl" target="_blank" rel="noopener noreferrer" class="inline-flex rounded-xl bg-accent px-4 py-2.5 font-bold text-white">{{ t('home.openEventPage') }}</a><router-link v-else to="/events" class="inline-flex rounded-xl bg-accent px-4 py-2.5 font-bold text-white" @click="showEventModal = false">{{ t('home.openCalendar') }}</router-link></div></ModalComponent>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import FloorWaterChart from '@/components/FloorWaterChart.vue'
import ModalComponent from '@/components/ModalComponent.vue'
import { getSocket } from '@/composables/socket'
import type { AlertItem, DashboardPayload, FloorWaterConsumption, HomeEventItem, SurveyItem } from '@/types'
import { useI18n } from 'vue-i18n'

const socket = getSocket()
const { t, locale } = useI18n()
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
  .filter(event => event.active !== false && !isCleaningEvent(event) && eventHasNotEnded(event))
  .sort((a, b) => (parseDate(a.startDate)?.getTime() || 0) - (parseDate(b.startDate)?.getTime() || 0)))
const upcomingEvents = computed(() => currentEvents.value.slice(0, 4))
const weekDays = computed(() => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + index)
  return { key: date.toISOString(), date, weekday: new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date), day: date.getDate(), isToday: index === 0 }
}))
const comparisonPercent = computed(() => waterConsumption.value.historicalWeeklyAverageLiters ? ((waterConsumption.value.currentWeekLiters - waterConsumption.value.historicalWeeklyAverageLiters) / waterConsumption.value.historicalWeeklyAverageLiters) * 100 : 0)
const comparisonLabel = computed(() => { if (!waterConsumption.value.historicalWeeklyAverageLiters) return t('home.noComparison'); if (Math.abs(comparisonPercent.value) < 0.5) return t('home.aboutAverage'); return t('home.averageComparison', { percent: Math.abs(comparisonPercent.value).toFixed(0), direction: t(comparisonPercent.value < 0 ? 'home.below' : 'home.above') }) })
const adminShortcuts = computed(() => [{ label: t('home.usersSensors'), to: '/admin', icon: '⚙' }, { label: t('nav.waterAnalytics'), to: '/admin/water-analytics', icon: '▥' }, { label: t('home.manageSurveys'), to: '/survey', icon: '≡' }])

function formatLiters(value: number) { return `${Math.round(value).toLocaleString(locale.value)} L` }
function parseDate(value?: string) { if (!value) return null; const date = new Date(value.replace(' ', 'T').replace('Z', '')); return Number.isNaN(date.getTime()) ? null : date }
function isCleaningEvent(event: HomeEventItem) { return event.type?.trim().toUpperCase() === 'CLEANING' }
function eventHasNotEnded(event: HomeEventItem) { const end = parseDate(event.endDate || event.startDate); return Boolean(end && end.getTime() >= Date.now()) }
function formatCompactDate(value?: string) { const date = parseDate(value); return date ? new Intl.DateTimeFormat(locale.value, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date) : value || '' }
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

<style scoped>
.home-dashboard section[aria-labelledby="attention-heading"] > .grid {
  max-height: 8rem;
  overflow-y: auto;
  padding-right: .25rem;
  scrollbar-gutter: stable;
}

.home-dashboard section[aria-labelledby="attention-heading"] article {
  min-height: 5.5rem;
  gap: .75rem;
  padding: .75rem;
}

.home-dashboard section[aria-labelledby="attention-heading"] article > span:first-child {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: .625rem;
  font-size: 1rem;
}

.home-dashboard section[aria-labelledby="attention-heading"] article a > span:last-child {
  margin-top: .25rem;
}

.home-dashboard section[aria-labelledby="attention-heading"] article strong {
  font-size: 1rem;
}

.home-dashboard section[aria-labelledby="attention-heading"] article button {
  width: 2rem;
  height: 2rem;
}

@media (min-width: 1024px) {
  .home-dashboard section[aria-labelledby="attention-heading"] > .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .home-dashboard > div {
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  .home-dashboard > div > * {
    margin-top: 0;
  }

  .home-dashboard > div > div.grid {
    min-height: 0;
    flex: 1;
    gap: 1rem;
  }

  .home-dashboard > div > div.grid > section {
    min-height: 0;
    overflow: hidden;
    padding: 1rem;
  }

  .home-dashboard section[aria-labelledby="attention-heading"] article {
    min-height: 5.5rem;
    padding: .75rem;
  }
}
</style>
