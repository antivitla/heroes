export default {
  template: `
    <nav class="actions">

      <!-- Первое -->
      <input
        v-if="items.from > items.limit"
        type="button"
        class="action"
        :disabled="loading"
        @click="$emit('navigate', 'first')"
        value="Первое">

      <!-- Предыдущее -->
      <input
        v-if="items.from > 0"
        type="button"
        class="action"
        :disabled="loading"
        @click="$emit('navigate', 'previous')"
        value="Предыдущее">

      <!-- Текущее -->
      <span
        class="stat"
        title="Загрузить"
        @click="$emit('navigate', 'current')">
        <span>{{ displayHistoryStat }}</span>
        <span
          v-if="isPropLoadingPresent"
          class="loading-indicator"
          :class="{ active: loading }"></span>
      </span>

      <!-- Следующее -->
      <input
        v-if="items.to < stat.total"
        type="button"
        class="action"
        :disabled="loading"
        @click="$emit('navigate', 'next')"
        value="Следующее">

      <!-- Последнее -->
      <input
        v-if="items.to < stat.total - items.limit"
        type="button"
        class="action"
        :disabled="loading"
        @click="$emit('navigate', 'last')"
        value="Последнее">
    </nav>
  `,
  props: {
    items: {
      type: Object,
      required: true,
    },
    stat: {
      type: Object,
      required: true,
    },
    loading: {
      type: Boolean,
      default: null
    }
  },
  computed: {
    displayHistoryStat () {
      return `Загружено ${this.items.from + 1}—${this.items.to} из ${this.stat.total}`;
    },
    isPropLoadingPresent () {
      return this.loading !== null;
    }
  }
};
