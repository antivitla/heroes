import MixinField from './mixin.field.js';

export default {
  template: `
    <fieldset class="field-image" :mode="mode">
      <!-- Просмотр -->
      <div
        v-if="!editMode"
        class="field-image__view"
        :class="{ saved: isSaved(imageUrl) }">
        <img :src="imageUrl">
      </div>
      <!-- Редактирование -->
      <div
        v-else
        class="field-image__edit">
        <label class="input-block-label">{{ label }}</label>
        <div>
          <!-- Новая картинка  -->
          <label v-for="url in filteredOptions" class="field-image__target-image">
            <div
              :class="{ 'image-saved': isSaved(url) }"
              :title="getDisplayTitle(url)">
              <img :src="url">
            </div>
            <input type="radio" :value="url" v-model="editField">
          </label>
          <!-- Исходная картинка -->
          <label v-if="imageUrl" class="field-image__source-image">
            <div
              :class="{ 'image-saved': isSaved(imageUrl) }"
              :title="getDisplayTitle(imageUrl)">
              <img :src="imageUrl">
            </div>
            <input type="radio" :value="imageUrl" v-model="editField">
          </label>
        </div>
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
  computed: {
    imageUrl () { return this.modelValue; },
    filteredOptions () {
      return this.options.filter(option => option !== this.modelValue);
    }
  },
  methods: {
    isSaved (url) {
      return String(url)?.match(/^data\//);
    },
    getDisplayTitle (url) {
      const isSelected = url === this.modelValue;
      const isSaved = this.isSaved(url);
      return `${
        !isSelected ? 'Выбрать' : 'Выбрано'
      } (${isSaved ? 'сохранено' : 'будет сохранено'})`;
    },
  }
}

