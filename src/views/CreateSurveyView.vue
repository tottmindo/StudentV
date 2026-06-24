<script setup>
import NavComponent from '@/components/NavComponent.vue'
import SurveyForm from '@/components/CreateSurveyComponent.vue'
import { ref } from 'vue'
import { getSocket } from '@/composables/socket'
import { useRoute } from "vue-router"
import { onMounted } from "vue"

const socket = getSocket();
const navMenuType = ref('home');
const route = useRoute();
const surveyID = route.params.id;
const survey = ref(null);

onMounted(()=>{
    if (surveyID){
        socket.emit("getSurvey", Number(surveyID))
    }

    socket.on("surveyData", (data) =>{
        console.log("recived survey", data)
        survey.value = data;
    })
});

</script>

<template>
    <NavComponent :socket="socket" :menu="navMenuType" class="fixed top-4 right-4 z-50" />
    <SurveyForm :survey="survey"/>
</template>

