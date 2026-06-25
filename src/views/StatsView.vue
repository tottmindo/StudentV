<!--View where user can see more in-depth statisics of water consumption.
    Both pure data and graphs are available, and can be sorted by time.
    Can go in to "fullscreen view" of each graph etc.-->

<template>
    <div class="flex justify-center content-center space-x-2 mb-2 mt-1">
        <button
            v-for="option in contentOptions"
            :key="option.value"
            @click="selectedContent = option.value"
            class="items-center gap-2 cursor-pointer py-2 px-4 rounded-xl font-semibold transition-colors duration-300"
            :class="selectedContent === option.value
                ? 'bg-accent text-background-light dark:bg-accent-dark'
                : 'bg-surface dark:bg-surface-dark text-text dark:text-text-dark hover:bg-accent-dark dark:hover:bg-accent'"
        >
            {{ option.label }}
        </button>
    </div>
    <NavComponent :menu="navMenuType" :socket="socket" class="fixed top-4 right-4"/>
    
        <!-- Main Content Area -->
        <div class="p-4 overflow-y-auto space-y-6">
        <div v-if="selectedContent === 'hourly'">
            <p class="text-lg font-semibold mb-2">Hourly Stats</p>
            <div class="grid gap-4" :class="['grid-cols-[35%_35%_25%]','grid-rows-[150px_150px_150px]']">
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-1 row-start-1 text dark:text-text-dark text-center">
                    Total water consumption
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-2 row-start-1 text dark:text-text-dark text-center">
                    Total warm water consumption
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-1 text dark:text-text-dark text-center">
                    Total cold water consumption
                </div>

                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-2 text dark:text-text-dark text-center">
                    Average shower time
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-3 text dark:text-text-dark text-center">
                    You could have saved this many bananas
                </div>
            </div>
        </div>
    
        <div v-else-if="selectedContent === 'daily'">
            <p class="text-lg font-semibold mb-2">Daily Stats</p>
            <div
                class="grid gap-4"
                :class="['grid-cols-[35%_35%_25%]','grid-rows-[150px_150px_150px]']"
            >
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-1 row-start-1 text-text dark:text-text-dark text-center">
                <p>Total water consumption</p>
                <div class="text-6xl justify-center mt-4">500 litres</div>
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-2 row-start-1 text-text dark:text-text-dark text-center">
                <p>Total warm water consumption</p>
                <div class="text-6xl justify-center mt-4">500 litres</div>
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-1 text-text dark:text-text-dark text-center">
                Total cold water consumption
                <div class="flex-1 flex items-center justify-center">
                    <span class="text-5xl mt-6">1000 litres</span>
                </div>
                </div>


    

                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-2 text-text dark:text-text-dark text-center">
                Average shower time
                <div class="text-5xl justify-center mt-6">8m 15s</div>
                </div>

                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-3 text-text dark:text-text-dark text-center">
                You could have saved this many bananas
                <div class="text-5xl justify-center mt-6">7,000,000</div>
                </div>
            </div>
        </div>
    
        <div v-else-if="selectedContent === 'weekly'">
            <p class="text-lg font-semibold mb-2">Weekly Stats</p>
            <div class="grid gap-4" :class="['grid-cols-[35%_35%_25%]','grid-rows-[150px_150px_150px]']">
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-1 row-start-1 text dark:text-text-dark text-center">
                    Total water consumption
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-2 row-start-1 text dark:text-text-dark text-center">
                    Total warm water consumption
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-1 text dark:text-text-dark text-center">
                    Total cold water consumption
                </div>


                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-2 text dark:text-text-dark text-center">
                Average shower time
                </div>

                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-3 text dark:text-text-dark text-center">
                You could have saved this many bananas
                </div>
            </div>
        </div>
    
        <div v-else-if="selectedContent === 'monthly'">
            <p class="text-lg font-semibold mb-2">Monthly Stats</p>
            <div
                class="grid gap-4"
                :class="['grid-cols-[35%_35%_25%]','grid-rows-[150px_150px_150px]']">
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-1 row-start-1 text dark:text-text-dark text-center">
                    Total water consumption
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-2 row-start-1 text dark:text-text-dark text-center">
                    Total warm water consumption
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-1 text dark:text-text-dark text-center">
                    Total cold water consumption
                </div>

                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-2 text dark:text-text-dark text-center">
                    Average shower time
                </div>
                <div class="bg-surface dark:bg-surface-dark rounded-md col-start-3 row-start-3 text dark:text-text-dark text-center">
                    You could have saved this many bananas
                </div>
            </div>
        </div>
    
        <div v-else>
            <p class="text-lg">Please select a time range</p>
        </div>
        </div>
        <ModalComponent v-model="showTotGraphModal">
            I LOVE GRAPHS
        </ModalComponent>
        <ModalComponent v-model="showWarmGraphModal">
            HOT
        </ModalComponent>
    </template>
    
    <script setup lang="ts">
    //interface DailyConsumption {
    //    date: string;
    //    amount: number;
    //}


    import { ref, onMounted, computed } from 'vue';
    import NavComponent from '@/components/NavComponent.vue';
    import { getSocket } from '@/composables/socket';
    import { Chart, registerables } from 'chart.js';
    import 'chartjs-adapter-date-fns';
    import ModalComponent from '@/components/ModalComponent.vue';


    Chart.register(...registerables);

    const showWarmGraphModal = ref(false);
    const showTotGraphModal = ref(false);
    const navMenuType = ref('home');
    const selectedContent = ref<'hourly' | 'daily' | 'weekly' | 'monthly'> ('daily');

    const socket = getSocket(); // Import the socket instance from socket.ts



    const computedTimeRangeHourly = computed(() => 24);
    const computedTimeRangeDaily = computed(() => 24*7);
    const computedTimeRangeWeekly = computed(() => 24*30);
    const computedTimeRangeMonthly = computed(() => 24*90);

    const contentOptions = [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' }
    ] as const;

    let totChart: Chart|null = null;
    let warmChart: Chart|null = null;

    
    </script>
    
    <style scoped>

    </style>
