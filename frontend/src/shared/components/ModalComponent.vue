<template>
  <div
    v-if="modelValue"
    @click.self="close"
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4"
  >
    <div
      class="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl min-w-0 overflow-y-auto overscroll-contain rounded-md
             border border-gray-200 bg-white p-4 text-gray-900 shadow-xl sm:p-6
             dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
    >
      <button
        @click="close"
        type="button"
        class="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-lg text-2xl leading-none sm:right-4 sm:top-4
               text-gray-500 transition-colors
               hover:text-gray-900
               dark:text-gray-400 dark:hover:text-white"
        :aria-label="$t('charts.closeModal')"
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
