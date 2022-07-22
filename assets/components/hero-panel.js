export default {
  template: `
    <div class="panel hero-panel">
      <header class="panel-header">
        <h2>{{ hero.name }}</h2>
        <button class="action-transparent close" v-on:click="$emit('close')">&times;</button>
      </header>
      <main class="panel-main">
        <div>{{ hero.rank }}</div>
      </main>
    </div>
  `,
  props: {
    hero: {
      type: Object,
      required: true
    }
  },
}