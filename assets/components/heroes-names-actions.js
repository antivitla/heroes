export default {
  template: `
    <div class="heroes-names-actions actions">
      <input
        type="search"
        class="heroes-names-actions__search actions__left"
        v-model="inputSearchValue"
        placeholder="Найти по имени">
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
          title="Сортировать по дате"
          v-bind:class="{
            active: orderBy === 'date',
            asc: orderDirection
          }"
          v-on:click="onOrderBy('date')">Дата</button>
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
  watch: {
    inputSearchValue (value = '') {
      this.$emit('search-query', value);
    }
  },
  methods: {
    onOrderBy (orderBy) {
      if (orderBy === this.orderBy) {
        this.$emit('order-direction', !this.orderDirection);
      } else {
        this.$emit('order-by', orderBy);
      }
    }
  }
}