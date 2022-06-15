import { clone, equal } from './utils.common.js';
import ComponentFieldAvatar from './component.field.avatar.js';
import ComponentFieldTitle from './component.field.title.js';
import ComponentFieldMultiselect from './component.field.multiselect.js';
import ComponentFieldSelect from './component.field.select.js';
import ComponentFieldText from './component.field.text.js';
import ComponentFieldInput from './component.field.input.js';
import ComponentFieldDate from './component.field.date.js';
import ComponentFieldImage from './component.field.image.js';
import ComponentFieldChoice from './component.field.choice.js';
import ComponentFieldCheck from './component.field.check.js';
import ComponentFieldPreviewAwards from './component.field.preview-awards.js';
import ComponentActions from './component.actions.js';

export default {
  template: `
    <form class="editor">
      <component
        v-for="field in filteredFields"
        :is="getFieldComponent(field)"
        :options="field.options || options[field.key]"
        :optional="field.optional"
        :label="getFieldLabel(field)"
        :class="field.class"
        :mode="field.mode"
        :field-actions="fieldActions[field.key]"
        v-model="editFields[field.key]"></component>
      <component-actions
        v-if="actions.length"
        :actions="actions"
        @action="$emit('action', $event)"></component-actions>
    </form>
  `,
  components: {
    ComponentFieldAvatar,
    ComponentFieldTitle,
    ComponentFieldMultiselect,
    ComponentFieldSelect,
    ComponentFieldText,
    ComponentFieldInput,
    ComponentFieldDate,
    ComponentFieldImage,
    ComponentFieldChoice,
    ComponentFieldCheck,
    ComponentFieldPreviewAwards,
    ComponentActions,
  },
  props: {
    modelValue: {
      type: Object,
      default: null
    },
    fields: {
      type: Array,
      default: []
    },
    actions: {
      type: Array,
      default: []
    },
    options: {
      type: Object,
      default: {}
    },
    fieldActions: {
      type: Object,
      default: {}
    }
  },
  data () {
    return {
      editFields: {},
      isUpdateLocked: false
    };
  },
  watch: {
    modelValue: {
      handler () {
        this.syncFrom(this.modelValue);
      },
      deep: true
    },
    editFields: {
      handler () {
        if (!this.isUpdateLocked) {
          this.emitUpdate();
        }
      },
      deep: true
    },
  },
  computed: {
    filteredFields () {
      return this.fields.filter(field => {
        return !field.hideIfEmpty || !this.isEmptyField(field);
      });
    }
  },
  created () {
    this.syncFrom(this.modelValue);
  },
  methods: {
    getFieldComponent (field) {
      return `component-field-${field.type}`;
    },
    getFieldLabel (field) {
      if (field.key === 'fallen' && this.editFields.sex === 'женщина') {
        return `${field.label}ла`;
      } else {
        return field.label;
      }
    },
    isEmptyField (field) {
      const hasModelValue = this.editFields[field.key];
      const hasOptions = field.options || (
        this.options[field.key] && this.options[field.key].length
      );
      return !hasModelValue && !hasOptions;
    },
    syncFrom (source) {
      this.isUpdateLocked = true;
      if (!source) {
        this.editFields = {};
      } else {
        this.fields.forEach(field => {
          if (source[field.key] && !equal(this.editFields[field.key], source[field.key])) {
            this.editFields[field.key] = clone(source[field.key]);
          }
        });
      }
      this.isUpdateLocked = false;
    },
    emitUpdate () {
      const update = Object.assign({}, this.modelValue, this.editFields);
      this.$emit('update:modelValue', update);
    }
  }
}