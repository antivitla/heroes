import HcHeroesNamesActions from './heroes-names-actions.js';
import HcHeroesNamesList from './heroes-names-list.js';
import { getUrlParam, setUrlParam } from '../utils.js';

export default {
  template: `
    <div class="heroes-names">
      <div class="content">
        <h2>Общий список с поиском</h2>
        <p>Найти героев можно по буквам имени, звания, награды, даты, пола, гибели. Например, <em>&laquo;лей жен&raquo;</em> найдут всех лейтенантов-женщин. <em>&laquo;Погиб геро&raquo;</em> найдет всех Героев России получивших звание посмертно, а <em>&laquo;Герой жив&raquo;</em> — всех живых и здоровых. <em>&laquo;Майор мая&raquo;</em> найдет всех майоров, отличившихся в мае. <em>&laquo;Алекс мар лей&raquo;</em> — это все Александры и Алексеи в звании лейтенанта, отличившиеся в марте.</p>
        <!-- <p>Ну и сортировка поверх.</p> -->
      </div>
      <hc-heroes-names-actions
        class="content wider"
        v-bind:search-query="searchQuery"
        v-bind:order-by="orderBy"
        v-bind:order-direction="orderDirection"
        v-on:search-query="searchQuery = $event"
        v-on:order-by="orderBy = $event"
        v-on:order-direction="orderDirection = $event"></hc-heroes-names-actions>
      <hc-heroes-names-list
        class="content wider"
        v-bind:heroes="heroes"
        v-bind:filter-query="searchQuery"
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
    // Достаем значения из url
    return {
      searchQuery: getUrlParam('heroesNamesSearchQuery') || '',
      orderBy: getUrlParam('heroesNamesOrderBy')  || 'firstName',
      orderDirection: getUrlParam('heroesNamesOrderDirection') === 'false' ? false : true
    };
  },
  watch: {
    searchQuery (searchQuery) {
      setUrlParam('heroesNamesSearchQuery', searchQuery, true);
    },
    orderBy (orderBy) {
      setUrlParam('heroesNamesOrderBy', orderBy, true);
    },
    orderDirection (orderDirection) {
      setUrlParam('heroesNamesOrderDirection', orderDirection, true);
    }
  }
}