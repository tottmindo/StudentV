<template>

  
  <div class="max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6">

    <!-- Filters -->
    <section
      class="bg-surface dark:bg-surface-dark
            rounded-lg p-4
            flex flex-col md:flex-row
            gap-4"
    >
      <!-- Status -->
      <div class="flex-1">
        <label class="block text-sm font-semibold mb-2">
          {{ t('survey.status') }}
        </label>

        <select
          v-model="statusFilter"
          class="w-full rounded-lg
                border border-gray-300 dark:border-gray-700
                bg-white dark:bg-background-dark
                px-4 py-2"
        >
          <option value="all">
            {{ t('survey.all') }}
          </option>

          <option value="active">
            {{ t('common.active') }}
          </option>

          <option value="inactive">
            {{ t('common.inactive') }}
          </option>
        </select>
      </div>

      <!-- Corridor -->
      <div class="flex-1">
        <label class="block text-sm font-semibold mb-2">
          {{ t('survey.corridor') }}
        </label>

        <select
          v-model="dormFilter"
          class="w-full rounded-lg
                border border-gray-300 dark:border-gray-700
                bg-white dark:bg-background-dark
                px-4 py-2"
        >
          <option :value="null">
            {{ t('survey.allCorridors') }}
          </option>

          <option
            v-for="dorm in dorms"
            :key="dorm.dormID"
            :value="dorm.dormID"
          >
            {{ dorm.address }} — {{ t('survey.floor', { floor: dorm.floor }) }}
          </option>
        </select>
      </div>
    </section>

    <!-- Survey List -->
    <section class="flex flex-col gap-3">

      <div
        v-for="survey in visibleSurveys"
        :key="survey.eID"
        @click="selectSurvey(survey.eID)"
        class="bg-surface dark:bg-surface-dark
               rounded-lg p-5
               cursor-pointer
               hover:opacity-90 hover:shadow-md
               transition"
      >

        <div class="flex items-start justify-between gap-4">

          <!-- Main content -->
          <div class="flex flex-col gap-1">

          <h3 class="text-lg font-semibold text-headline dark:text-text-dark">
            {{ survey.question }}
          </h3>

          <p class="text-sm opacity-70">
            {{ t('survey.id', { id: survey.eID }) }}
          </p>

          <p class="text-sm opacity-70">
            {{
              survey.dormID === null
                ? t('survey.allCorridors')
                : getDormName(survey.dormID)
            }}
          </p>

        </div>

          <!-- Status badge -->
          <div
            class="text-xs px-3 py-1 rounded-full font-semibold"
            :class="survey.active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'"
          >
            {{ t(survey.active ? 'common.active' : 'common.inactive') }}
          </div>

        </div>

      </div>

      <!-- Empty state -->
      <div
        v-if="visibleSurveys.length === 0"
        class="text-center py-10 opacity-60"
      >
        {{ t('survey.none') }}
      </div>

    </section>

    <!-- Pagination -->
    <section class="flex items-center justify-between">

      <button
        @click="prevPage"
        v-if="page > 0"
        class="px-4 py-2 rounded-lg bg-secondary dark:bg-secondary-dark hover:opacity-90"
      >
        {{ t('survey.previous') }}
      </button>

      <span class="text-sm opacity-70">
        {{ t('survey.page', { page: page + 1 }) }}
      </span>

      <button
        @click="nextPage"
        v-if="(page + 1) * limit < filteredSurveys.length"
        class="px-4 py-2 rounded-lg bg-secondary dark:bg-secondary-dark hover:opacity-90"
      >
        {{ t('survey.next') }}
      </button>

    </section>

  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { getSocket } from "@/composables/socket"
import { useRouter } from "vue-router"
import { apiUrl } from "@/composables/api";
import { useI18n } from 'vue-i18n'

const socket = getSocket();
const router = useRouter();
const { t } = useI18n()
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })

const surveys = ref<any[]>([]);
const statusFilter = ref<"all" | "active" | "inactive">("all");
const dormFilter = ref<number | null>(null);
const dorms = ref<any[]>([]);

const page = ref(0);
const limit = 10;

function getDormName(dormID: number) {
  const dorm = dorms.value.find(
    dorm => dorm.dormID === dormID
  );

  if (!dorm) {
    return t('survey.unknownCorridor');
  }

  return `${dorm.address} — ${t('survey.floor', { floor: dorm.floor })}`;
}

watch(
  [statusFilter, dormFilter],
  () => {
    page.value = 0;
  }
);

const filteredSurveys = computed(() => {
  return surveys.value.filter(survey => {

    const statusMatches =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" && survey.active) ||
      (statusFilter.value === "inactive" && !survey.active);

    const dormMatches =
      dormFilter.value === null ||
      survey.dormID === dormFilter.value;

    return statusMatches && dormMatches;
  });
});

const visibleSurveys = computed(() => {
  const start = page.value * limit;

  return filteredSurveys.value.slice(
    start,
    start + limit
  );
});

function nextPage() {
  page.value++;
}

function prevPage() {
  page.value--;
}

function getSurveys() {
  socket.emit("getSurveyAll");
}

function handleSurveys(data: any) {
  console.log("ALL SURVEYS:", data);

  const map = new Map()

  // Keep existing
  for (const s of surveys.value) {
    map.set(s.eID, s)
  }

  // Merge fresh data
  for (const s of data) {
    map.set(s.eID, s)
  }

  // Convert map to array and EXPLICITLY sort by newest first
  const mergedArray = Array.from(map.values());
  surveys.value = mergedArray.sort((a, b) => b.eID - a.eID);
}

const selectSurvey = (eID: number) => {
  router.push({
    name: "createSurvey",
    params: { id: eID }
  });
}

const handleSurveyUpdate = (updatedSurvey: any) => {
  if (!updatedSurvey || !updatedSurvey.eID) return;
  
  surveys.value = surveys.value.map(s => 
    s.eID === updatedSurvey.eID ? updatedSurvey : s
  );
}

async function loadDorms() {
  const response = await fetch(apiUrl('/api/auth/admin/dorms'), {
    headers: headers()
  });

  if (!response.ok) {
    throw new Error(t('survey.loadDormsError'));
  }

  dorms.value = await response.json();
}

const handleSurveyDelete = (payload: { eID: number }) => {
  if (!payload || !payload.eID) return;

  surveys.value = surveys.value.filter(s => s.eID !== payload.eID);
}

onMounted(() => {
  loadDorms();
  getSurveys();

  socket.on("allSurveys", handleSurveys);

  socket.on("surveyCreated", (survey) => {
    if (
      survey &&
      survey.eID &&
      !surveys.value.some(s => s?.eID === survey.eID)
    ) {
      surveys.value = [survey, ...surveys.value];
      page.value = 0;
    }
  });

  socket.on("surveyUpdated", handleSurveyUpdate);
  socket.on("surveyDeleted", handleSurveyDelete);
});

onUnmounted(() => {
    socket.off("allSurveys", handleSurveys);
    socket.off("surveyCreated");
    
    socket.off("surveyUpdated", handleSurveyUpdate);
    socket.off("surveyDeleted", handleSurveyDelete);
});



</script>
