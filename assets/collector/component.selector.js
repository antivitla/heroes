export default {
  template: `
    <nav class="selector">
      <a
        v-for="tab in tabs"
        class="selector__tab"
        :group="tab.group"
        v-bind:class="{ 'active': modelValue === tab.key }"
        v-on:click="$emit('update:modelValue', tab.key)">
        <span class="selector__tab-sublabel">{{ tab.sublabel }}</span>
        <span class="selector__tab-label">{{ tab.label }}</span>
      </a>
    </nav>
  `,
  props: {
    tabs: {
      type: Array,
      required: true
    },
    modelValue: String,
  },
};
