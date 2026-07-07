
<template>

  <div class="max-w-3xl mx-auto p-6">
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-10 opacity-60"
    >
      Loading survey...
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
          Survey #{{ survey.eID }}
        </p>
      </div>
      <!-- Answer -->
      <div class="space-y-3">
        <label
          class="block text-sm font-semibold
                 text-text dark:text-text-dark"
        >
          Your answer
        </label>
        <textarea
          v-model="answer"
          rows="6"
          placeholder="Write your answer..."
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
          Submit Answer
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
        Thank you!
      </h2>
      <p class="opacity-70">
        Your answer has been submitted successfully.
      </p>
    </div>
    <!-- Error -->
    <div
      v-else
      class="text-center py-10 opacity-60"
    >
      Survey not found.
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { getSocket } from "@/composables/socket"

const socket = getSocket()
const route = useRoute()

const survey = ref<any>(null)
const answer = ref("")
const submitted = ref(false)
const loading = ref(true)


function handleSurvey(data: any) {
  console.log("Survey received", data)

  survey.value = data
  loading.value = false
}


function submitAnswer() {

  if (!answer.value.trim()) {
    alert("Please enter an answer")
    return
  }

  socket.emit(
    "submitAnswer",
    survey.value.eID,
    answer.value,
    (response: any) => {

      if (response?.error) {
        alert(response.error)
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

