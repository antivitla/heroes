import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-check">
      <div class="input-block">
        <label class="input-action">
          <input type="checkbox" v-model="editField">
          <span>{{ label }}</span>
        </label>

        <input
          v-if="hasAction('take') && !isDoneAction('take')"
          class="field-action"
          type="button"
          :value="displayActionLabel('take')"
          @click="onAction('take')">
      </div>
    </fieldset>
  `,
  mixins: [MixinField],
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    displayActionLabel (action) {
      if (action === 'take') {
        return this.label;
      }
    }
  }
}