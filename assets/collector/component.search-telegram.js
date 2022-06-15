import { searchChannelByQuery } from './actions.telegram.js';
import ComponentSearch from './component.search.js';

export default {
  template: `
    <div class="search-telegram">
      <component-search
        v-model="query"
        field-label="Поиск сообщений"
        :label="nextRate ? 'Продолжить поиск' : 'Найти'"
        @search="onSearchCards"></component-search>
    </div>
  `,
  components: {
    ComponentSearch
  },
  props: {
    channel: {
      type: String,
      required: true
    },
    initialQuery: {
      type: String,
      default: ''
    },
    limit: {
      type: Number,
      default: 20
    }
  },
  data () {
    return {
      nextRate: 0,
      total: 0,
      query: ''
    };
  },
  watch: {
    initialQuery () {
      this.query = this.initialQuery;
    }
  },
  created () {
    this.query = this.initialQuery;
  },
  methods: {
    async onSearchCards (query) {
      this.$emit('loading', true);
      const result = await searchChannelByQuery({
        query,
        channel: this.channel,
        limit: this.limit,
        offsetRate: this.nextRate,
      });
      if (result.nextRate) {
        this.nextRate = result.nextRate;
      }
      if (result.total) {
        this.total = result.total;
      }
      this.$emit('result', result.list.slice());
      this.$emit('loading', false);
    },
  }
}