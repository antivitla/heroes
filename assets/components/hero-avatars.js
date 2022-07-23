export default {
  template: `
    <div class="hero-avatars">
      <div
        v-for="avatar in avatars"
        v-bind:class="avatar.class"
        v-bind:style="avatar.style"></div>
    </div>
  `,
  props: {
    hero: Object
  },
  computed: {
    avatars () {
      return ['tsargrad', 'kontingent', 'warheroes', 'zmil']
        .filter(key => this.hero.resources[key]?.photo)
        .map(key => {
          const src = this.hero.resources[key]?.photo;
          return {
            class: `hero-avatar ${key}`,
            style: {
              backgroundImage: `url(https://mr-woodman.ru/heroes-list/${src})`
            }
          };
        });
    }
  }
}