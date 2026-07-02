<template>
  <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4 z-50"/>

  
  <div class="max-w-5xl mx-auto flex flex-col gap-6">

    <!-- Header -->
    <section class="bg-surface dark:bg-surface-dark rounded-lg p-6">
      <div class="flex items-center justify-between">

        <h2 class="text-2xl font-bold text-headline dark:text-text-dark">
          Surveys
        </h2>

        <span class="text-sm opacity-70">
          Total: {{ surveys.length }}
        </span>

      </div>
        <button
          class="fixed bottom-6 right-6
                w-14 h-14 rounded-full
                bg-accent text-white text-3xl
                flex items-center justify-center
                shadow-lg hover:opacity-90"
          @click="showCreateModal = true"
        >
          +
      </button>
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
              ID: {{ survey.eID }}
            </p>

          </div>

          <!-- Status badge -->
          <div
            class="text-xs px-3 py-1 rounded-full font-semibold"
            :class="survey.active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'"
          >
            {{ survey.active ? 'Active' : 'Inactive' }}
          </div>

        </div>

      </div>

      <!-- Empty state -->
      <div
        v-if="visibleSurveys.length === 0"
        class="text-center py-10 opacity-60"
      >
        No surveys found.
      </div>

    </section>

    <!-- Pagination -->
    <section class="flex items-center justify-between">

      <button
        @click="prevPage"
        v-if="page > 0"
        class="px-4 py-2 rounded-lg bg-secondary dark:bg-secondary-dark hover:opacity-90"
      >
        Previous
      </button>

      <span class="text-sm opacity-70">
        Page {{ page + 1 }}
      </span>

      <button
        @click="nextPage"
        v-if="page * limit < surveys.length"
        class="px-4 py-2 rounded-lg bg-secondary dark:bg-secondary-dark hover:opacity-90"
      >
        Next
      </button>

    </section>

  </div>
  <ModalComponent v-model="showCreateModal">
    <SurveyForm />
  </ModalComponent>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { getSocket } from "@/composables/socket"
import { useRouter } from "vue-router"
import ModalComponent from "@/components/ModalComponent.vue"
import SurveyForm from "@/components/CreateSurveyComponent.vue"
import NavComponent from "@/components/NavComponent.vue"

const socket = getSocket();
const router = useRouter();
const navMenuType = ref('home');

const surveys = ref<any[]>([]);
const showCreateModal = ref(false);

const page = ref(0);
const limit = 10;

const visibleSurveys = computed(() => {
  const start = page.value * limit;
  return surveys.value.slice(start, start + limit);
})

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

const handleSurveyDelete = (payload: { eID: number }) => {
  if (!payload || !payload.eID) return;

  surveys.value = surveys.value.filter(s => s.eID !== payload.eID);
}

onMounted(() => {
getSurveys();
  socket.on("allSurveys", handleSurveys);

  socket.on("surveyCreated", (survey) => {
    if (survey && survey.eID && !surveys.value.some(s => s?.eID === survey.eID)) {
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