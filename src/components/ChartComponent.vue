<template>
    <div class="w-full h-60 relative">
        <canvas :id="chartId"></canvas>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch , onMounted, onBeforeUnmount, computed } from 'vue';
    import { Chart, registerables } from 'chart.js';
    import 'chartjs-adapter-date-fns';
    import type { ConsumptionData } from '@/types';

    Chart.register(...registerables);

    

    const props = defineProps<{
        chartId: string;
        datasetLabel: string;
        rawData: ConsumptionData[];
        timeRange: number;
    }>();


    
    let chart: Chart<'line', ConsumptionData[]> | null = null;
    
    const timeUnit = computed<'hour' | 'day' | 'week' | 'month'>(() => {
        if (props.timeRange <= 24) {
            return 'hour';
        } else if (props.timeRange <= 24*7) {
            return 'day';
        } else if (props.timeRange <= 24*30) {
            return 'week';
        } else {
            return 'month';
        }
    });

    const displayFormats = {
        hour: 'HH:mm',
        day: 'yyyy-MM-dd',
        week: "yyyy-'W'II",
        month: 'yyyy-MM'
    };

    const tooltipFormats = {
        hour: 'HH:mm',
        day: 'yyyy-MM-dd',
        week: "yyyy-'W'II",
        month: 'yyyy-MM'
    };

    function initChart() {
        const ctx = (document.getElementById(props.chartId) as HTMLCanvasElement).getContext('2d')!;
        if (chart) chart.destroy();
        const now = Date.now();
        const windowStart = now - props.timeRange * 3600e3;

        const filtered: ConsumptionData[] = props.rawData.filter(p => {
            return new Date(p.x).getTime() >= windowStart;
        });

        chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [{
                label: props.datasetLabel,
                data: filtered,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
                borderWidth: 2,
            }]},
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            parser: "yyyy-MM-dd'T'HH:mm:ssXXX",
                            unit: timeUnit.value,
                            displayFormats: {[timeUnit.value]: displayFormats[timeUnit.value]},
                            tooltipFormat: tooltipFormats[timeUnit.value]
                        },
                        min: windowStart,
                        max: now,
                        title: {
                            display: true,
                            text: (() => {
                                switch (timeUnit.value) {
                                    case 'hour': return 'Time (hour)';
                                    case 'day': return 'Date';
                                    case 'week': return 'Week';
                                    case 'month': return 'Month';
                                }
                            })()}
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMin: 0,
                        title: {display:true, text: 'Consumption'}
                    }
                }
            }
        });
    }
    onMounted(initChart);
    watch(() => [props.rawData, props.timeRange], initChart, {deep: true});

    onBeforeUnmount(() => {
        if (chart) chart.destroy();
    });
</script>