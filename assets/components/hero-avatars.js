export default {
  template: `
    <div class="hero-avatars">
      <div
        class="hero-avatar_current"
        v-bind:title="'Фото ' + avatars[currentIndex].label"
        v-bind:class="[avatars[currentIndex].key]"
        v-bind:style="avatars[currentIndex].style"></div>
      <div
        v-if="!avatarKey"
        v-for="(avatar, index) in avatars"
        class="hero-avatar"
        v-bind:title="'Показать фото ' + avatar.label"
        v-bind:class="[avatar.key, { current: index === currentIndex }]"
        v-bind:style="avatar.style"
        v-on:click="onSelectAvatar(index)"></div>
    </div>
  `,
  props: {
    hero: {
      type: Object,
      required: true
    },
    avatarKey: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      photoPriority: ['tsargrad', 'kontingent', 'warheroes', 'zmil', 'ancestor'],
      current: 0,
    }
  },
  computed: {
    currentIndex () {
      if (this.avatarKey) {
        const index = this.avatars.findIndex(avatar => avatar.key === this.avatarKey);
        if (index > -1) {
          return index;
        }
      }
      return this.current;
    },
    avatars () {
      const labels = {
        tsargrad: 'телеканала «Царьград»',
        kontingent: 'военно-исторического издания «Контингент»',
        warheroes: 'проекта «Герои страны»',
        zmil: 'Министерства обороны России'
      };
      return this.photoPriority
        .filter(key => this.hero.resources[key])
        .map(key => {
          const src = this.hero.resources[key === 'ancestor' ? 'zmil' : key]?.photo;
          return {
            key: key,
            label: labels[key] + src,
            style: {
              backgroundImage: `url("https://mr-woodman.ru/heroes-list/${src}")`
            }
          };
        });
    }
  },
  methods: {
    onSelectAvatar (index) {
      this.current = index;

    }
  }
}