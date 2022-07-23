export default {
  template: `
    <div class="hero-awards">
      <div class="hero-awards__names">{{ names.join(', ') }}</div>
      <div class="hero-awards__images">
        <img
          v-for="(image, index) in images"
          v-bind:src="image"
          v-bind:title="names[index]"
          class="hero-awards__image"
          height="80">
      </div>
    </div>
  `,
  inject: ['awardsReference'],
  props: {
    hero: Object
  },
  computed: {
    names () {
      return this.hero.awards;
    },
    images () {
      return this.hero.awards.map(award => {
        if (this.awardsReference[award]) {
          return `https://mr-woodman.ru/references/${this.awardsReference[award]?.images[0].main}`;
        }
      }).filter(image => image);
    }
  }
}
