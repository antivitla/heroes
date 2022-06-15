export default {
  template: `
    <nav class="actions" :class="{ disabled: loading }">
      <input
        v-for="action in actions"
        type="button"
        class="action"
        :value="action.label"
        @click="$emit('action', action.type)">

      <!-- Прелоадер -->
      <div v-if="loading" class="action-progress">
        <span>{{ labelProgress }}</span>
        <span class="loading-indicator active"></span>
      </div>

      <!-- Отчёт о действиях -->
      <div if="actionResult" class="actions__result">{{ actionResult }}</div>
    </nav>
  `,
  props: {
    actions: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    labelProgress: {
      type: String,
      default: 'Грузим...'
    },
    actionResult: {
      type: String,
      default: ''
    }
  },
}