export default {
  template: `
    <fieldset class="field-title">
      <h3>{{ title }}</h3>
    </fieldset>
  `,
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  computed: {
    title () { return this.modelValue; },
  }
}
