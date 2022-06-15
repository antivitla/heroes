import { Awards } from './utils.reference.js';
export default {
  template: `
    <div class="preview-awards">
      <div class="preview-awards__list">
        <img v-for="(src, index) in awardImageList" :src="src" :title="modelValue[index]">
      </div>
    </div>
  `,
  props: {
    modelValue: {
      type: Array,
      default: []
    }
  },
  computed: {
    awardImageList () {
      return this.modelValue.map(name => Awards.map[name].images[0]?.main);
    }
  }
}