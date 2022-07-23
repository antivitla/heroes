import HcHeroAvatars from './hero-avatars.js';
import HcHeroAwards from './hero-awards.js';

export default {
  template: `
    <div class="modal-hero">
      <header class="modal-header">
        <hc-hero-avatars v-bind:hero="hero"></hc-hero-avatars>
        <h2 class="hero-name">{{ hero.name }}</h2>
        <div class="hero-rank">{{ hero.rank }}</div>
        <hc-hero-awards v-bind:hero="hero" v-if="hero.awards.length"></hc-hero-awards>
      </header>
      <main class="modal-main">
        <div v-html="hero.resources.zmil?.story || hero.resources.warheroes?.story || hero.resources.tsargrad?.story"></div>
      </main>
      <button
        class="action_icon action_text modal-close"
        v-on:click="$emit('close')">
        &times;
      </button>
    </div>
  `,
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
  computed: {
    hero () {
      return this.options.hero;
    }
  },
}