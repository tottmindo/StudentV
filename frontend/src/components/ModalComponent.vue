<template>
  <div
    v-if="modelValue"
    @click.self="close"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div
      class="relative h-5/6 max-h-[800px] w-11/12 max-w-4xl overflow-y-auto rounded-md
             border border-gray-200 bg-white p-6 text-gray-900 shadow-xl
             dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
    >
      <button
        @click="close"
        type="button"
        class="absolute right-4 top-4 text-2xl leading-none
               text-gray-500 transition-colors
               hover:text-gray-900
               dark:text-gray-400 dark:hover:text-white"
        aria-label="Close modal"
      >
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
}
</script>