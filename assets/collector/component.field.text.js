import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-text">
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
        <textarea rows="20" v-model="editField"></textarea>
      </div>
    </fieldset>
  `,
  mixins: [MixinField],
  props: {
    modelValue: {
      type: String,
      default: ''
    },
  },
  methods: {
    displayActionLabel (action) {
      if (action === 'take') {
        return `(Подставить сообщение)`;
      }
    }
  }
}