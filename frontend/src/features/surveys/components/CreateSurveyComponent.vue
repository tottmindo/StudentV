<template>
  <div class="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-4 sm:gap-6">

    <!-- Form -->
    <form
      @submit.prevent="saveSurvey"
      class="order-2 min-w-0 max-w-full rounded-lg bg-surface p-4 shadow-sm dark:bg-surface-dark sm:p-6"
    >

      <div class="mb-6 flex min-w-0 items-start justify-between gap-3">
        <h2 class="min-w-0 pr-8 text-xl font-bold leading-tight text-headline [overflow-wrap:anywhere] dark:text-text-dark sm:pr-12 sm:text-2xl">
          {{ t(props.survey ? 'surveyBuilder.edit' : 'surveyBuilder.create') }}
        </h2>

        <span
          v-if="props.survey"
          class="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm dark:bg-secondary-dark"
        >
          #{{ props.survey.eID }}
        </span>
      </div>

      <div
        v-if="message"
        class="mb-5 rounded-lg bg-green-100 px-4 py-3 text-green-700 [overflow-wrap:anywhere] dark:bg-green-900/30 dark:text-green-300"
      >
        {{ message }}
      </div>

      <div class="space-y-6">

        <!-- Question -->
        <div>
          <label
            class="block text-sm font-semibold mb-2 text-text dark:text-text-dark"
          >
            {{ t('surveyBuilder.question') }}
          </label>

          <input
            type="text"
            v-model="question"
            :placeholder="t('surveyBuilder.questionPlaceholder')"
            :disabled="!!props.survey"
            class="w-full min-w-0 max-w-full rounded-lg border border-gray-300 dark:border-gray-700
                  bg-white dark:bg-background-dark
                  px-4 py-3
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <!-- Expiration -->
        <div>
          <label
            class="block text-sm font-semibold mb-2 text-text dark:text-text-dark"
          >
            {{ t('surveyBuilder.expiration') }}
          </label>

          <input
            type="date"
            v-model="expiresAt"
            :disabled="!!props.survey"
            class="w-full min-w-0 max-w-full rounded-lg border border-gray-300 dark:border-gray-700 sm:w-auto
                  bg-white dark:bg-background-dark
                  px-4 py-3
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <!-- Target Corridor -->
        <div>
          <label
            class="block text-sm font-semibold mb-2 text-text dark:text-text-dark"
          >
            {{ t('surveyBuilder.audience') }}
          </label>

          <select
            v-model="selectedDorm"
            :disabled="!!props.survey"
            class="w-full min-w-0 max-w-full rounded-lg
                  border border-gray-300 dark:border-gray-700
                  bg-white dark:bg-background-dark
                  px-4 py-3
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option :value="null">
              {{ t('survey.allCorridors') }}
            </option>

            <option
              v-for="dorm in dorms"
              :key="dorm.dormID"
              :value="dorm.dormID"
            >
              {{ t('common.houseLabel', { house: dorm.address }) }} — {{ t('survey.floor', { floor: dorm.floor }) }}
            </option>
          </select>

          <p class="text-sm opacity-60 mt-2">
            {{ t('surveyBuilder.audienceHelp') }}
          </p>
        </div>
        <!-- Settings -->
        <div class="grid min-w-0 gap-4 md:grid-cols-2">

          <label
            class="flex min-w-0 items-center justify-between gap-3 rounded-lg
                   bg-secondary dark:bg-secondary-dark
                   p-4 cursor-pointer"
          >
            <div class="min-w-0 [overflow-wrap:anywhere]">
              <p class="font-semibold">
                {{ t('common.active') }}
              </p>

              <p class="text-sm opacity-70">
                {{ t('surveyBuilder.visible') }}
              </p>
            </div>

            <input
              type="checkbox"
              v-model="active"
              class="h-5 w-5 shrink-0"
            />
          </label>

          <label
            class="flex min-w-0 items-center justify-between gap-3 rounded-lg
                   bg-secondary dark:bg-secondary-dark
                   p-4 cursor-pointer"
          >
            <div class="min-w-0 [overflow-wrap:anywhere]">
              <p class="font-semibold">
                {{ t('surveyBuilder.multipleChoice') }}
              </p>

              <p class="text-sm opacity-70">
                {{ t('surveyBuilder.multipleChoiceHelp') }}
              </p>
            </div>

            <input
              type="checkbox"
              v-model="multipleChoice"
              :disabled="!!props.survey"
              class="h-5 w-5 shrink-0"
            />
          </label>

        </div>
        <!-- Answer Options -->
        <div
          v-if="multipleChoice"
          class="space-y-3"
        >
          <div class="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 [overflow-wrap:anywhere]">
              <h3 class="font-semibold">
                {{ t('surveyBuilder.answerOptions') }}
              </h3>

              <p class="text-sm opacity-70">
                {{ t('surveyBuilder.answerOptionsHelp') }}
              </p>
            </div>

            <button
              v-if="!props.survey"
              type="button"
              @click="options.push({ optiontext: '' })"
              class="w-full max-w-full whitespace-normal rounded-lg px-3 py-2 leading-snug [overflow-wrap:anywhere] sm:w-auto sm:shrink-0
                    bg-secondary dark:bg-secondary-dark
                    hover:opacity-90"
            >
              + {{ t('surveyBuilder.addOption') }}
            </button>
          </div>

          <div
            v-for="(option, index) in options"
            :key="option.eID ?? index"
            class="flex min-w-0 flex-col gap-2 sm:flex-row"
          >
            <input
              v-model="option.optiontext"
              type="text"
              :placeholder="t('surveyBuilder.optionPlaceholder')"
              :disabled="!!props.survey"
              class="w-full min-w-0 max-w-full flex-1 rounded-lg
                    border border-gray-300 dark:border-gray-700
                    bg-white dark:bg-background-dark
                    px-4 py-3
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <button
              v-if="!props.survey"
              type="button"
              @click="options.splice(index, 1)"
              class="w-full max-w-full whitespace-normal rounded-lg px-4 py-2 leading-snug [overflow-wrap:anywhere] sm:w-auto sm:shrink-0
                    bg-red-100 text-red-700
                    hover:bg-red-200"
            >
              {{ t('surveyBuilder.remove') }}
            </button>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">

          <button
            v-if="props.survey"
            type="button"
            @click="deleteSurvey"
            class="w-full max-w-full whitespace-normal rounded-lg px-5 py-2 leading-snug [overflow-wrap:anywhere] sm:w-auto
                   bg-red-600 text-white
                   hover:bg-red-700
                   transition-colors"
          >
            {{ t('surveyBuilder.delete') }}
          </button>

          <button
            type="submit"
            class="w-full max-w-full whitespace-normal rounded-lg px-6 py-2 leading-snug [overflow-wrap:anywhere] sm:ml-auto sm:w-auto
                   bg-accent text-white font-semibold
                   hover:opacity-90 transition-opacity"
          >
            {{ t(props.survey ? 'surveyBuilder.saveChanges' : 'surveyBuilder.create') }}
          </button>

        </div>

      </div>

    </form>

    <!-- Answers -->
    <section
      v-if="props.survey"
      class="order-1 min-w-0 max-w-full rounded-lg bg-surface p-4 shadow-sm dark:bg-surface-dark sm:p-6"
    >
      <!-- Header -->
      <div class="mb-6 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="min-w-0 text-lg font-semibold leading-tight [overflow-wrap:anywhere] sm:text-xl">
          {{ t('surveyBuilder.results') }}
        </h3>

        <div class="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <span class="max-w-full rounded-full bg-secondary px-3 py-1 text-center text-sm [overflow-wrap:anywhere] dark:bg-secondary-dark">
            {{ t('surveyBuilder.answerCount', { count: answers.length }) }}
          </span>
          <button type="button" class="max-w-full whitespace-normal rounded-lg border border-border-border px-3 py-2 text-sm font-bold leading-snug [overflow-wrap:anywhere] transition hover:border-accent hover:text-accent" @click="downloadCSV">
            ↓ {{ t('surveyBuilder.downloadCsv') }}
          </button>
        </div>
      </div>

      <!-- No answers -->
      <div
        v-if="answers.length === 0"
        class="text-center py-10 opacity-60"
      >
        {{ t('surveyBuilder.noAnswers') }}
      </div>

      <!-- Multiple choice results -->
      <div
        v-else-if="props.survey.multipleChoice"
        class="space-y-5"
      >
        <div
          v-for="option in optionCounts"
          :key="option.optionid"
        >
          <!-- Option name + count -->
          <div class="mb-1 flex min-w-0 items-start justify-between gap-3">
            <span class="min-w-0 font-medium [overflow-wrap:anywhere]">
              {{ option.optiontext }}
            </span>

            <span class="shrink-0 text-sm opacity-70">
              {{ option.count }}
            </span>
          </div>

          <!-- Bar -->
          <div
            class="w-full h-8 rounded-lg
                  bg-secondary dark:bg-secondary-dark
                  overflow-hidden"
          >
            <div
              class="h-full bg-accent rounded-lg transition-all"
              :style="{
                width: `${answers.length
                  ? (option.count / answers.length) * 100
                  : 0}%`
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Free text results -->
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="answer in answers"
          :key="answer.answerid"
          class="max-w-full rounded-lg [overflow-wrap:anywhere]
                bg-secondary dark:bg-secondary-dark
                p-4"
        >
          {{ answer.answer }}
        </div>
      </div>
    </section>

  </div>
</template>


<script setup lang="ts">
import { apiUrl } from '@/shared/composables/api';
import { getSocket } from '@/shared/composables/socket'
import type { SurveyAnswer } from '@/types';
import { ref, watch, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{ deleted: [id: number]; created: [survey: any] }>()
const { t } = useI18n()
const socket = getSocket();
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${sessionStorage.getItem('authToken')}` })

    const formatDateInput = (value: Date | string) => {
      if (typeof value === 'string') {
        const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
        if (datePart) return datePart
      }
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const oneMonthFromNow = () => {
      const date = new Date()
      date.setMonth(date.getMonth() + 1)
      return formatDateInput(date)
    }

  const props = defineProps<{
    survey?: {
      eID: number,
      question: string;
      active: boolean;
      expiresAt: Date | string;
      multipleChoice: boolean;
      dormID: number | null;
      options: {
        eID: number;
        optiontext: string;
      }[];
    }
    }>();

    const eID = ref();
    const question = ref('');
    const active = ref(true);
    const expiresAt = ref(oneMonthFromNow());
    const multipleChoice = ref(false);
    const options = ref<{ eID?: number; optiontext: string }[]>([]);
    const dorms = ref<any[]>([]);
    const selectedDorm = ref<number | null>(null);


    watch(
      () => props.survey,
      (survey) => {

      if (survey) {
        eID.value = survey.eID;
        question.value = survey.question;
        active.value = survey.active;
        expiresAt.value = formatDateInput(survey.expiresAt);
        multipleChoice.value = survey.multipleChoice;
        selectedDorm.value = survey.dormID;

        options.value = survey.options ?? [];

        getAnswers(survey.eID);
      }
      },
      {
        immediate: true
      }
    )

  const message = ref("");

  const saveSurvey = () => {
    console.log("saveSurvey fired")

    const surveyData = props.survey
      ? {
          eID: props.survey.eID,
          active: active.value
        }
      : {
          question: question.value,
          active: active.value,
          expiresAt: expiresAt.value,
          multipleChoice: multipleChoice.value,
          options: multipleChoice.value ? options.value : [],
          dormID: selectedDorm.value
        }

    console.log("sending survey:", surveyData)
    console.log("socket connected:", socket.connected)

    const event = props.survey
      ? "updateSurvey"
      : "createSurvey"

    try {
      socket.emit(event, surveyData, (response: any) => {

        console.log("server response:", response)

        if (response?.error) {
          console.error("Survey error:", response.error)
          alert(t('surveyBuilder.saveError'))
          return
        }

        message.value = props.survey
          ? t('surveyBuilder.updated')
          : t('surveyBuilder.created')

        if (!props.survey) {
          emit('created', response)
          question.value = ""
          active.value = true
          multipleChoice.value = false
          options.value = []
        }
      })

    } catch (err) {

      console.error("Failed to emit survey:", err)
      alert(t('surveyBuilder.saveError'))

    }
  }

  const deleteSurvey = () =>{
      
      if(!confirm(t('surveyBuilder.deleteConfirm'))){
        return;
      }

      socket.emit("deleteSurvey", props.survey?.eID, (response:any) =>{

        if (response.error){
          alert(t('surveyBuilder.deleteError'))
          return
        }

        if(response.success){
          const deletedID = props.survey?.eID
          if (deletedID) emit('deleted', deletedID)
        }
      })
    }

  const answers = ref<SurveyAnswer[]>([]);
  const optionCounts = computed(() => {
    if (!props.survey?.options) {
      return [];
    }

    const counts = new Map<number, number>();

    // Börja med alla alternativ på 0 röster
    for (const option of props.survey.options) {
      counts.set(option.eID, 0);
    }

    // Räkna faktiska svar
    for (const answer of answers.value) {
      for (const option of answer.options ?? []) {
        counts.set(
          option.optionid,
          (counts.get(option.optionid) ?? 0) + 1
        );
      }
    }

    // Returnera ALLA alternativ, även de med 0 röster
    return props.survey.options.map((option: any) => ({
      optionid: option.eID,
      optiontext: option.optiontext,
      count: counts.get(option.eID) ?? 0
    }));
  });

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? '' : String(value)
  // Prevent spreadsheet software from interpreting exported content as a formula.
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

function downloadCSV() {
  if (!props.survey) return
  const columns = ['survey_id', 'question', 'answer_id', 'user_id', 'answered_at', 'answer', 'selected_options']
  const rows = answers.value.map(answer => [
    props.survey?.eID,
    props.survey?.question,
    answer.answerid,
    answer.userid,
    answer.answeredat,
    answer.answer,
    (answer.options ?? []).map(option => option.optiontext).join('; ')
  ])
  const csv = [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `survey-${props.survey.eID}-results.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function getAnswers(eID: number) {

  console.log("getAnswers called with:", eID);

  socket.emit("getAnswers", eID, (response: any) => {

    console.log("getAnswers response:", response);

    if (response.error) {
      console.error(response.error);
      return;
    }

    console.log("Answers received:", response);

    answers.value = response.answers;
  });
}

async function loadDorms() {
  const response = await fetch(apiUrl('/api/auth/admin/dorms'), {
    headers: headers()
  });

  if (!response.ok) throw new Error(t('survey.loadDormsError'));

  dorms.value = await response.json();
}

  onMounted(() => {
    loadDorms();
  });

</script>
