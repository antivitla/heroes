export default {
  props: {
    fieldActions: {
      type: Object,
      default: {}
    },
    label: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      default: []
    },
    mode: {
      type: String,
      default: ''
    },
  },
  data () {
    return {
      editField: null,
      isUpdateLocked: false
    };
  },
  watch: {
    modelValue () {
      this.sync();
    },
    editField () {
      if (!this.isUpdateLocked) {
        this.$emit('update:modelValue', this.editField);
      }
    }
  },
  computed: {
    editMode () { return this.mode === 'edit'; },
    delimiter () {
      const l = this.options.reduce((length, option) => {
        return Math.max(length, option.label.length);
      }, 0);
      return '─'.repeat(l / 3);
    }
  },
  created () {
    this.sync();
  },
  methods: {
    sync () {
      this.isUpdateLocked = true;
      this.editField = this.modelValue;
      this.isUpdateLocked = false;
    },
    hasAction (action) {
      if (Array.isArray(this.fieldActions[action])) {
        return this.fieldActions[action].length;
      } else {
        return this.fieldActions[action];
      }
    },
    isDoneAction (action) {
      if (action === 'take') {
        return this.editField === this.fieldActions['take'];
      }
    },
    displayActionLabel (action) {
      return this.fieldActions[action];
    },
    onAction (action) {
      if (action === 'take') {
        this.editField = this.fieldActions['take'];
      }
    }
  }
}