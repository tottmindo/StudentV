
<template>

  <div class="max-w-3xl mx-auto p-6">
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-10 opacity-60"
    >
      {{ t('survey.loading') }}
    </div>
    <!-- Survey -->
    <div
      v-else-if="survey && !submitted"
      class="bg-surface dark:bg-surface-dark
             rounded-lg p-6 shadow-sm"
    >
      <!-- Header -->
      <div class="mb-6">
        <h1
          class="text-3xl font-bold
                 text-headline
                 dark:text-text-dark"
        >
          {{ survey.question }}
        </h1>
        <p class="text-sm opacity-60 mt-2">
          {{ t('survey.number', { id: survey.eID }) }}
        </p>
      </div>
      <!-- Answer -->
      <!-- Multiple choice -->
      <div
        v-if="survey.multipleChoice"
        class="space-y-4"
      >
        <label
          class="block text-sm font-semibold
                text-text dark:text-text-dark"
        >
          {{ t('survey.chooseAnswers') }}
        </label>

        <div class="space-y-3">

          <label
            v-for="option in survey.options"
            :key="option.eID"
            class="flex items-center gap-3
                  rounded-lg
                  bg-secondary
                  dark:bg-secondary-dark
                  p-4
                  cursor-pointer
                  hover:opacity-90"
          >

            <input
              type="checkbox"
              :value="option.eID"
              v-model="selectedOptions"
              class="h-5 w-5"
            />

            <span>
              {{ option.optiontext }}
            </span>

          </label>

        </div>
      </div>

      <!-- Free text -->
      <div
        v-else
        class="space-y-3"
      >
        <label
          class="block text-sm font-semibold
                text-text dark:text-text-dark"
        >
          {{ t('survey.yourAnswer') }}
        </label>

        <textarea
          v-model="answer"
          rows="6"
          :placeholder="t('survey.answerPlaceholder')"
          class="w-full rounded-lg
                border border-gray-300
                dark:border-gray-700
                bg-white
                dark:bg-background-dark
                px-4 py-3
                resize-none
                focus:outline-none
                focus:ring-2
                focus:ring-accent"
        />
      </div>
      <!-- Submit -->
      <div class="flex justify-end mt-6">

        <button
          @click="submitAnswer"
          class="px-6 py-2
                 rounded-lg
                 bg-accent
                 text-white
                 font-semibold
                 hover:opacity-90
                 transition"
        >
          {{ t('survey.submit') }}
        </button>
      </div>
    </div>
    <!-- Submitted -->
    <div
      v-else-if="submitted"
      class="bg-surface
             dark:bg-surface-dark
             rounded-lg
             p-6
             shadow-sm
             text-center"
    >
      <h2
        class="text-2xl
               font-bold
               text-headline
               dark:text-text-dark
               mb-3"
      >
        {{ t('survey.thanks') }}
      </h2>
      <p class="opacity-70">
        {{ t('survey.submitted') }}
      </p>
    </div>
    <!-- Error -->
    <div
      v-else
      class="text-center py-10 opacity-60"
    >
      {{ t('survey.notFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { getSocket } from "@/composables/socket"
import { useI18n } from 'vue-i18n'

const socket = getSocket()
const route = useRoute()
const { t } = useI18n()

const survey = ref<any>(null)
const answer = ref("")
const selectedOptions = ref<number[]>([])
const submitted = ref(false)
const loading = ref(true)


function handleSurvey(data: any) {
  console.log("Survey received", data)

  survey.value = data
  loading.value = false
}


function submitAnswer() {

  // Multiple choice
  if (survey.value.multipleChoice) {

    if (selectedOptions.value.length === 0) {
      alert(t('survey.selectOne'))
      return
    }

    socket.emit(
      "submitAnswer",
      survey.value.eID,
      null,
      selectedOptions.value,
      (response: any) => {

        if (response?.error) {
          alert(t('survey.submitError'))
          return
        }

        submitted.value = true
      }
    )

    return
  }

  // Free text
  if (!answer.value.trim()) {
    alert(t('survey.enterAnswer'))
    return
  }

  socket.emit(
    "submitAnswer",
    survey.value.eID,
    answer.value,
    [],
    (response: any) => {

      if (response?.error) {
        alert(t('survey.submitError'))
        return
      }

      submitted.value = true
    }
  )
}


onMounted(() => {

  const id = Number(route.params.id)

  socket.on(
    "surveyData",
    handleSurvey
  )

  socket.emit(
    "getSurvey",
    id
  )

})


onUnmounted(() => {

  socket.off(
    "surveyData",
    handleSurvey
  )

})

</script>
