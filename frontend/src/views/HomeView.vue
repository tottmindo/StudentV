```vue
<template>
  <div
    v-if="isLoading"
    class="flex min-h-screen items-center justify-center bg-background-light px-4 dark:bg-background-dark"
    role="status"
    aria-live="polite"
  >
    <div class="flex flex-col items-center gap-4 text-center">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-accent/25 border-t-accent"
        aria-hidden="true"
      ></div>
      <div>
        <h1 class="text-xl font-semibold text-headline dark:text-text-dark">
          Loading your home
        </h1>
        <p class="mt-1 text-sm text-text opacity-70 dark:text-text-dark">
          Getting the latest information…
        </p>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen p-4 bg-background-light dark:bg-background-dark">
    <NavComponent :key="navKey" :socket="socket" :menu="menuType" class="fixed top-4 right-4 z-50" />

    <div class="flex flex-col gap-4">

      <!-- Header -->
      <header
        class="bg-surface dark:bg-surface-dark rounded-lg px-6 py-4 flex justify-between items-center"
      >
        <div>
          <h1 class="text-2xl font-bold text-headline dark:text-text-dark">
            Welcome back, {{ username }}
          </h1>

          <p class="text-text dark:text-text-dark">
            Room {{ room }} • {{ house }}, floor {{ floor }}
          </p>
        </div>
      </header>

      <section class="rounded-lg bg-surface p-5 dark:bg-surface-dark">
        <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Your floor's water consumption</h2>
            <p class="mt-1 text-sm opacity-70">The last seven complete days compared with the same weekdays over the previous four weeks.</p>
          </div>
          <p v-if="waterConsumption.latestReadingAt" class="text-xs opacity-60">
            Data through {{ formatEventDate(waterConsumption.latestReadingAt) }}
          </p>
        </div>

        <div v-if="waterConsumption.available" class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
          <FloorWaterChart :days="waterConsumption.days" />
          <div class="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <p class="text-sm opacity-70">Last 7 days</p>
              <p class="text-3xl font-bold">{{ formatLiters(waterConsumption.currentWeekLiters) }}</p>
              <p class="mt-1 text-sm" :class="comparisonPercent <= 0 ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'">
                {{ comparisonLabel }}
              </p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
              <p class="text-sm opacity-70">Historical weekly average</p>
              <p class="text-2xl font-semibold">{{ formatLiters(waterConsumption.historicalWeeklyAverageLiters) }}</p>
            </div>
            <div class="rounded-lg border border-border p-4">
              <p class="text-sm opacity-70">Cold water</p>
              <p class="text-xl font-semibold">{{ formatLiters(waterConsumption.coldLiters) }}</p>
            </div>
            <div class="rounded-lg border border-border p-4">
              <p class="text-sm opacity-70">Warm water</p>
              <p class="text-xl font-semibold">{{ formatLiters(waterConsumption.warmLiters) }}</p>
            </div>
          </div>
        </div>
        <p v-else class="rounded-lg bg-gray-50 p-6 text-center opacity-70 dark:bg-gray-800/60">
          No collected water readings are available for this floor yet.
        </p>
      </section>

      <div class="grid lg:grid-cols-[2fr_1fr] gap-4">

        <!-- MAIN CONTENT -->
        <main class="flex flex-col gap-4">

          <!-- News -->
          <section
            class="bg-surface dark:bg-surface-dark rounded-lg p-5"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">
                Community News
              </h2>

              <button
                @click="showNewsModal = true"
                class="text-accent hover:underline"
              >
                View All
              </button>
            </div>

            <div class="space-y-4">
              <article
                v-for="item in news"
                :key="item.id"
                class="border-b last:border-0 pb-3"
              >
                <h3 class="font-semibold">
                  {{ item.title }}
                </h3>

                <p class="text-sm opacity-70">
                  {{ item.date }}
                </p>

                <p>
                  {{ item.summary }}
                </p>
              </article>
            </div>
          </section>

          <!-- Events -->
          <section
            class="bg-surface dark:bg-surface-dark rounded-lg p-5"
          >
            <h2 class="text-xl font-semibold mb-4">
              Upcoming Events
            </h2>

            <div class="space-y-3">
              <button
                v-for="event in events"
                :key="event.eventID ?? event.id"
                type="button"
                @click="openEventDetails(event)"
                class="w-full flex justify-between items-center gap-4 rounded-md p-3 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
                :aria-label="`View details for ${event.title}`"
              >
                <div>
                  <span v-if="event.icon" class="mr-2">{{ event.icon }}</span>
                  {{ event.title }}
                </div>

                <span class="shrink-0 text-sm opacity-70">
                  {{ event.time || formatEventDate(event.startDate) }}
                </span>
              </button>
            </div>
          </section>

        </main>

        <!-- SIDEBAR -->
        <aside class="flex flex-col gap-4">

          <!-- Alerts -->
          <section
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-red-700 dark:text-red-400">
                Attention Required
              </h2>

              <span
                class="bg-red-600 text-white px-2 py-1 rounded-full text-xs"
              >
                {{ alerts.length }}
              </span>
            </div>

            <div class="space-y-3">
              <p
                v-if="!alerts.length"
                class="text-sm text-red-700 dark:text-red-300 opacity-80"
              >
                Nothing needs your attention right now.
              </p>

              <router-link
                v-for="alert in alerts"
                :key="alert.id"
                :to="alert.route || '/home'"
                class="block bg-surface dark:bg-surface-dark rounded-md p-3 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <h3 class="font-semibold">
                  {{ alert.title }}
                </h3>

                <p class="text-sm">
                  {{ alert.description }}
                </p>

                <p
                  v-if="alert.actionLabel"
                  class="mt-2 text-sm font-semibold text-red-700 dark:text-red-300"
                >
                  {{ alert.actionLabel }}
                </p>
              </router-link>
            </div>
          </section>

          <!-- Quick Actions -->
          <section
            class="bg-surface dark:bg-surface-dark rounded-lg p-5"
          >
          <h2>
              Quick Actions
            </h2>

            <div class="grid grid-cols-2 gap-3">

              <router-link
                v-for="action in quickActions"
                :key="action.route"
                :to="action.route"
                class="p-3 rounded-md bg-accent text-background-light text-center hover:opacity-90"
              >
                {{ action.label }}
              </router-link>

            </div>
          </section>

          <!-- Community Challenges -->
          <section
            class="bg-surface dark:bg-surface-dark rounded-lg p-5"
          >
            <h2>
              Community Challenges
            </h2>

            <div
              v-for="challenge in challenges"
              :key="challenge.id"
              class="mb-4 last:mb-0"
            >
              <h3 class="font-semibold">
                {{ challenge.title }}
              </h3>

              <p>
                {{ challenge.description }}
              </p>
            </div>
          </section>

          <!-- Surveys -->
          <section
            v-if="userSurveys.length"
            class="bg-surface dark:bg-surface-dark rounded-lg p-5"
          >

          <h2 class="text-xl font-semibold mb-4">
            Surveys
          </h2>


          <div
            v-for="survey in userSurveys"
            :key="survey.eID"
            class="mb-3 p-3 rounded-md bg-secondary cursor-pointer"
          >

          <h3 class="font-semibold">
          {{ survey.question }}
          </h3>


          <router-link
            :to="`/answerSurvey/${survey.eID}`"
            class="text-sm underline"
          >
          Answer
          </router-link>


          </div>

          </section>

        </aside>

      </div>
    </div>

    <!-- News Modal -->
    <ModalComponent v-model="showNewsModal">
      <div class="p-4">
        <h2 class="text-2xl font-bold mb-4">
          News & Updates
        </h2>

        <div
          v-for="item in news"
          :key="item.id"
          class="mb-6"
        >
          <h3 class="font-semibold">
            {{ item.title }}
          </h3>

          <p class="text-sm opacity-70 mb-2">
            {{ item.date }}
          </p>

          <p>
            {{ item.content }}
          </p>
        </div>
      </div>
    </ModalComponent>

    <!-- Event Details Modal -->
    <ModalComponent v-model="showEventModal">
      <div v-if="selectedEvent" class="space-y-4 p-4">
        <div>
          <h2 class="text-2xl font-bold">{{ selectedEvent.title }}</h2>
          <p v-if="selectedEvent.type" class="mt-1 text-sm uppercase opacity-70">
            {{ selectedEvent.type }}
          </p>
        </div>

        <p class="font-medium">
          {{ formatEventDateRange(selectedEvent.startDate, selectedEvent.endDate) || selectedEvent.time }}
        </p>

        <p class="whitespace-pre-line opacity-80">
          {{ selectedEvent.description || 'No additional information is available for this event.' }}
        </p>
      </div>
    </ModalComponent>

  </div>
</template>

<script setup lang="ts">
import NavComponent from '@/components/NavComponent.vue';
import FloorWaterChart from '@/components/FloorWaterChart.vue';
import { computed, onMounted, ref } from 'vue';

import { getSocket } from '@/composables/socket';
const socket = getSocket(); // Import the socket instance from socket.ts


import ModalComponent from '@/components/ModalComponent.vue';
import { type AlertItem, type NewsItem, type HomeEventItem, type ActivatedEventItem, type FloorWaterConsumption, type QuickActionItem, type ChallengeItem, type DashboardPayload, type MenuItem, type SurveyItem } from '@/types';

const isLoading = ref(true);
const username = ref("")
const room = ref<number | string>("")
const house = ref("")
const floor = ref<number | string>("")
const alerts = ref<AlertItem[]>([]);
const news = ref<NewsItem[]>([]);
const events = ref<HomeEventItem[]>([]);
const activatedEvents = ref<ActivatedEventItem[]>([]);
const waterConsumption = ref<FloorWaterConsumption>({ available: false, latestReadingAt: null, currentWeekLiters: 0, historicalWeeklyAverageLiters: 0, coldLiters: 0, warmLiters: 0, days: [] });
const quickActions = ref<QuickActionItem[]>([]);
const challenges = ref<ChallengeItem[]>([]);
const userSurveys = ref<SurveyItem[]>([]);

const menuType = ref('home');
socket.on('connect', () => {
  console.log('Connected to the server');
});

const showNewsModal = ref(false);
const showEventModal = ref(false);
const selectedEvent = ref<HomeEventItem | null>(null);
const navKey = ref(0); // Reactive key for NavComponent
const comparisonPercent = computed(() => waterConsumption.value.historicalWeeklyAverageLiters
  ? ((waterConsumption.value.currentWeekLiters - waterConsumption.value.historicalWeeklyAverageLiters) / waterConsumption.value.historicalWeeklyAverageLiters) * 100
  : 0)
const comparisonLabel = computed(() => {
  if (!waterConsumption.value.historicalWeeklyAverageLiters) return 'Historical comparison unavailable'
  const amount = Math.abs(comparisonPercent.value).toFixed(0)
  if (Math.abs(comparisonPercent.value) < 0.5) return 'About the same as average'
  return `${amount}% ${comparisonPercent.value < 0 ? 'below' : 'above'} average`
})
const formatLiters = (value: number) => `${Math.round(value).toLocaleString()} L`

const openEventDetails = (event: HomeEventItem) => {
  selectedEvent.value = event;
  showEventModal.value = true;
};

const formatEventDate = (dateString?: string) => {
  if (!dateString) return '';

  const date = new Date(dateString.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleString();
};

const formatEventDateRange = (start?: string, end?: string) => {
  if (!start) return '';
  if (!end) return formatEventDate(start);
  return `${formatEventDate(start)} — ${formatEventDate(end)}`;
};

const refreshNav = () => {
  navKey.value++; // Increment the key to force re-render
}

onMounted(() => {
  socket.emit("getMenuData", "en"); // Fetch menu items from server, switch between "sv" and "en" for desired language
  socket.on("menuData", (labels: Record<string, MenuItem[]>) => {
    localStorage.setItem("menuData", JSON.stringify(labels));
    refreshNav(); // Refresh NavComponent when new menu data is received
  });

  // Handle errors
  socket.on("error", (error: { message: string }) => {
    console.error("Error from server:", error.message);
  });

  // Handler for dashboard payload from server — always update refs and cache
  const DASHBOARD_CACHE_KEY = "dashboard";

  function saveDashboardCache(data: DashboardPayload) {
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  }

  function loadDashboardCache(): DashboardPayload | null {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  socket.on("dashboard", (dashboard: DashboardPayload) => {
    console.log("Received dashboard:", dashboard);

    username.value = dashboard.user.name;
    room.value = dashboard.user.room;
    house.value = dashboard.user.house;
    floor.value = dashboard.user.floor;

    alerts.value = dashboard.alerts;
    news.value = dashboard.news;
    events.value = dashboard.events;
    activatedEvents.value = dashboard.activatedEvents;
    waterConsumption.value = dashboard.waterConsumption;
    userSurveys.value = dashboard.pendingSurveys;

    saveDashboardCache(dashboard);
    isLoading.value = false;
  });

  const cached = loadDashboardCache();

  if (cached) {
    console.log("Loaded dashboard from cache");

    username.value = cached.user.name;
    room.value = cached.user.room;
    house.value = cached.user.house ?? `Dorm ${cached.user.corridor}`;
    floor.value = cached.user.floor ?? cached.user.corridor;

    alerts.value = cached.alerts;
    news.value = cached.news;
    events.value = cached.events;
    activatedEvents.value = cached.activatedEvents;
    waterConsumption.value = cached.waterConsumption ?? waterConsumption.value;
    userSurveys.value = cached.pendingSurveys
    isLoading.value = false;
  }

  socket.emit("getDashboard");

  }
);

</script>
