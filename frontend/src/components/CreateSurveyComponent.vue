<template>
  <div class="max-w-4xl mx-auto flex flex-col gap-6">

    <!-- Form -->
    <form
      @submit.prevent="saveSurvey"
      class="order-2 bg-surface dark:bg-surface-dark rounded-lg p-6 shadow-sm"
    >

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-headline dark:text-text-dark">
          {{ t(props.survey ? 'surveyBuilder.edit' : 'surveyBuilder.create') }}
        </h2>

        <span
          v-if="props.survey"
          class="text-sm px-3 py-1 rounded-full bg-secondary dark:bg-secondary-dark"
        >
          #{{ props.survey.eID }}
        </span>
      </div>

      <div
        v-if="message"
        class="mb-5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3"
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
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700
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
            class="rounded-lg border border-gray-300 dark:border-gray-700
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
            class="w-full rounded-lg
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
        <div class="grid md:grid-cols-2 gap-4">

          <label
            class="flex items-center justify-between rounded-lg
                   bg-secondary dark:bg-secondary-dark
                   p-4 cursor-pointer"
          >
            <div>
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
              class="h-5 w-5"
            />
          </label>

          <label
            class="flex items-center justify-between rounded-lg
                   bg-secondary dark:bg-secondary-dark
                   p-4 cursor-pointer"
          >
            <div>
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
              class="h-5 w-5"
            />
          </label>

        </div>
        <!-- Answer Options -->
        <div
          v-if="multipleChoice"
          class="space-y-3"
        >
          <div class="flex items-center justify-between">
            <div>
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
              class="px-3 py-2 rounded-lg
                    bg-secondary dark:bg-secondary-dark
                    hover:opacity-90"
            >
              + {{ t('surveyBuilder.addOption') }}
            </button>
          </div>

          <div
            v-for="(option, index) in options"
            :key="option.eID ?? index"
            class="flex gap-2"
          >
            <input
              v-model="option.optiontext"
              type="text"
              :placeholder="t('surveyBuilder.optionPlaceholder')"
              :disabled="!!props.survey"
              class="flex-1 rounded-lg
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
              class="px-4 rounded-lg
                    bg-red-100 text-red-700
                    hover:bg-red-200"
            >
              {{ t('surveyBuilder.remove') }}
            </button>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-between items-center pt-4">

          <button
            v-if="props.survey"
            type="button"
            @click="deleteSurvey"
            class="px-5 py-2 rounded-lg
                   bg-red-600 text-white
                   hover:bg-red-700
                   transition-colors"
          >
            {{ t('surveyBuilder.delete') }}
          </button>

          <button
            type="submit"
            class="ml-auto px-6 py-2 rounded-lg
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
      class="order-1 bg-surface dark:bg-surface-dark rounded-lg p-6 shadow-sm"
    >
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold">
          {{ t('surveyBuilder.results') }}
        </h3>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <span class="rounded-full bg-secondary px-3 py-1 text-sm dark:bg-secondary-dark">
            {{ t('surveyBuilder.answerCount', { count: answers.length }) }}
          </span>
          <button type="button" class="rounded-lg border border-border-border px-3 py-2 text-sm font-bold transition hover:border-accent hover:text-accent" @click="downloadCSV">
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
          <div class="flex justify-between mb-1">
            <span class="font-medium">
              {{ option.optiontext }}
            </span>

            <span class="text-sm opacity-70">
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
          class="rounded-lg
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
import { apiUrl } from '@/composables/api';
import { getSocket } from '@/composables/socket'
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
