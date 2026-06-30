```vue
<template>
  <div class="min-h-screen p-4 bg-background-light dark:bg-background-dark">
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
            Room {{ room }} • Corridor {{ corridor }}
          </p>
        </div>
      </header>

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
              <div
                v-for="event in events"
                :key="event.id"
                class="flex justify-between items-center"
              >
                <div>
                  <span class="mr-2">{{ event.icon }}</span>
                  {{ event.title }}
                </div>

                <span class="text-sm opacity-70">
                  {{ event.time }}
                </span>
              </div>
            </div>
          </section>

          <!-- Statistics -->
          <section
            class="bg-surface dark:bg-surface-dark rounded-lg p-5"
          >
            <h2 class="text-xl font-semibold mb-4">
              Sustainability Overview
            </h2>

            <div class="grid md:grid-cols-3 gap-4">

              <div
                v-for="stat in stats"
                :key="stat.id"
                class="bg-surface dark:bg-surface-dark rounded-lg p-4 text-center"
              >
                <h3 class="font-medium mb-2">
                  {{ stat.label }}
                </h3>

                <p class="text-4xl font-bold">
                  {{ stat.value }}
                </p>
              </div>

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
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="bg-surface dark:bg-surface-dark rounded-md p-3"
              >
                <h3 class="font-semibold">
                  {{ alert.title }}
                </h3>

                <p class="text-sm">
                  {{ alert.description }}
                </p>
              </div>
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

  </div>
</template>

<script setup lang="ts">
import NavComponent from '@/components/NavComponent.vue';
import {  onMounted, ref } from 'vue';

import { getSocket } from '@/composables/socket';
const socket = getSocket(); // Import the socket instance from socket.ts


import ModalComponent from '@/components/ModalComponent.vue';
import { type AlertItem, type NewsItem, type HomeEventItem, type ActivatedEventItem, type StatItem, type QuickActionItem, type ChallengeItem, type DashboardPayload, type MenuItem, type SurveyItem } from '@/types';

const username = ref("John Doe")
const room = ref(314)
const corridor = ref(5)
const alerts = ref<AlertItem[]>([]);
const news = ref<NewsItem[]>([]);
const events = ref<HomeEventItem[]>([]);
const activatedEvents = ref<ActivatedEventItem[]>([]);
const stats = ref<StatItem[]>([]);
const quickActions = ref<QuickActionItem[]>([]);
const challenges = ref<ChallengeItem[]>([]);
const userSurveys = ref<SurveyItem[]>([]);

const menuType = ref('home');
socket.on('connect', () => {
  console.log('Connected to the server');
});

const showNewsModal = ref(false);
const navKey = ref(0); // Reactive key for NavComponent

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
    corridor.value = dashboard.user.corridor;

    alerts.value = dashboard.alerts;
    news.value = dashboard.news;
    events.value = dashboard.events;
    activatedEvents.value = dashboard.activatedEvents;
    stats.value = dashboard.stats;
    userSurveys.value = dashboard.pendingSurveys;

    saveDashboardCache(dashboard);
  });

  const cached = loadDashboardCache();

  if (cached) {
    console.log("Loaded dashboard from cache");

    username.value = cached.user.name;
    room.value = cached.user.room;
    corridor.value = cached.user.corridor;

    alerts.value = cached.alerts;
    news.value = cached.news;
    events.value = cached.events;
    activatedEvents.value = cached.activatedEvents;
    stats.value = cached.stats;
    userSurveys.value = cached.pendingSurveys
  } else {
    socket.emit("getDashboard");
  }

  }
);

</script>
