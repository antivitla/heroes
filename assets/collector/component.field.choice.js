import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-choice">
      <label class="input-block-label">
        <span>{{ label }}</span>
        <input
          v-if="hasAction('take') && !isDoneAction('take')"
          class="field-action"
          type="button"
          :value="displayActionLabel('take')"
          @click="onAction('take')">
      </label>
      <div class="input-choice">
        <label v-for="option in options" class="input-action">
          <input type="radio" :value="option.value" v-model="editField">
          <span>{{ option.label }}</span>
        </label>
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
        return this.options.find(option => option.value === this.fieldActions.take)?.value || '';
      }
    }
  }
}
