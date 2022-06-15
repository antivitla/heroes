import { getJsonDocument, saveJsonDocument } from './utils.resource.js'

export default {
  props: {
    resourceKey: {
      type: String,
      required: true
    },
    heroes: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      stat: {},
      cards: {},
      editHeroes: {},
      loading: false,
      defaultCardsLimit: 10,
      progress: {
        active: false,
        total: 0,
        done: 0,
        label: '',
      },
      actionResult: '',
      searchHeroQuery: ''
    }
  },
  computed: {
    resourceCachePath () {
      return `data/resource/${this.resourceKey}`;
    },
    heroList () {
      return Object.values(this.heroes);
    },
    heroNames () {
      return Object.keys(this.heroes).sort();
    },
    labelProgress () {
      return `${this.progress.label} ${this.progress.done} из ${this.progress.total}`;
    },
    filteredHeroNames () {
      return this.heroNames.filter(name => {
        return this.searchHeroQuery && name.match(new RegExp(this.searchHeroQuery, 'i'));
      });
    }
  },
  created () {
    this.cards = this.createInitialCards();
    this.stat = this.createInitialStat();
  },
  methods: {
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
    async getCachedEditHeroes () {
      this.editHeroes = await getJsonDocument(
        `${this.resourceCachePath}/edit-heroes.json`,
        {}
      );
    },
    async setCachedEditHeroes () {
      await saveJsonDocument(
        `${this.resourceCachePath}/edit-heroes.json`,
        this.editHeroes
      );
    },
    clearEditHeroes () {
      this.editHeroes = {};
    },
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
  }
}
