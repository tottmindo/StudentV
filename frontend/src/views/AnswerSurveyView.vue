<script setup lang="ts">

import { ref, onMounted } from "vue"
import { useRoute } from "vue-router"
import { getSocket } from "@/composables/socket"


const socket = getSocket()
const route = useRoute()


const survey = ref<any>(null)
const answer = ref("")


onMounted(()=>{

  const id = Number(route.params.id)

  socket.emit(
    "getSurvey",
    id
  )


  socket.on(
    "surveyData",
    (data)=>{

      console.log("Survey received", data)

      survey.value = data

    }
  )

})


function submitAnswer(){

  socket.emit("submitAnswer", survey.value.eID, answer.value, (response:any)=>{

      if(response.error){
        alert(response.error)
        return
      }


      alert("Answer submitted!")

    })

}

</script>


<template>

<div v-if="survey">

<h1>
{{survey.question}}
</h1>


<textarea
v-model="answer"
placeholder="Your answer"
/>


<button @click="submitAnswer">
Submit
</button>


</div>


</template>