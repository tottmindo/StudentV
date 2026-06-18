```vue
<template>
  <div class="min-h-screen p-4 bg-background dark:bg-background-dark">
    <div class="flex flex-col gap-4">

      <!-- Header -->
      <header
        class="bg-secondary dark:bg-secondary-dark rounded-lg px-6 py-4 flex justify-between items-center"
      >
        <div>
          <h1 class="text-2xl font-bold text-text-headline">
            Welcome back, {{ user.name }}
          </h1>

          <p class="text-text dark:text-text-dark">
            Room {{ user.room }} • Corridor {{ user.corridor }}
          </p>
        </div>

        <NavComponent
          :key="navKey"
          :socket="socket"
          :menu="menuType"
        />
      </header>

      <div class="grid lg:grid-cols-[2fr_1fr] gap-4">

        <!-- MAIN CONTENT -->
        <main class="flex flex-col gap-4">

          <!-- News -->
          <section
            class="bg-secondary dark:bg-secondary-dark rounded-lg p-5"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">
                Community News
              </h2>

              <button
                @click="showNewsModal = true"
                class="text-primary hover:underline"
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
            class="bg-secondary dark:bg-secondary-dark rounded-lg p-5"
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
            class="bg-secondary dark:bg-secondary-dark rounded-lg p-5"
          >
            <h2 class="text-xl font-semibold mb-4">
              Sustainability Overview
            </h2>

            <div class="grid md:grid-cols-3 gap-4">

              <div
                v-for="stat in stats"
                :key="stat.id"
                class="bg-background dark:bg-background-dark rounded-lg p-4 text-center"
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
                class="bg-white dark:bg-slate-800 rounded-md p-3"
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
            class="bg-secondary dark:bg-secondary-dark rounded-lg p-5"
          >
            <h2 class="text-xl font-semibold mb-4">
              Quick Actions
            </h2>

            <div class="grid grid-cols-2 gap-3">

              <router-link
                v-for="action in quickActions"
                :key="action.route"
                :to="action.route"
                class="p-3 rounded-md bg-primary text-white text-center hover:opacity-90"
              >
                {{ action.label }}
              </router-link>

            </div>
          </section>

          <!-- Community Challenges -->
          <section
            class="bg-secondary dark:bg-secondary-dark rounded-lg p-5"
          >
            <h2 class="text-xl font-semibold mb-4">
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

import Swiper from 'swiper/bundle';
//import 'swiper/css/bundle';
import '@/assets/custom-swiper.css'
import ModalComponent from '@/components/ModalComponent.vue';

/*
|--------------------------------------------------------------------------
| User
|--------------------------------------------------------------------------
*/

const user = ref({
  name: "John Doe",
  room: 314,
  corridor: 5,
});

/*
|--------------------------------------------------------------------------
| Alerts
|--------------------------------------------------------------------------
*/

const alerts = ref([
  {
    id: 1,
    title: "Kitchen Cleaning Duty",
    description: "Your cleaning shift is scheduled for Thursday.",
  },
  {
    id: 2,
    title: "Laundry Booking Conflict",
    description: "Please confirm your reservation.",
  },
  {
    id: 3,
    title: "Maintenance Ticket Updated",
    description: "Your request has received a response.",
  },
]);

/*
|--------------------------------------------------------------------------
| News
|--------------------------------------------------------------------------
*/

const news = ref([
  {
    id: 1,
    title: "Fire Alarm Inspection",
    date: "June 25",
    summary: "Annual fire inspection.",
    content:
      "The annual fire inspection will take place between 12:00 and 16:30.",
  },
  {
    id: 2,
    title: "New Residents Arriving",
    date: "June 28",
    summary: "8 new students moving in.",
    content:
      "Please welcome the new residents joining Corridor 5.",
  },
]);

/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
*/

const events = ref([
  {
    id: 1,
    icon: "🍕",
    title: "Pizza Night",
    time: "Friday 18:00",
  },
  {
    id: 2,
    icon: "🎮",
    title: "Game Night",
    time: "Saturday 19:00",
  },
  {
    id: 3,
    icon: "🧹",
    title: "Community Cleaning Day",
    time: "Sunday 12:00",
  },
]);

/*
|--------------------------------------------------------------------------
| Stats
|--------------------------------------------------------------------------
*/

const stats = ref([
  {
    id: 1,
    label: "Avg Shower Time",
    value: "8m 12s",
  },
  {
    id: 2,
    label: "Water Usage",
    value: "1230L",
  },
  {
    id: 3,
    label: "Avg Water Temp",
    value: "25.7°C",
  },
]);

/*
|--------------------------------------------------------------------------
| Quick Actions
|--------------------------------------------------------------------------
*/

const quickActions = ref([
  {
    label: "Report Issue",
    route: "/maintenance",
  },
  {
    label: "Book Laundry",
    route: "/laundry",
  },
  {
    label: "Study Room",
    route: "/study-room",
  },
  {
    label: "Contact Admin",
    route: "/contact",
  },
]);

/*
|--------------------------------------------------------------------------
| Challenges
|--------------------------------------------------------------------------
*/

const challenges = ref([
  {
    id: 1,
    title: "Save Water This Week",
    description:
      "Reduce your average shower time by 1 minute.",
  },
  {
    id: 2,
    title: "Corridor Competition",
    description:
      "Corridor 5 is currently ranked #2 in water savings.",
  },
]);


const menuType = ref('home');
socket.on('connect', () => {
  console.log('Connected to the server');
});

const showNewsModal = ref(false);


type AlertItem = {
  id: number;
  title: string;
  description: string;
};

type NewsItem = {
  id: number;
  title: string;
  date: string;
  summary: string;
  content: string;
};

type EventItem = {
  id: number;
  icon: string;
  title: string;
  time: string;
};

type StatItem = {
  id: number;
  label: string;
  value: string;
};

type QuickActionItem = {
  label: string;
  route: string;
};

type ChallengeItem = {
  id: number;
  title: string;
  description: string;
};

type DashboardPayload = {
  user: {
    name: string;
    room: number;
    corridor: number;
  };
  alerts: AlertItem[];
  news: NewsItem[];
  events: EventItem[];
  stats: StatItem[];
  quickActions: QuickActionItem[];
  challenges: ChallengeItem[];
};

type MenuItem = {
  name: string;
  link: string;
};
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

  new Swiper('.challenges-swiper', {
    loop: true,
    autoplay: {
      delay: 15000,
      disableOnInteraction: false,
    },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  }) 

  new Swiper('.stats-swiper', {
    loop: true,
    autoplay: {
      delay: 15000,
      disableOnInteraction: false,
    },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  })
  /** Data form
  {
    "user": {},
    "alerts": [],
    "news": [],
    "events": [],
    "stats": [],
    "quickActions": [],
    "challenges": []
  }
   */
  socket.on("dashboard", (dashboard: DashboardPayload) => {
    user.value = dashboard.user;
    alerts.value = dashboard.alerts;
    news.value = dashboard.news;
    events.value = dashboard.events;
    stats.value = dashboard.stats;
    quickActions.value = dashboard.quickActions;
    challenges.value = dashboard.challenges;
  });


});

</script>
