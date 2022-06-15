import { formatDate } from './utils.common.js';

export default {
  template: `
    <div class="telegram-message">
      <!-- Картинка -->
      <div class="telegram-message__image field-image" :class="{ saved: isSaved }">
        <img
          v-if="imageSrc"
          :src="imageSrc">
        <span
          v-else-if="imageError"
          class="error">Ошибка загрузки фото: {{ displayImageError }}</span>
        <span v-else-if="loadingImage" class="muted">
          <span>Фото</span>
          <span class="loading-indicator active"></span>
        </span>
        <strong
          v-else-if="card.media"
          class="telegram-message__media">[Вложение {{ displayMediaLabel }}]</strong>
      </div>

      <!-- Если часть альбома, показать это -->
      <fieldset
        class="telegram-message__group"
        v-if="card.groupedId"
        v-text="displayGroup"></fieldset>

      <!-- Текст сообщения -->
      <fieldset
        class="telegram-message__text"
        v-if="card.message"
        v-html="htmlText"></fieldset>

      <!-- Дата и ссылка -->
      <fieldset class="telegram-message__footer">
        <div class="telegram-message__date">{{ displayDate }}</div>
        <a
          class="telegram-message__link"
          target="_blank"
          :href="messageLink">{{ displayMessageLink }}</a>
      </fieldset>
    </div>
  `,
  props: {
    card: {
      type: Object,
      required: true
    },
    channel: {
      type: String,
      default: '(неизвестный канал)'
    },
    loadingImage: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    messageLink () {
      return `https://t.me/${this.channel}/${this.card.id}`;
    },
    displayMessageLink () {
      return `t.me/${this.channel}/${this.card.id}`;
    },
    displayDate () {
      return formatDate(this.card.date * 1000, 'D MMMM YYYY')
    },
    htmlText () {
      return `<p>${this.card.message.split(/\n\s*\n/g).join('</p><p>')}</p>`;
    },
    displayGroup () {
      const groupedId = this.card.groupedId;
      return groupedId ? `Альбом ${groupedId}` : '';
    },
    displayMediaLabel () {
      return this.card.media?.className || '';
    },
    displayImageError () {
      return this.imageError ? `${this.imageError.code}, ${this.imageError.errorMessage}` : '';
    },
    imageError () {
      return this.card.photo?.errorMessage ? this.card.photo : null;
    },
    imageSrc () {
      return typeof this.card.photo === 'string' ? this.card.photo : '';
    },
    isSaved () {
      return typeof this.card.photo === 'string' && this.card.photo.match(/^data\//);
    },
  }
}