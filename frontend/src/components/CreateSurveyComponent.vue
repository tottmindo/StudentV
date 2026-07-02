<template>
  <div class="max-w-4xl mx-auto flex flex-col gap-6">

    <!-- Form -->
    <form
      @submit.prevent="saveSurvey"
      class="bg-surface dark:bg-surface-dark rounded-lg p-6 shadow-sm"
    >

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-headline dark:text-text-dark">
          {{ props.survey ? "Edit Survey" : "Create Survey" }}
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
            Survey Question
          </label>

          <input
            type="text"
            v-model="question"
            placeholder="Enter survey question..."
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-background-dark
                   px-4 py-3
                   focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <!-- Expiration -->
        <div>
          <label
            class="block text-sm font-semibold mb-2 text-text dark:text-text-dark"
          >
            Expiration Date
          </label>

          <input
            type="date"
            v-model="expiresAt"
            class="rounded-lg border border-gray-300 dark:border-gray-700
                   bg-white dark:bg-background-dark
                   px-4 py-3
                   focus:outline-none focus:ring-2 focus:ring-accent"
          />
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
                Active
              </p>

              <p class="text-sm opacity-70">
                Visible to students
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
                Multiple Choice
              </p>

              <p class="text-sm opacity-70">
                Enable predefined answer options
              </p>
            </div>

            <input
              type="checkbox"
              v-model="multipleChoice"
              class="h-5 w-5"
            />
          </label>

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
            Delete Survey
          </button>

          <button
            type="submit"
            class="ml-auto px-6 py-2 rounded-lg
                   bg-accent text-white font-semibold
                   hover:opacity-90 transition-opacity"
          >
            {{ props.survey ? "Save Changes" : "Create Survey" }}
          </button>

        </div>

      </div>

    </form>

    <!-- Answers -->
    <section
      v-if="props.survey"
      class="bg-surface dark:bg-surface-dark rounded-lg p-6 shadow-sm"
    >

      <div class="flex justify-between items-center mb-5">

        <h3 class="text-xl font-semibold">
          Survey Answers
        </h3>

        <span
          class="px-3 py-1 rounded-full bg-secondary dark:bg-secondary-dark text-sm"
        >
          {{ answers.length }}
        </span>

      </div>

      <div
        v-if="answers.length === 0"
        class="text-center py-10 opacity-60"
      >
        No answers have been submitted yet.
      </div>

      <div
        v-else
        class="space-y-3"
      >

        <div
          v-for="answer in answers"
          :key="answer.id"
          class="rounded-lg bg-secondary dark:bg-secondary-dark p-4"
        >
          {{ answer.answer }}
        </div>

      </div>

    </section>

  </div>
</template>


<script setup lang="ts">
import { getSocket } from '@/composables/socket'
import type { SurveyAnswer } from '@/types';
import { ref, watch } from 'vue';
import { useRouter } from "vue-router";

const router = useRouter();
const socket = getSocket();

    const oneMonthFromNow = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1)
        return date
    }

  const props = defineProps<{
    survey?:{
      eID: number,
      question: string;
      active: boolean;
      expiresAt: Date;
      multipleChoice: boolean;
    }
    }>();

    const eID = ref();
    const question = ref('');
    const active = ref(true);
    const expiresAt = ref(oneMonthFromNow());
    const multipleChoice = ref(false);


    watch(
      () => props.survey,
      (survey) => {

        if(survey){
          eID.value = survey.eID;
          question.value = survey.question;
          active.value = survey.active;
          expiresAt.value = survey.expiresAt;
          multipleChoice.value = survey.multipleChoice;

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
    const surveyData = {
      eID: props.survey?.eID,
      question: question.value,
      active: active.value,
      expiresAt: expiresAt.value,
      multipleChoice: multipleChoice.value
    }

    console.log("sending survey:", surveyData);
    console.log("socket connected:", socket.connected);
    const event = props.survey
      ? "updateSurvey"
      : "createSurvey"


    try {

      socket.emit(event, surveyData, (response:any) => {
          console.log("server response:", response)
        if (response?.error) {
          console.error("Survey error:", response.error)
          alert(response.error)
          return
        }

        message.value = props.survey
          ? "Survey updated!"
          : "Survey created!"

        if (!props.survey) {
          question.value = ""
          active.value = true
          multipleChoice.value = false
        }
      })

    } catch(err) {

      console.error("Failed to emit survey:", err)
      alert("Survey could not be created or edited")

    }
  }

  const deleteSurvey = () =>{
      
      if(!confirm("Delete this survey")){
        return;
      }

      socket.emit("deleteSurvey", props.survey?.eID, (response:any) =>{

        if (response.error){
          alert(response.error)
          return
        }

        if(response.success){
          router.push("/survey");
        }
      })
    }

  const answers = ref<SurveyAnswer[]>([]);
  const getAnswers = (eID: number) => {
    socket.emit("getAnswers", eID, (response: any) => {
      if (response.error) {
        console.error(response.error);
        return;
      }
      answers.value = response.answers;
    });
  };

</script>