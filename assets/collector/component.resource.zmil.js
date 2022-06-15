import { clone, formatDate } from './utils.common.js';
import {
  getJsonDocument,
  saveJsonDocument,
  downloadImages } from './utils.resource.js';
import {
  recognizeTexts,
  recognizeDates,
  recognizeAwards,
  recognizeSex,
  recognizeRanks } from './utils.recognize.js';
import { Ranks, Awards } from './utils.reference.js';
import { getRemoteAllCards } from './actions.zmil.js';
import MixinCommon from './mixin.common.js';
import ComponentStat from './component.stat.js';
import ComponentNavigation from './component.navigation.js';
import ComponentActions from './component.actions.js';
import ComponentEditor from './component.editor.js';
import ComponentFieldImage from './component.field.image.js';
import ComponentFieldTitle from './component.field.title.js';
import ComponentFieldAvatar from './component.field.avatar.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>Страница проекта Минобороны России &laquo;Герои Z&raquo;</h2>
        <p><a
          href="https://z.mil.ru/spec_mil_oper/heroes.htm"
          target="_blank">z.mil.ru/spec_mil_oper/heroes.htm</a></p>
      </header>

      <!-- Статистика ресурса -->
      <component-stat
        :done="stat.done"
        :total="stat.total"
        :loading="loading"
        @refresh="refreshCards">Собираем статистику...</component-stat>

      <!-- Навигация по карточкам-->
      <component-navigation
        :items="cards"
        :stat="stat"
        @navigate="navigateCardsByAction"></component-navigation>

      <!-- Действия -->
      <component-actions
        :loading="progress.active"
        :label-progress="labelProgress"
        :actions="actions"
        :action-result="actionResult"
        @action="doAction"></component-actions>

      <!-- Карточки -->
      <ul class="cards">
        <li class="card" v-for="card in cards.list" :key="card.name">
          <component-editor
            v-model="editHeroes[card.name]"
            :fields="fields"></component-editor>
        </li>
      </ul>

      <!-- Действия -->
      <component-actions
        :loading="progress.active"
        :label-progress="labelProgress"
        :actions="actions"
        :action-result="actionResult"
        @action="doAction"></component-actions>

      <!-- Навигация по карточкам-->
      <component-navigation
        v-if="cards.list.length"
        :items="cards"
        :stat="stat"
        @navigate="navigateCardsByAction"></component-navigation>
    </section>
  `,
  components: {
    ComponentStat,
    ComponentNavigation,
    ComponentActions,
    ComponentEditor,
    ComponentFieldImage,
    ComponentFieldAvatar,
    ComponentFieldTitle,
  },
  mixins: [MixinCommon],
  data () {
    return {
      loading: false,
      actions: [
        { type: 'save-images', label: '1. Сохранить картинки' },
        { type: 'recognize-images', label: '2. Распознать постеры' },
        { type: 'recognize-data', label: '3. Дораспознать данные' },
        { type: 'save-heroes', label: '4. Сохранить героев' }
      ],
      fields: [
        { key: 'poster', mode: 'view', type: 'image', class: 'field-poster' },
        { key: 'awards', type: 'preview-awards' },
        { key: 'photo', mode: 'view', type: 'avatar' },
        { key: 'name', mode: 'view', type: 'title' },
        { key: 'awards', mode: 'edit', type: 'multiselect', label: 'Награды', options: Awards.names },
        { key: 'rank', mode: 'edit', type: 'select', label: 'Звание', options: Ranks.names },
        { key: 'story', mode: 'edit', type: 'text', label: 'История' },
        { key: 'fallen', mode: 'edit', type: 'check', label: 'Погиб' },
        { key: 'date', mode: 'edit', type: 'date', label: 'Дата' },
        { key: 'group', mode: 'edit', type: 'multiselect', label: 'Товарищи по группе', options: [] },
        { key: 'sex', mode: 'edit', type: 'choice', label: 'Пол',
          options: [
            { value: 'мужчина', label: 'Мужчина' },
            { value: 'женщина', label: 'Женщина' }
          ]
        },
      ],
      allCards: [],
      editHeroes: {},
    };
  },
  watch: {
    editHeroes: {
      handler () {
        this.setCachedEditHeroes();
      },
      deep: true
    }
  },
  computed: {
    allHeroNames () {
      return this.allCards.map(card => card.name).sort();
    },
  },
  async created () {
    await this.init();
    // Update field options
    this.fields.filter(field => field.key === 'group')[0].options = this.allHeroNames;
  },
  methods: {
    async init () {
      this.loading = true;
      await this.getCachedAllCards();
      if (!this.allCards.length) {
        await this.getRemoteAllCards();
        await this.setCachedAllCards();
      }
      await this.getCachedEditHeroes();
      await this.getCachedCards();
      if (!this.cards.to || !this.cards.list.length) {
        const { from, limit } = this.cards;
        this.navigateCardsByIndex(from);
      }
      this.loading = false;
    },
    async refreshCards () {
      this.loading = true;
      await this.getRemoteAllCards();
      await this.setCachedAllCards();
      this.loading = false;
    },
    async getCachedAllCards () {
      this.allCards = await getJsonDocument(
        `${this.resourceCachePath}/all-cards.json`,
        []
      );
      await this.getStat();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async getRemoteAllCards () {
      this.allCards = await getRemoteAllCards();
      await this.getStat();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async setCachedAllCards () {
      return saveJsonDocument(
        `${this.resourceCachePath}/all-cards.json`,
        this.allCards
      );
    },
    async navigateCardsByAction (action) {
      switch (action) {
        case 'first':
          await this.navigateCardsByIndex(0);
          break;
        case 'previous':
          await this.navigateCardsByIndex(this.cards.from - this.cards.limit);
          break;
        case 'current':
          await this.navigateCardsByIndex(this.cards.from);
          break;
        case 'next':
          await this.navigateCardsByIndex(this.cards.from + this.cards.limit);
          break;
        case 'last':
          await this.navigateCardsByIndex(this.stat.total - this.cards.limit);
          break;
      }
    },
    async navigateCardsByIndex(from, to, limit) {
      this.cards.from = from || 0;
      this.cards.limit = limit || this.defaultCardsLimit;
      this.cards.to = to || (this.cards.from + this.cards.limit);
      this.cards.list = this.allCards.slice(this.cards.from, this.cards.to);
      this.syncEditHeroes();
      await this.setCachedEditHeroes();
      await this.setCachedCards();
    },
    syncEditHeroes () {
      this.isUpdateLocked = true;
      this.editHeroes = this.cards.list.reduce((editHeroes, card) => {
        editHeroes[card.name] = Object.assign(
          {
            name: card.name,
            photo: card.photo,
            poster: card.poster,
            url: card.poster,
          },
          clone(this.heroes[card.name] || {}),
          clone(this.heroes[card.name]?.resources?.zmil || {})
        );
        return editHeroes;
      }, {});
      this.isUpdateLocked = false;
    },

    //
    // Actions
    //

    async doAction (action) {
      return ({
        'save-images': this.actionSaveImages,
        'recognize-images': this.actionRecogizePoster,
        'recognize-data': this.actionRecognizeData,
        'save-heroes': this.actionSaveHeroes,
      })[action]();
    },
    async actionSaveImages () {
      this.actionResult = '';
      // Выбрать карточки с картинками для сохранения
      const cardList = this.cards.list.filter(card => {
        return !this.isSavedImage(card.photo) || !this.isSavedImage(card.poster);
      });
      if (cardList.length) {
        this.progress.done = 0;
        this.progress.total = cardList.length * 2;
        this.progress.active = true;
        this.progress.label = 'Сохранено';
        await downloadImages({
          list: cardList,
          keys: ['photo', 'poster'],
          callback: ({ index, key, saveTo }) => {
            const name = cardList[index].name;
            this.editHeroes[name][key] = saveTo;
            this.progress.done += 1;
          },
          pathSaveTo: 'data/images'
        }).then(errors => errors.forEach(console.error));
        await this.setCachedEditHeroes();
        this.progress.active = false;
      } else {
        console.warn('Уже сохранены картинки');
      }
      this.actionResult = 'Сохранены картинки';
    },
    async actionRecogizePoster () {
      this.actionResult = '';
      // Выбрать карточки с нераспознанными историями
      const heroList = this.cards.list
        .map(card => this.editHeroes[card.name])
        .filter(editHero => !editHero.story);
      if (heroList.length) {
        this.progress.done = 0;
        this.progress.total = heroList.length;
        this.progress.active = true;
        this.progress.label = 'Распознано';
        await recognizeTexts({
          list: heroList,
          keys: ['poster'],
          callback: ({ index, key, value }) => {
            // const name = heroList[index].name;
            heroList[index].story = value.story;
            heroList[index].rank = value.rank;
            this.progress.done += 1;
          }
        }).then(({ parsedData, errors = [] }) => {
          errors.forEach(console.error);
        });
        await this.setCachedEditHeroes();
        this.progress.active = false;
      } else {
        console.warn('Уже распознаны постеры');
      }
      this.actionResult = 'Распознано';
    },
    async actionRecognizeData () {
      this.actionResult = '';
      this.cards.list
        .map(card => this.editHeroes[card.name])
        .forEach(editHero => {
          const story = editHero.story;
          // Пробуем распознать звание, если не удалось ранее
          const ranks = recognizeRanks(story);
          if (ranks.length && !editHero.rank) {
            editHero.rank = editHero.rank || ranks[0].name;
          }
          // Пробуем достать дату
          const dates = recognizeDates(story);
          if (dates.length) {
            editHero.date = editHero.date || formatDate(dates.slice(-1)[0], 'YYYY-MM-DD');
          }
          // Пробуем награды
          const awards = recognizeAwards(story);
          if (awards.length) {
            editHero.awards = !editHero.awards.length
              ? awards.map(award => award.name)
              : editHero.awards;
          }
          // Распознаём пол
          editHero.sex = editHero.sex || recognizeSex(editHero.name, story.replace('ё', 'е'));
        });
      await this.setCachedEditHeroes();
      this.actionResult = 'Дораспознано';
    },
    async actionSaveHeroes () {
      this.actionResult = '';
      const update = Object.values(this.editHeroes).reduce((map, hero) => {
        map[hero.name] = {
          name: hero.name || '',
          rank: hero.rank || '',
          awards: clone(hero.awards?.slice() || []),
          sex: hero.sex || 'мужчина',
          fallen: Boolean(hero.fallen),
          group: clone(hero.group?.slice() || []),
          resources: Object.assign({}, hero.resources, {
            zmil: {
              photo: hero.photo || '',
              poster: hero.poster || '',
              story: hero.story || '',
              date: hero.date || '',
              url: hero.url || '',
            }
          })
        };
        return map;
      }, {});
      this.$emit('update-heroes', clone(update));
      await this.setCachedEditHeroes();
      this.stat.done = this.cards.to;
      await this.setStat();
      this.actionResult = 'Сохранено';
    },
    isSavedImage (imageUrl) {
      return /^data\//.test(imageUrl);
    },
  }
};
