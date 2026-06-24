<template>
    <form @submit.prevent="saveSurvey">
        <h2>
            {{ props.survey ? "Edit Survey" : "Create survey" }}
        </h2>

        <p v-if="message">
            {{ message }}
        </p>

        <label> 
            Question 
        </label>

        <input
            type="text"
            v-model="question"
            placeholder="Enter survey question"
        />

        <label>
            Active
        </label>

        <input
            type="checkbox"
            v-model="active"
        />

        <label>
            Expires at
        </label>

        <input
            type="date"
            v-model="expiresAt"
        />

        <label>
            Multiple choice
        </label>

        <input
            type="checkbox"
            v-model="multipleChoice"
        />

        <button type="submit">
            {{ props.survey ? "Save changes" : "Create survey" }}
        </button>
    </form>
    <button 
          v-if="props.survey"
          class="danger"
          @click="deleteSurvey">DELETE SURVEY</button>
</template>


<script setup lang="ts">
import { getSocket } from '@/composables/socket'
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
</script>