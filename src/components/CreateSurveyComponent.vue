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
</template>


<script setup lang="ts">
  import { ref } from 'vue';

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

  const question = ref(props.survey?.question ?? '');
  const active = ref(props.survey?.active ?? true);
  const expiresAt = ref(props.survey?.expiresAt ?? oneMonthFromNow());
  const multipleChoice = ref(props.survey?.multipleChoice ?? false);

  const message = ref("");

  const saveSurvey = async () => {
    const method = props.survey ? 'PUT' : 'POST';

    const url = props.survey
        ? `http://localhost:3000/api/surveys/${props.survey.eID}` //ELLER VAD ENDPOINTEN NU KOMMER BLI (UPPDATERA)
        : `http://localhost:3000/api/survey`; //SKAPA NY SURVEY

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.value,
          active: active.value,
          expiresAt: expiresAt.value,
          multipleChoice: multipleChoice.value
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : JSON.stringify(errorData.error || 'Login failed');
        throw new Error(errorMessage);
      }

    await response.json();
    
    message.value = props.survey
        ? "Survey updated!"
        : "Survey created!"
      
    if (!props.survey) {
        question.value = "";
        active.value = true;
        multipleChoice.value = false;
    }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Survey could not be created or edited';
      alert(errorMessage);
    }
  };
</script>