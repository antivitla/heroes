import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-select">
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
        <select v-model="editField" :class="{ muted: !editField }">
          <option value="" disabled>(Выбрать)</option>
          <option v-for="option in options" :value="option">{{ option }}</option>
        </select>
      </div>
    </fieldset>
  `,
  mixins: [MixinField],
  props: {
    modelValue: {
      type: String,
      default: ''
    },
  }
}
