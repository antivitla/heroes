import HcHeroAvatars from './hero-avatars.js';
import HcHeroAwards from './hero-awards.js';
import HeroesMixin from '../mixins/heroes.js';

export default {
  template: `
    <div class="modal-hero">
      <header class="modal-header">
        <hc-hero-avatars
          v-bind:hero="hero"
          v-bind:avatar-key="avatarKey"></hc-hero-avatars>
        <h2 class="hero-name">{{ hero.name }} <span v-if="hero.fallen" title="Погиб. Вечная память">🔥</span></h2>
        <div class="hero-rank">{{ hero.rank }}</div>
        <hc-hero-awards v-bind:hero="hero" v-if="hero.awards.length"></hc-hero-awards>
        <!-- <div class="hero-fallen" v-if="hero.fallen"></div> -->
      </header>

      <main class="modal-main">
        <nav class="hero-story-tabs" v-bind:class="{ single: availableResources.length < 2 }">
          <!-- <div style="font-size: 1rem; font-weight: boldя; margin-bottom: 1rem; color: var(--color-app-text-invert-muted)">Источники</div> -->
          <div
            v-for="(tab, index) in availableResources"
            class="hero-story-tab"
            title="Выбрать"
            v-bind:class="{ current: index === currentStoryIndex }"
            v-on:click="onChangeStory(index)">
            <div class="hero-story-tab__title">{{ tab.resourceTitle }}</div>
            <div class="hero-story-tab__subtitle">{{ tab.resourceSubtitle }} {{ tab.resourceUrl }}</div>
          </div>
        </nav>

        <div
          class="hero-story-content"
          v-bind:class="[currentResource.key]"
          v-if="currentResource"
          ref="story">
          <div v-html="currentResource.story" class="hero-story-content__body"></div>
          <p><img v-if="currentResource.poster" v-bind:src="currentResource.poster"></p>
          <p
            v-if="currentResource.heroUrl"
            class="hero-story-content__url">Источник:&ensp;
            <a
              v-bind:href="currentResource.heroUrl"
              title="Страница героя"
              target="_blank">{{ trimUrl(currentResource.heroUrl) }}</a>
          </p>
        </div>
      </main>
      <button
        class="action_icon action_text modal-close"
        v-on:click="$emit('close')">
        &times;
      </button>
    </div>
  `,
  mixins: [HeroesMixin],
  components: {
    HcHeroAvatars,
    HcHeroAwards
  },
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      currentStoryIndex: 0,
      resources: []
    }
  },
  watch: {
    options: {
      handler () {
        this.syncResources();
      },
      deep: true
    }
  },
  computed: {
    hero () {
      return this.options.hero;
    },
    availableResources () {
      return this.resources.filter(resource => resource.isAvailable);
    },
    currentResource () {
      return this.availableResources[this.currentStoryIndex];
    },
    avatarKey () {
      return this.currentResource?.key;
    }
  },
  mounted () {
    this.syncResources();
  },
  methods: {
    syncResources () {
      this.resources = [
        {
          key: 'tsargrad',
          resourceTitle: '«Царьград»',
          resourceSubtitle: 'Интернет-телеканал',
          resourceUrl: 'ug.tsargrad.tv',

          heroUrl: this.hero.resources.tsargrad?.url || '',
          story: this.hero.resources.tsargrad?.story || '',
          isAvailable: Boolean(this.hero.resources.tsargrad)
        },
        {
          key: 'warheroes',
          resourceTitle: '«Герои страны»',
          resourceSubtitle: 'Интернет-проект',
          resourceUrl: 'warheroes.ru',

          heroUrl: this.hero.resources.warheroes?.url || '',
          story: this.hero.resources.warheroes?.story || '',
          isAvailable: Boolean(this.hero.resources.warheroes)
        },
        {
          key: 'zmil',
          resourceTitle: '«Герои Z»',
          resourceSubtitle: 'Министерство обороны России',
          resourceUrl: 'z.mil.ru',

          heroUrl: this.hero.resources.zmil?.url || '',
          story: this.hero.resources.zmil?.story || '',
          isAvailable: Boolean(this.hero.resources.zmil)
        },
        {
          key: 'kontingent',
          resourceTitle: '«Контингент»',
          resourceSubtitle: 'Военно-историческое издание',
          resourceUrl: 'kontingent.press',

          heroUrl: this.hero.resources.kontingent?.url || '',
          story: this.hero.resources.kontingent?.story || '',
          isAvailable: Boolean(this.hero.resources.kontingent)
        },
        {
          key: 'ancestor',
          resourceTitle: '#ПредковДостойны',
          resourceSubtitle: 'Министерство обороны России',
          resourceUrl: 't.me/mod_russia',

          heroUrl: this.hero.resources.ancestor?.url || '',
          story: this.hero.resources.ancestor?.story || '',
          poster: this.hero.resources.ancestor?.poster || '',
          isAvailable: Boolean(this.hero.resources.ancestor),
        },
      ].map(item => {
        if (item.story && !item.story.match(/<\//)) {
          item.story = `<p>${item.story.replace(/\n\s*\n/gi, '</p><p>')}</p>`;
        }
        item.story = item.story.replace(/<p>\s*<\/p>/g, '');
        item.story = item.story.replace(/<br>\s*<br>/g, '</p><p>');
        if (item.poster) {
          item.poster = `https://mr-woodman.ru/heroes-list/${item.poster}`;
        }
        return item;
      });
      // Вызывать кэшированный переключатель
      const cache = this.getCachedHeroData(this.getHeroId(this.hero)) || {};
      this.currentStoryIndex = cache.currentStoryIndex || 0;
    },
    trimUrl (url) {
      return url.replace(/https*:\/\//, '');
    },
    onChangeStory (index) {
      this.currentStoryIndex = index;
      this.$refs.story.scrollTop = 0;
      // Запомним переключение
      this.setCachedHeroData(this.getHeroId(this.hero), {
        currentStoryIndex: this.currentStoryIndex
      });
    }
  }
}