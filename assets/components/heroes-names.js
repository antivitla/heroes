import heroesMixin from '../mixins/heroes.js';

export default {
  template: `
    <div
      class="heroes-names"
      v-bind:class="{
        'below-100': orderedList.length < 100,
        'below-50': orderedList.length < 50,
        'below-25': orderedList.length < 25,
      }"
    >
      <template
        v-if="orderedList.length > 0"
        v-for="(hero, index) in orderedList"
        v-bind:class="{
          'no-date': !getHeroDate(hero)
        }">
        <span
          class="heroes-names-divider"
          v-if="isDividerRequired(index)">{{ displayDivider(index) }}</span>
        <a
          class="heroes-names-item"
          v-on:click="$emit('open-hero', hero)"
          v-bind:date="getHeroDate(hero)">{{ getHeroName(hero) }}</a>
      </template>
      <template v-else>
        <p>Ничего не найдено</p>
      </template>
    </div>
  `,
  mixins: [heroesMixin],
  props: {
    heroes: {
      type: Array,
      required: true
    },
    orderBy: {
      type: String,
      default: 'firstName'
    },
    orderDirection: {
      type: Boolean,
      default: true
    },
    searchByName: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      prevOrderValue: null
    };
  },
  computed: {
    filteredList () {
      if (!this.searchByName || this.searchByName.length < 2) {
        return this.heroes;
      } else {
        return this.heroes.filter(hero => hero.name.match(new RegExp(this.searchByName, 'gi')));
      }
    },
    orderedList () {
      return this.getHeroesOrderedBy(this.orderBy, this.filteredList, this.orderDirection);
    }
  },
  methods: {
    getHeroName (hero) {
      if (this.orderBy !== 'lastName') {
        return hero.name;
      } else {
        return hero.name.split(/\s+/).reverse().join(' ');
      }
    },
    isDividerRequired (index) {
      // В зависимости от типа сортировки
      let cur, prev;
      if (this.orderBy === 'firstName') {
        cur = this.getHeroFirstName(this.orderedList[index]).charAt(0);
        prev = index && this.getHeroFirstName(this.orderedList[index - 1]).charAt(0);
      } else if (this.orderBy === 'lastName') {
        cur = this.getHeroLastName(this.orderedList[index]).charAt(0);
        prev = index && this.getHeroLastName(this.orderedList[index - 1]).charAt(0);
      } else if (this.orderBy === 'date') {
        cur = this.getHeroDate(this.orderedList[index])?.split('-')[1];
        prev = index && this.getHeroDate(this.orderedList[index - 1])?.split('-')[1];
      }
      return !index || cur !== prev;
    },
    displayDivider (index) {
      // Тоже в зависимости от типа сортировки
      let divider = '|';
      if (this.orderBy === 'firstName') {
        divider = this.getHeroFirstName(this.orderedList[index]).charAt(0);
      } else if (this.orderBy === 'lastName') {
        divider = this.getHeroLastName(this.orderedList[index]).charAt(0);
      } else if (this.orderBy === 'date') {
        divider = [
          '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
          'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ][Number(this.getHeroDate(this.orderedList[index])?.split('-')[1] || 0)];
      }
      return divider;
    },
    openHeroPanel (hero) {
      //
    }
  }
}