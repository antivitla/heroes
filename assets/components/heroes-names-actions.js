export default {
  template: `
    <div class="heroes-names-actions actions">
      <input
        type="search"
        class="heroes-names-actions__search actions__left"
        v-model="inputSearchValue"
        placeholder="Найти героев">
      <div class="actions__right">
        <button
          class="heroes-names-actions__order-by action action_text"
          title="Сортировать по имени"
          v-bind:class="{
            active: orderBy === 'firstName',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('firstName')">Имя</button>
        <button
          class="heroes-names-actions__order-by action action_text"
          title="Сортировать по фамилии"
          v-bind:class="{
            active: orderBy === 'lastName',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('lastName')">Фамилия</button>
        <button
          class="heroes-names-actions__order-by action action_text"
          title="Сортировать по званию"
          v-bind:class="{
            active: orderBy === 'rank',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('rank')">Звание</button>
        <button
          class="heroes-names-actions__order-by action action_text"
          title="Сортировать по дате"
          v-bind:class="{
            active: orderBy === 'date',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('date')">Дата</button>
        <button
          class="heroes-names-actions__order-by action action_text"
          title="Сортировать по наградам"
          v-bind:class="{
            active: orderBy === 'awards',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('awards')">Награды</button>
        <button
          class="heroes-names-actions__order-by action action_text"
          title="Сортировать по полу"
          v-bind:class="{
            active: orderBy === 'sex',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('sex')">Пол</button>
      </div>
    </div>
  `,
  props: {
    searchQuery: String,
    orderBy: String,
    orderDirection: Boolean
  },
  data () {
    return {
      inputSearchValue: ''
    };
  },
  created () {
    this.sync();
  },
  watch: {
    searchQuery () {
      this.sync();
    },
    inputSearchValue (value = '') {
      this.$emit('search-query', value);
    }
  },
  methods: {
    sync () {
      this.inputSearchValue = this.searchQuery;
    },
    onOrderBy (orderBy) {
      if (orderBy === this.orderBy) {
        this.$emit('order-direction', !this.orderDirection);
      } else {
        this.$emit('order-by', orderBy);
      }
    }
  }
}