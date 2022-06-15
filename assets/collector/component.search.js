export default {
  template: `
    <fieldset class="search-cards">
      <label class="input-block-label" v-if="fieldLabel">{{ fieldLabel }}</label>
      <div class="input-group">
        <input
          type="text"
          v-model="query"
          placeholder="Строка поиска, например, 'Нурмагомед'"
          @keyup.enter="onSearch"
          >
        <input
          type="button"
          :value="label"
          :disabled="!query || query.length < 3"
          @click="onSearch">
      </div>
    </fieldset>
  `,
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: 'Поиск'
    },
    fieldLabel: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      query: ''
    }
  },
  watch: {
    modelValue () {
      this.sync();
    },
    query () {
      this.$emit('update:modelValue', this.query);
    }
  },
  created () {
    this.sync();
  },
  methods: {
    sync () {
      this.query = this.modelValue;
    },
    onSearch () {
      if (this.query && this.query.length >= 3) {
        this.$emit('search', this.query);
      }
    }
  }
}


