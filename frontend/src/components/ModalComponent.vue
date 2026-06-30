<template>
    <div v-if="modelValue" @click.self="close"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-md w-11/12 max-w-4x1 h-5/6 max-h-[800px] relative p-6 overflow-y-auto">
    <button @click="close" class="absolute top-4 right-4 text-2x1 leading-none text-gray-600 hover:text-gray-900">
        &times;
    </button>
    <slot />
    </div>
    </div>
</template>

<script>
    export default {
        name: 'Modal',
        props: {
            modelValue: {
                type: Boolean,
                default: false
            }
        },
        emits: ['update:modelValue'],
        methods: {
            close() {
                this.$emit('update:modelValue', false)
            }
        }
    };
</script>