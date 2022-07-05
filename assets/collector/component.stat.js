export default {
  template: `
    <span
      class="stat"
      title="Обновить"
      @click="$emit('refresh')"
    >
      <span>{{ displayStat }}</span>
      <span
        v-if="isPropLoadingPresent"
        class="loading-indicator"
        :class="{ active: loading }"
      ></span>
    </span>`,
  props: {
    done: {
      type: Number,
      default: null
    },
    total: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      default: 'full',
      validator (value) {
        return ['short', 'full'].includes(value);
      }
    },
    delimiter: {
      type: String,
      default: ' из ',
    },
    loading: {
      type: Boolean,
      default: null
    }
  },
  computed: {
    displayStat () {
      if (this.type === 'short') {
        return `${this.done}${this.delimiter}${this.total}`;
      } else {
        if (this.loading) {
          return 'Грузим статистику...';
        } else if (!this.total) {
          return `(Нет данных)`;
        } else if (!this.done) {
          return `Всего ${this.total}`;
        } else if (this.total === this.done) {
          return `Обработано всё (${this.total})`;
        } else if (this.done === 0) {
          return `Ничего не обработано из ${this.total}`;
        } else {
          return `Обработано ${this.done}${this.delimiter}${this.total}`;
        }
      }
    },
    isPropLoadingPresent () {
      return this.loading !== null;
    }
  }
};
