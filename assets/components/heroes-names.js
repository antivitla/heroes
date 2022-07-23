import HcHeroesNamesActions from './heroes-names-actions.js';
import HcHeroesNamesList from './heroes-names-list.js';

export default {
  template: `
    <div class="heroes-names">
      <hc-heroes-names-actions
        class="content"
        v-bind:search-query="searchQuery"
        v-bind:order-by="orderBy"
        v-bind:order-direction="orderDirection"
        v-on:search-query="searchQuery = $event"
        v-on:order-by="orderBy = $event"
        v-on:order-direction="orderDirection = $event"></hc-heroes-names-actions>
      <hc-heroes-names-list
        class="content full"
        v-bind:heroes="heroes"
        v-bind:filter-by-name="searchQuery"
        v-bind:order-by="orderBy"
        v-bind:order-direction="orderDirection"></hc-heroes-names-list>
    </div>
  `,
  components: {
    HcHeroesNamesActions,
    HcHeroesNamesList
  },
  props: {
    heroes: Array
  },
  data () {
    return {
      searchQuery: '',
      orderBy: 'firstName',
      orderDirection: true
    };
  }
}