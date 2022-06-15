import { clone, equal } from './utils.common.js';
import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-multiselect">
      <label class="input-block-label">
        <span>{{ label }}</span>
        <input
          v-if="hasAction('take') && !isDoneAction('take')"
          class="field-action"
          type="button"
          :value="displayActionLabel('take')"
          @click="onAction('take')">
      </label>
      <div
        class="input-group"
        v-if="editField.length"
        v-for="(item, index) in editField">
        <select v-model="editField[index]">
          <option v-for="option in options" :value="option">{{ option }}</option>
        </select>
        <input type="button" @click="removeItem(index)" value="Удалить">
      </div>

      <div class="input-block">
        <select v-model="addItem" class="muted">
          <option value="" disabled selected>(Добавить)</option>
          <option v-for="option in options" :value="option">{{ option }}</option>
        </select>
      </div>
    </fieldset>
  `,
  mixins: [MixinField],
  props: {
    modelValue: {
      type: Array,
      default: []
    },
  },
  data () {
    return {
      editField: [],
      addItem: '',
    };
  },
  watch: {
    modelValue: {
      handler () {
        this.sync();
      },
      deep: true
    },
    editField: {
      handler () {
        if (!this.isUpdateLocked) {
          this.$emit('update:modelValue', this.editField);
        }
      },
      deep: true,
    },
    addItem (item) {
      if (item) {
        this.editField.push(item);
        this.addItem = '';
      }
    },
  },
  methods: {
    removeItem (index) {
      this.editField.splice(index, 1);
    },
    sync () {
      this.isUpdateLocked = true;
      if (!this.modelValue) {
        this.editField = [];
      } else {
        if (!equal(this.modelValue, this.editField)) {
          this.editField = clone(this.modelValue || []);
        }
      }
      this.isUpdateLocked = false;
    },
    displayActionLabel (action) {
      if (action === 'take') {
        return this.fieldActions.take.join(', ');
      }
    },
    isDoneAction (action) {
      if (action === 'take') {
        return equal(this.editField, this.fieldActions.take);
      }
    }
  },
}
