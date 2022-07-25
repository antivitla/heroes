import HeroesMixin from '../mixins/heroes.js';

export default {
  template: `
    <div
      class="heroes-names-list"
      v-bind:order-by="orderBy"
      v-bind:class="{
        'count-below-100': orderedList.length < 100,
        'count-below-50': orderedList.length < 50,
        'count-below-25': orderedList.length < 25,
        'additional-fields': foundAdditionalFields
      }"
    >
      <div
        class="heroes-names-list__item-wrapper"
        v-if="orderedList.length > 0"
        v-for="(hero, index) in orderedList">
        <span
          v-if="isDividerRequired(index)"
          class="heroes-names-list__divider">{{ displayDivider(index) }}</span>
        <a
          class="heroes-names-list__item"
          v-on:click="onOpenHero(hero)">
          <div class="name">{{ getHeroName(hero) }}</div>
          <div class="found" v-if="hero.found">
            <div class="rank" v-if="hero.found.rank">{{ hero.rank }}</div>
            <div class="award" v-if="hero.found.award">{{ hero.awards.join(', ') }}</div>
            <div class="sex" v-if="hero.found.sex">{{ hero.sex }}</div>
            <div class="date" v-if="hero.found.date">{{ hero.extended.dateFormatted }}</div>
            <div class="fallen" v-if="hero.found.fallen">Погиб{{hero.sex === 'женщина' ? 'ла' : '' }}</div>
            <div class="alive" v-if="hero.found.alive">Жив{{hero.sex === 'женщина' ? 'а' : '' }}</div>
          </div>
        </a>
      </div>
      <div v-else class="heroes-names-list__empty">Ничего не найдено...</div>
    </div>
  `,
  mixins: [HeroesMixin],
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
    filterQuery: {
      type: String,
      default: ''
    },
  },
  data () {
    return {
      clonedHeroes: [],
      foundAdditionalFields: false
    };
  },
  watch: {
    heroes () {
      this.syncHeroes();
    }
  },
  computed: {
    filteredList () {
      if (!this.filterQuery || this.filterQuery.length < 2) {
        this.foundAdditionalFields = false;
        return this.heroes;
      } else {
        this.foundAdditionalFields = false;
        return this.clonedHeroes.filter(hero => {
          hero.found = {};
          // Добавить маркер что именно было найдено к герою
          const queries = this.filterQuery.split(/\s+/gi)
            .filter(q => q && q.length > 2)
            .map(q => new RegExp(q, 'gi'));
          const foundAll = queries.every(q => {
            const found = {
              name: hero.name.match(q),
              rank: hero.rank.match(q),
              award: hero.awards.join(', ').match(q),
              sex: hero.sex.match(q),
              date: hero.extended.dateFormatted.match(q),
              fallen: hero.fallen && hero.extended.fallenTags.match(q),
              alive: !hero.fallen && hero.extended.fallenTags.match(q)
            };
            // Глобально маркируем что нашлись доп. поля
            if (!this.foundAdditionalFields) {
              const foundAdditionalFields = Object.entries(found).some(entry => {
                return entry[0] !== 'name' && entry[1];
              });
              if (foundAdditionalFields) {
                this.foundAdditionalFields = true;
              }
            }
            // Добавляем инфу о найденном
            Object.assign(
              hero.found,
              Object.entries(found).reduce((map, entry) => {
                if (entry[1]) {
                  map[entry[0]] = true;
                }
                return map;
              }, {})
            );
            return Object.values(found).some(value => value);
          });
          return foundAll;
        });
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
  created () {
    this.syncHeroes();
  },
  methods: {
    syncHeroes () {
      this.clonedHeroes = this.extendCloneHeroes(this.heroes);
    },
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
        const date = this.getHeroDate(this.orderedList[index]);
        const month = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май',
          'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ][Number(date?.split('-')[1] || 0)];
        const year = date?.split('-')[0] || '2022';
        if (!month) {
          divider = '';
        } else {
          // divider = `${month} ${year}`;
          divider = `${month}`;
        }
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
