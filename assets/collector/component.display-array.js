import { capitalizeFirstLetter } from './utils.common.js';

export default {
  template: `
    <span>
      <span v-for="(item, index) in array">
        <span
          :class="'color-' + item"
        >{{ capitalizeFirstLetter(item) }}</span><span
          v-if="(index < array.length - 1) && delimiter"
          v-html="delimiter"
        ></span>
      </span>
    </span>
  `,
  props: {
    array: {
      type: Array,
      required: true
    },
    delimiter: {
      type: String,
      default: ', '
    }
  },
  methods: {
    capitalizeFirstLetter
  }
}