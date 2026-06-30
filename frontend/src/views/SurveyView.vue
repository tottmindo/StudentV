<template>
    
  <div>

    <h2>Surveys</h2>

    <div
        v-for="survey in visibleSurveys"
        :key="survey.eID"
        @click="selectSurvey(survey.eID)"
        class="border p-4 mb-2 cursor-pointer"
    >

  <h3>
    {{ survey.question }}
  </h3>

  <p>
    Active: {{ survey.active }}
  </p>

</div>

    <button
        @click="prevPage"
        v-if="page > 0"
    >Previous
    </button>

    <button
      @click="nextPage"
      v-if="page * limit < surveys.length"
    >
      Next
    </button>

  </div>
</template>


<script setup lang="ts">

import { ref, computed, onMounted, onUnmounted } from "vue"
import { getSocket } from "@/composables/socket"
import { useRouter } from "vue-router"


const socket = getSocket();
const router = useRouter();

const surveys = ref<any[]>([])

const page = ref(0)
const limit = 10


const visibleSurveys = computed(() => {

  const start = page.value * limit

  return surveys.value.slice(
    start,
    start + limit
  )

})


function nextPage(){

  page.value++

}

function prevPage(){
    page.value--;
}


function getSurveys(){

  socket.emit("getSurveyAll")

}


function handleSurveys(data:any){

  console.log("received surveys:", data)

  surveys.value = data

}

const selectSurvey = (eID:number) => {
    router.push({
        name: "createSurvey",
        params: {
        id: eID
        }
    })
}

onMounted(()=>{

  getSurveys();

  socket.on(
    "allSurveys",
    handleSurveys
  )

})


onUnmounted(()=>{

  socket.off(
    "allSurveys",
    handleSurveys
  )

})


</script>