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
          :heroes-list="heroesList"
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
          <li class="card check-hero" v-for="hero in filteredHeroList" :key="getHeroId(hero)">
            <component-preview-awards v-model="hero.awards"></component-preview-awards>
            <h3 class="check-hero__name">{{ hero.name }}</h3>
            <p class="check-hero__rank">{{ hero.rank }}</p>
            Sex: {{ hero.sex }}
            <p class="check-hero__sex">{{ capitalizeFirstLetter(hero.sex) }}</p>
            <p
              v-if="hero.group.length"
              class="check-hero__group">{{ hero.group.join(', ') }}</p>
            <p v-if="hero.fallen">🔥 Погиб{{ hero.sex === 'женщина' ? 'ла' : ''}}</p>

            <!-- Аватары -->
            <div class="check-hero__avatars">
              <div
                class="check-hero__avatar md"
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
                  <a
                    :href="value"
                    target="_blank"
                    v-else-if="field === 'url'">{{ value }}</a>
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
        { type: 'rename-mod-russia', label: 'Переименовать mod_russia в telegram.mod-russia'},
        { type: 'add-ancestor-id', label: 'Добавить ID в ancestor'},
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
        'rabotaembrat',
        'zakharprilepin',
      ],
      heroFields: {
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
      statResult: '',
    };
  },
  computed: {
    //
  },
  watch: {
    searchHeroesQuery () {
      this.onSearchHeroes();
    }
  },
  created () {
    this.filteredHeroList = this.heroesList.slice();
  },
  methods: {
    async onTechOperation (type) {
      return await ({
        'add-ancestor-id': this.actionAddAncestorId,
        'rename-mod-russia': this.renameModRussia,
      })[type]();
    },
    syncEditHeroes () {
      //
    },
    onFilterHeroes (types) {
      this.typesMix = types;
      this.filteredHeroList = this.heroesList.filter(hero => {
        return types.reduce((result, type) => {
          return result && hero.resources?.[type];
        }, true);
      });
    },
    async onSearchHeroes () {
      clearTimeout(this.searchHeroTimeout);
      this.searchHeroTimeout = setTimeout(() => {
        this.filteredHeroList = this.heroesList.filter(hero => {
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
    safeGetAvatarStyle (photo) {
      const style = this.getAvatarStyle(photo);
      if (!photo) {
        style.display = 'none';
      }
      return style;
    },

    //
    // Actions
    //

    async actionAddAncestorId () {
      this.actionResult = '';
      const list = await getJsonDocument('data/heroes-list.json', {});
      list.forEach(hero => {
        if (hero.resources.ancestor) {
          hero.resources.ancestor.id = hero.resources.ancestor.url;
        }
      });
      await saveJsonDocument('data/heroes-list.json', list);
      this.actionResult = 'Добавлено';
    },
    async renameModRussia () {
      this.actionResult = '';
      const list = await getJsonDocument('data/heroes-list.json', {});
      list.forEach(hero => {
        const mod_russia = hero.resources.mod_russia;
        if (mod_russia) {
          delete hero.resources.mod_russia;
          hero.resources['telegram.mod_russia'] = mod_russia;
        }
      });
      await saveJsonDocument('data/heroes-list.json', list);
      this.actionResult = 'Переименовали';
    }
  }
}