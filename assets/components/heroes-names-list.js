import heroesMixin from '../mixins/heroes.js';

export default {
  template: `
    <div
      class="heroes-names-list"
      v-bind:order-by="orderBy"
      v-bind:class="{
        'count-below-100': orderedList.length < 100,
        'count-below-50': orderedList.length < 50,
        'count-below-25': orderedList.length < 25,
      }"
    >
      <template
        v-if="orderedList.length > 0"
        v-for="(hero, index) in orderedList">
        <span
          v-if="isDividerRequired(index)"
          class="heroes-names-list__divider">{{ displayDivider(index) }}</span>
        <a
          class="heroes-names-list__item"
          v-on:click="onOpenHero(hero)"
          v-bind:date="getHeroDate(hero)">{{ getHeroName(hero) }}</a>
      </template>
      <template v-else>
        <div class="heroes-names-list__empty">Ничего не найдено...</div>
      </template>
    </div>
  `,
  mixins: [heroesMixin],
  inject: ['openModal'],
  props: {
    heroes: {
      type: Array,
      required: true
    },
    orderBy: {
      type: String,
      required: true
    },
    orderDirection: {
      type: Boolean,
      default: true
    },
    filterByName: {
      type: String,
      default: ''
    }
  },
  computed: {
    filteredList () {
      if (!this.filterByName || this.filterByName.length < 2) {
        return this.heroes;
      } else {
        return this.heroes.filter(hero => hero.name.match(new RegExp(this.filterByName, 'gi')));
      }
    },
    orderedList () {
      return this.getHeroesOrderedBy(
        this.orderBy,
        this.filteredList,
        this.orderDirection
      );
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
    onOpenHero (hero) {
      this.openModal({
        is: 'HcModalHero',
        options: { hero }
      });
    }
  }
}
