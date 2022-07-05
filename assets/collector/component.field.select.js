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
          <template v-for="(option, index) in options">
            <option
              v-if="index > 0 && option.group !== options[index - 1].group"
              disabled>{{ delimiter }}</option>
            <option :value="option.value">{{ option.label }}</option>
          </template>
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
  },
}
