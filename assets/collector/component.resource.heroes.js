import { formatDate, capitalizeFirstLetter, possibleCombinations } from './utils.common.js';
import MixinCommon from './mixin.common.js';
import { Ranks, Awards } from './utils.reference.js';
import { getJsonDocument, saveJsonDocument } from './utils.resource.js';
import ComponentActions from './component.actions.js';
import ComponentEditor from './component.editor.js';
import ComponentPreviewAwards from './component.field.preview-awards.js';
import ComponentHeroStat from './component.hero-stat.js';
import ComponentDisplayArray from './component.display-array.js';
import ComponentSearch from './component.search.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>Проверка и редактирование героев</h2>
      </header>

      <section v-if="techOperations.length">
        <h3>Технические операции</h3>
        <component-actions
          :actions="techOperations"
          :action-result="actionResult"
          @action="onTechOperation">
        </component-actions>
      </section>

      <section>
        <h3>Cтатистика и ошибки</h3>
        <component-hero-stat
          :heroes="heroes"
          :sources="sources"
          @filter-heroes="onFilterHeroes"></component-hero-stat>
      </section>

      <section>
        <h3>Поиск героев</h3>
        <component-search
          v-model="searchHeroesQuery"
          label="Найти"
          @search="onSearchHeroes"></component-search>
      </section>

      <section>
        <h3>
          Список<span v-if="typesMix.length">:&ensp;<component-display-array
            :array="typesMix"
            delimiter=" + ">
          </component-display-array></span>
          <span>&ensp;({{ filteredHeroList.length }})</span>
        </h3>

        <ul class="cards">
          <li class="card check-hero" v-for="hero in filteredHeroList" :key="hero.name">

            <component-preview-awards v-model="hero.awards"></component-preview-awards>

            <h3 class="check-hero__name">{{ hero.name }}</h3>
            <p class="check-hero__rank">{{ hero.rank }}</p>
            <p class="check-hero__sex">{{ capitalizeFirstLetter(hero.sex) }}</p>
            <p
              v-if="hero.group.length"
              class="check-hero__group">{{ hero.group.join(', ') }}</p>
            <p v-if="hero.fallen">🔥 Погиб{{ hero.sex === 'женщина' ? 'ла' : ''}}</p>

            <!-- Аватары -->
            <div class="check-hero__avatars">
              <div
                class="check-hero__avatar"
                v-for="resource in getSources(hero)"
                :style="safeGetAvatarStyle(hero.resources[resource].photo)"></div>
            </div>

            <!-- Переключатель ресурсов -->
            <div class="actions">
              <input
                type="button"
                class="small action"
                :class="'color-' + type"
                v-for="(value, type) in hero.resources" :key="type"
                :value="type">
            </div>

            <div class="check-hero__resources">
              <div
                class="check-hero__resource"
                v-for="(value, resource) in hero.resources" :key="resource">
                <h4>{{ capitalizeFirstLetter(resource) }}</h4>
                <p
                  v-for="(value, field) in hero.resources[resource]"
                  :class="'check-hero__' + field">
                  <span class="muted">{{ field }}: </span>
                  <img
                    v-if="field === 'poster'"
                    class="check-hero__poster"
                    :src="value">
                  <span v-else>{{ value }}</span>
                </p>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </section>
  `,
  components: {
    ComponentActions,
    ComponentEditor,
    ComponentPreviewAwards,
    ComponentHeroStat,
    ComponentDisplayArray,
    ComponentSearch,
  },
  mixins: [MixinCommon],
  data () {
    return {
      // checkOptions: [
      //   { key: 'photo', label: 'Фото' },
      //   { key: 'name', label: 'Имя' },
      //   { key: 'rank', label: 'Звание' },
      //   { key: 'awards', label: 'Награды' },
      //   { key: 'heroes', label: 'Герои' },
      // ],
      // checkOptionsMap: {
      //   heroes: true,
      //   photo: true,
      //   name: true,
      //   rank: true,
      //   awards: true
      // },
      formatDate,
      techOperations: [
        // { type: 'move-to-zmil-fields', label: 'Убрать в zmil поля' },
        // { type: 'move-to-resources', label: 'Убрать в resources' },
      ],
      actionResult: '',
      filteredHeroList: [],
      searchHeroesQuery: '',
      sources: [
        'zmil',
        'warheroes',
        'tsargrad',
        'kontingent',
        'ancestor',
        'mod_russia',
        // 'rabotaembrat',
        // 'zakharprilepin',
      ],
      fields: {
        common: [
          'name',
          'rank',
          'awards',
          'sex',
          'group',
          'fallen',
        ],
      },
      typesMix: [],
      // combinations: [],
      statResult: '',
    };
  },
  computed: {
    //
  },
  watch: {
    heroes () {
      // if (this.combinations.length === 0) {
      //   this.combinations = this.getCombinations();
      // }
      this.filteredHeroList = this.heroList.slice();
    },
    searchHeroesQuery () {
      this.onSearchHeroes();
    }
  },
  created () {
    // this.combinations = this.getCombinations();
    this.filteredHeroList = this.heroList.slice();
  },
  methods: {
    async onTechOperation (type) {
      return await ({
        // 'move-to-zmil-fields': this.actionMoveToZMilFields,
        // 'move-to-resources': this.actionMoveToResources,
      })[type]();
    },
    onFilterHeroes (types) {
      this.typesMix = types;
      this.filteredHeroList = this.heroList.filter(hero => {
        return types.reduce((result, type) => {
          return result && hero.resources?.[type];
        }, true);
      });
    },
    async onSearchHeroes () {
      clearTimeout(this.searchHeroTimeout);
      this.searchHeroTimeout = setTimeout(() => {
        this.filteredHeroList = this.heroList.filter(hero => {
          return JSON.stringify(hero).toLowerCase().match(
            new RegExp(this.searchHeroesQuery.toLowerCase()),
            'gi'
          );
        });
      }, 500)
    },
    capitalizeFirstLetter,

    //
    // Utils
    //

    getSources (hero) {
      return this.sources.filter(src => hero.resources?.[src]);
    },
    // getCombinations () {
    //   const combinations = possibleCombinations(this.sources);
    //   return combinations.filter((types, index) => {
    //     return this.heroList.filter(hero => {
    //       return types.reduce((result, type) => {
    //         return result && hero.resources?.[type];
    //       }, true);
    //     }).length > 0;
    //   });
    // },
    safeGetAvatarStyle (photo) {
      const style = this.getAvatarStyle(photo);
      if (!photo) {
        style.display = 'none';
      }
      return style;
    }
    // async actionMoveToResources () {
    //   this.actionResult = '';
    //   const heroes = await getJsonDocument('data/heroes.json', {});
    //   const updatedHeroes = Object.values(heroes).reduce((map, hero) => {
    //     map[hero.name] = { resources: {} };
    //     for (let field in hero) {
    //       if (this.fields.common.includes(field)) {
    //         map[hero.name][field] = hero[field];
    //       } else {
    //         map[hero.name].resources[field] = hero[field];
    //       }
    //     }
    //     return map;
    //   }, {});
    //   await saveJsonDocument('data/heroes.json', updatedHeroes);
    //   this.actionResult = 'Преобразовано';
    // },
    // async actionMoveToZMilFields () {
    //   this.actionResult = '';
    //   const heroes = await getJsonDocument('data/heroes.json', {});
    //   const updatedHeroes = Object.values(heroes).reduce((map, hero) => {
    //     map[hero.name] = {
    //       name: hero.name,
    //       rank: hero.rank || '',
    //       fallen: Boolean(hero.fallen),
    //       awards: hero.awards?.slice() || [],
    //       sex: hero.sex || 'мужчина',
    //       group: hero.group?.slice() || [],
    //     };
    //     // Перенос данных
    //     if (hero.poster) {
    //       map[hero.name].zmil = {
    //         photo: '',
    //         poster: hero.poster,
    //         story: '',
    //         date: '',
    //         url: ''
    //       };
    //     }
    //     if (hero.ancestorStory) {
    //       map[hero.name].ancestor = {
    //         poster: hero.ancestorPoster,
    //         story: hero.ancestorStory,
    //         url: '',
    //       };
    //     }
    //     return map;
    //   }, {});
    //   await saveJsonDocument('data/heroes.json', updatedHeroes);
    //   this.actionResult = 'Перенесено в Zmil-поля';
    // }
  }
}