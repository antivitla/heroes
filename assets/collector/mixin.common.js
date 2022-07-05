import {
  getJsonDocument,
  saveJsonDocument,
  downloadImage
} from './utils.resource.js'
import {
  recognizeRanks,
  recognizeAwards,
  recognizeFallen,
  recognizeSex,
  recognizeDates,
  recognizeContacts } from './utils.recognize.js';
import { clone, slug, equal, formatDate } from './utils.common.js';
import { Ranks, Awards } from './utils.reference.js';
import MixinHeroList from './mixin.common-hero-list.js';

export default {
  mixins: [MixinHeroList],
  inject: ['confirm', 'input'],
  props: {
    resourceKey: {
      type: String,
      required: true
    },
    allResourcesKeys: {
      type: Array,
      required: true
    },
    // heroes: {
    //   type: Object,
    //   required: true
    // },
    heroesList: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      stat: {},
      cards: {},
      allCards: [],


      selectedCard: {},
      cardHeroId: {},
      editHeroes: {},
      recognizedNames: {},
      actionsLog: {},

      loading: false,
      defaultCardsLimit: 10,
      progress: {
        active: false,
        total: 0,
        done: 0,
        label: '',
      },
      actionResult: '',
      searchHeroQuery: '',
      // isEditHeroesUpdateLocked: false,
      fields: [],
    }
  },
  watch: {
    selectedCard: {
      handler () {
        Object.keys(this.selectedCard).forEach(this.checkSyncEditHeroes);
      },
      deep: true
    },
    cardHeroId: {
      handler () {
        Object.keys(this.cardHeroId).forEach(this.checkSyncEditHeroes);
      },
      deep: true
    },
    heroesList: {
      handler () {
        this.prepareFieldsOptions();
      },
      deep: true
    }
  },
  computed: {
    resourceCachePath () {
      return `data/resource/${this.resourceKey}`;
    },
    labelProgress () {
      return `${this.progress.label} ${this.progress.done} из ${this.progress.total}`;
    },
    selectHeroOptions () {
      return this.heroesList.map(hero => {
        const id = this.getHeroId(hero);
        const label = `${hero.name}, ${hero.rank}, ${id}`;
        return {
          label,
          value: id,
          name: hero.name,
        };
      }).sort((a, b) => a.label < b.label ? -1 : a.label === b.label ? 0 : 1);
    },
    recognizeHeroNamesOptions () {
      return Object.values(this.heroesList.reduce((map, hero) => {
        map[hero.name] = hero.name;
        return map;
      }, {}));
    },
    // filteredByNameHeroOptions () {
    //   return this.heroesList.filter(hero => {
    //     return this.searchHeroQuery && hero.name.match(new RegExp(this.searchHeroesQuery, 'i'));
    //   }).map(hero => ({
    //     value: this.getHeroId(hero),
    //     label: `${hero.name}, ${hero.rank}`
    //   }));
    // }
  },
  async created () {
    this.cards = this.createInitialCards();
    this.stat = this.createInitialStat();
    await this.init();
    this.prepareFieldsOptions();
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
      this.actionRecognizeHeroNames();
      this.loading = false;
    },

    //
    // Stat
    //

    async getStat () {
      this.stat = await getJsonDocument(
        `${this.resourceCachePath}/stat.json`,
        this.createInitialStat()
      );
    },
    async setStat () {
      await saveJsonDocument(
        `${this.resourceCachePath}/stat.json`,
        this.stat
      );
    },

    //
    // Cards
    //

    async getCachedCards () {
      this.cards = await getJsonDocument(
        `${this.resourceCachePath}/cards.json`,
        this.createInitialCards()
      );
    },
    async setCachedCards () {
      await saveJsonDocument(
        `${this.resourceCachePath}/cards.json`,
        this.cards
      );
    },

    //
    // All Cards (optional)
    //

    async getCachedAllCards () {
      this.allCards = await getJsonDocument(
        `${this.resourceCachePath}/all-cards.json`,
        this.createInitialAllCards()
      );
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
    async refreshAllCards () {
      this.loading = true;
      await this.getRemoteAllCards(); // should be overloaded
      await this.setCachedAllCards();
      this.loading = false;
    },
    async getRemoteAllCards () {
      console.warn('getRemoteAllCards: Should be overloaded');
    },

    //
    // Actions
    //

    async actionCreateHero (id, resourceKey) {
      // В окне диалога зададим имя
      const name = await this.input({
        header: 'Введите имя нового героя'
      });
      if (name) {
        const hero = {
          name,
          awards: [],
          group: [],
          resources: {
            [resourceKey || this.resourceKey]: { id }
          }
        };
        const update = {
          resourceKey: resourceKey || this.resourceKey,
          list: [hero]
        };
        this.editHeroes[id] = clone(hero);
        await this.setCachedEditHeroes();
        this.$emit('update-heroes', update);
        this.actionRecognizeHeroNames();
      }
    },
    async actionAddId () {
      this.actionResult = '';
      // Загрузить героев, взять все карточки. Пройтись по карточкам
      // и каждого найденного героя обновить с айди
      this.allCards.forEach(card => {
        const existingHero = this.getHeroByAnyResourceParamValue(card.id);
        if (existingHero) {
          existingHero.resources[this.resourceKey].id = card.id;
        }
      });
      await saveJsonDocument(`data/heroes-list.json`, this.heroesList);
      this.actionResult = 'Добавлено';
    },
    async actionRecognizeHeroNames () {
      this.cards.list.forEach(({ id, name }) => {
        this.recognizedNames[id] = recognizeContacts(
          name.split(/\s+/).slice(0, 2).join(' '),
          this.recognizeHeroNamesOptions
        );
        this.cardHeroId[id] = this.getHeroesIdsByName(this.recognizedNames[id][0])[0];
      });
    },
    async actionDownloadPhoto (cardId) {
      const card = this.cards.list.find(card => card.id === cardId);
      if (card && card.photo && !this.isSavedImage(card.photo)) {
        const name = this.editHeroes[this.cardHeroId[cardId]].name;
        const filename = `${slug(name)}-${
          decodeURIComponent(card.photo.split('/').slice(-1)[0].split('.')[0])
        }-${this.resourceKey}.jpg`;
        const saveTo = `${this.resourceCachePath}/images/${filename}`;
        await downloadImage(card.photo, saveTo);
        card.photo = saveTo;
      }
    },

    //
    // Edit Heroes
    //

    async getCachedEditHeroes () {
      this.editHeroes = await getJsonDocument(
        `${this.resourceCachePath}/edit-heroes.json`,
        this.createInitialEditHeroes()
      );
    },
    async setCachedEditHeroes () {
      clearTimeout(this.setCachedEditHeroesTimeout);
      this.setCachedEditHeroesTimeout = setTimeout(async () => {
        await saveJsonDocument(
          `${this.resourceCachePath}/edit-heroes.json`,
          this.editHeroes
        );
      }, 300)
    },
    async clearEditHeroes () {
      this.editHeroes = {};
      await this.setCachedEditHeroes();
    },

    //
    // Create initial
    //

    createInitialStat () {
      return { done: 0, total: 0 };
    },
    createInitialCards () {
      return {
        from: 0,
        limit: this.defaultCardsLimit,
        to: 0,
        list: []
      };
    },
    createInitialEditHeroes () {
      return {};
    },
    createInitialAllCards () {
      return [];
    },

    //
    // Utils
    //

    isSavedImage (imageUrl) {
      return /^data\//.test(imageUrl);
    },
    getAvatarStyle (url) {
      return {
        'background-image': `url("${url}")`,
        'background-size': 'cover',
        'background-position': 'center top',
      };
    },
    onSearchHero (event) {
      clearTimeout(this.timeoutSearchHero);
      this.timeoutSearchHero = setTimeout(() => {
        if (event.target.value.length < 3) {
          this.searchHeroQuery = '';
        } else {
          this.searchHeroQuery = event.target.value;
        }
      }, 300);
    },

    //
    // Cards
    //

    recognizedHeroFromCard (cardId) {
      const heroId = this.cardHeroId[cardId];
      return heroId && this.getHeroById(heroId);
    },
    getRecognizedNames (cardId) {
      return this.recognizedNames[cardId]?.join(', ') || '';
    },
    async checkSyncEditHeroes (cardId) {
      const card = this.cards.list.find(card => card.id === cardId) || {};
      const isSelected = this.selectedCard[cardId];
      const recognizedHero = this.recognizedHeroFromCard(cardId);
      const editHero = this.editHeroes[this.cardHeroId[cardId]];
      const editHeroEmpty = !editHero;
      const editHeroEmptyCardData = editHero && (
        !editHero.url ||
        !editHero.photo ||
        !editHero.story ||
        !editHero.id
      );
      const cardClone = clone(card);
      delete cardClone.name;
      if (isSelected && recognizedHero && editHeroEmpty) {
        // Создать микс из существующего героя и новых данных
        this.editHeroes[this.cardHeroId[cardId]] = Object.assign(
          {},
          cardClone,
          clone(recognizedHero),
          clone(recognizedHero.resources?.[this.resourceKey] || {})
        );
      } else if (isSelected && recognizedHero && editHeroEmptyCardData) {
        Object.assign(this.editHeroes[this.cardHeroId[cardId]], cardClone);
      }
      if (isSelected && recognizedHero) {
        // this.editHeroes
        await this.actionDownloadPhoto(cardId);
      }
      if (!isSelected) {
        this.actionsLog[cardId] = '';
      }
      await this.setCachedEditHeroes();
    },

    //
    // Navigation
    //

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
      this.loading = true;
      this.cards.from = from || 0;
      this.cards.limit = limit || this.defaultCardsLimit;
      this.cards.to = to || (this.cards.from + this.cards.limit);
      this.cards.list = this.allCards.slice(this.cards.from, this.cards.to);
      this.actionRecognizeHeroNames();
      await this.clearEditHeroes();
      await this.syncEditHeroes();
      await this.setCachedEditHeroes();
      await this.setCachedCards();
      this.loading = false;
    },

    //
    // Fields options
    //

    prepareFieldsOptions () {
      // Update field options
      this.fields.forEach(field => {
        if (field.key === 'group') {
          field.options = this.selectHeroOptions;
        } else if (field.key === 'awards') {
          field.options = Awards.list.map(award => ({
            label: award.name,
            value: award.name,
            group: award.type
          }));
        } else if (field.key === 'rank') {
          field.options = Ranks.list.map(rank => ({
            label: rank.name,
            value: rank.name,
            group: rank.level
          }));
        }
      });
    },
    createPhotoOptions (photo) {
      return photo ? [photo] : []
    },
    createGroupOptions (group) {
      return group || [];
    },
    createAncestorPosterOptions (poster) {
      return poster ? [poster] : [];
    },
    createTakeAwardsOption (story) {
      return recognizeAwards(story).map(award => award.name);
    },
    createTakeFallenOption (story) {
      return Boolean(recognizeFallen(story));
    },
    createTakeSexOption (name) {
      return recognizeSex(name || '');
    },
    createTakeRankOption (card) {
      return card.rank;
    },
    createTakeDateOption (story) {
      const dates = recognizeDates(story).slice(-1);
      if (dates.length) {
        return formatDate(dates[0], 'YYYY-MM-DD');
      } else {
        return '';
      }
    },
  }
}
