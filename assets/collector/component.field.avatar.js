export default {
  template: `
    <fieldset class="field-avatar" :mode="mode">
      <!-- Просмотр -->
      <div class="field-avatar__view" v-if="!editMode">
        <div
          class="field-avatar__image"
          :class="{ saved: isSaved(imageUrl) }"
          :title="getDisplayTitle(imageUrl)"
          :style="getAvatarStyle(imageUrl)"></div>
      </div>
      <!-- Редактирование -->
      <div class="field-avatar__edit" v-else>
        <label class="input-block-label">Фото</label>
        <div class="input-block">
          <!-- Новые фотки (если выберут) -->
          <label
            v-for="optionUrl in filteredOptions"
            class="field-avatar__target-photo">
            <div
              class="field-avatar__image no-filter"
              :class="{ saved: isSaved(optionUrl) }"
              :title="getDisplayTitle(optionUrl)"
              :style="getAvatarStyle(optionUrl)"></div>
            <input
              type="radio"
              name="avatar"
              :value="optionUrl"
              v-model="selectedPhoto">
          </label>
          <!-- Исходная фотка -->
          <label v-if="imageUrl" class="field-avatar__source-photo">
            <div
              class="field-avatar__image no-filter"
              :class="{ saved: isSaved(imageUrl) }"
              :title="getDisplayTitle(imageUrl)"
              :style="getAvatarStyle(imageUrl)"></div>
            <input
              type="radio"
              name="avatar"
              :value="imageUrl"
              v-model="selectedPhoto">
          </label>
        </div>
      </div>
    </fieldset>
  `,
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    mode: {
      type: String,
      default: 'view'
    },
    options: {
      type: Array,
      default: []
    },
  },
  data () {
    return {
      selectedPhoto: '',
      isUpdateLocked: false,
    }
  },
  watch: {
    modelValue () {
      this.sync();
    },
    selectedPhoto () {
      if (!this.isUpdateLocked) {
        this.$emit('update:modelValue', this.selectedPhoto);
      }
    }
  },
  computed: {
    imageUrl () { return this.modelValue; },
    editMode () { return this.mode === 'edit'; },
    filteredOptions () {
      return this.options.filter(option => option !== this.modelValue);
    }
  },
  created () {
    this.sync();
  },
  methods: {
    sync () {
      this.isUpdateLocked = true;
      this.selectedPhoto = this.modelValue;
      this.isUpdateLocked = false;
    },
    getAvatarStyle (url) {
      return {
        'background-image': `url("${String(url)}")`
      };
    },
    isSaved (url) {
      return String(url)?.match(/^data\//gi);
    },
    getDisplayTitle (url) {
      const isSelected = url === this.selectedPhoto;
      const isSaved = this.isSaved(url);
      return `${
        !isSelected ? 'Выбрать' : 'Выбрано'
      } (${isSaved ? 'сохранено' : 'будет сохранено'})`;
    },
  }
}