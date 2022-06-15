import { formatDate } from './utils.common.js';
import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-date">
      <label class="input-block-label">
        <span>{{ label }}</span>
        <input
          v-if="hasAction('take') && !isDoneAction('take')"
          class="field-action"
          type="button"
          :value="displayActionLabel('take')"
          @click="onAction('take')">
      </label>
      <div class="input-block">
        <input type="date" v-model="editField">
      </div>
    </fieldset>
  `,
  mixins: [MixinField],
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  methods: {
    displayActionLabel (action) {
      if (action === 'take') {
        return `${formatDate(new Date(this.fieldActions['take']).getTime(), 'DD.MM.YYYY')}`;
      }
    }
  }
}