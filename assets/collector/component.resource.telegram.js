import {
  recognizeRanks,
  recognizeAwards,
  recognizeFallen,
  recognizeSex,
  recognizeDates,
  recognizeContacts } from './utils.recognize.js';
import { clone, slug, equal, formatDate, debounce } from './utils.common.js';
import { downloadImage, copyFile } from './utils.resource.js';
import { Ranks, Awards } from './utils.reference.js';
import {
  getLatestMessage,
  getRemoteCards,
  getRemoteImages,
  ifMessageHasMediaPhoto,
  searchChannelByQuery } from './actions.telegram.js';
import MixinCommon from './mixin.common.js';
import ComponentStat from './component.stat.js';
import ComponentNavigation from './component.navigation.js';
import ComponentTelegramMessage from './component.telegram-message.js';
import ComponentEditor from './component.editor.js';
import ComponentActions from './component.actions.js';
import ComponentSearch from './component.search.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>Телеграм-канал &laquo;{{ channelTitle }}&raquo;</h2>
        <p><a :href="channelUrl" target="_blank">{{ displayChannelUrl }}</a></p>
      </header>

      <!-- Статистика ресурса-->
      <component-stat
        :done="stat.done"
        :total="stat.total"
        :loading="loading"
        @refresh="refreshStat">Собираем статистику...</component-stat>

      <!-- Навигация по карточкам -->
      <component-navigation
        :items="cards"
        :stat="stat"
        :loading="loading"
        @navigate="navigateCardsByAction">
      </component-navigation>

      <!-- Действия -->
      <component-actions
        :actions="generalActions"
        :action-result="generalActionResult"
        @action="doAction({ action: $event })"></component-actions>

      <!-- Поиск карточек -->
      <component-search
        v-model="searchCardsQuery"
        field-label="Поиск сообщений"
        :label="searchChannelByQueryNextRate ? 'Продолжить поиск' : 'Поиск'"
        @search="onSearchCards"></component-search>

      <!-- Карточки -->
      <ul class="cards">
        <li
          class="card"
          v-for="card in usefulCardsList"
          :key="card.id">
          <!-- Просмотр карточек -->
          <component-telegram-message
            :card="card"
            :channel="channel">
          </component-telegram-message>
          <!-- Выбор или создание нового героя -->
          <fieldset
            class="select-hero"
            :class="{
              selected: selectedCard[card.id],
              recognized: isRecognizedSelectedHero(card.id)
            }">
            <label class="input-action" title="Выбрать">
              <input type="checkbox" v-model="selectedCard[card.id]">
              <strong v-if="!selectedCard[card.id] && getRecognizedNames(card.id)">
                {{ getRecognizedNames(card.id) }}
              </strong>
            </label>
            <div class="input-group" v-if="selectedCard[card.id]">
              <input
                type="text"
                list="hero-names"
                v-model="selectedHero[card.id]"
                placeholder="Имя"
                @keyup="onSearchHero($event)"
                @keyup.enter="actionCreateHero(selectedHero[card.id])">
              <input
                type="button"
                v-if="!isRecognizedSelectedHero(card.id)"
                value="Добавить"
                @click="actionCreateHero(selectedHero[card.id])">
            </div>
          </fieldset>

          <div
            class="editor__loading-indicator muted"
            v-if="avatarLoading[card.id]">
            <span class="loading-indicator active"></span>
          </div>

          <!-- Редактирование героя -->
          <component-editor
            v-if="selectedCard[card.id] && isRecognizedSelectedHero(card.id)"
            v-model="editHeroes[selectedHero[card.id]]"
            :fields="fields"
            :actions="actions"
            :options="{
              photo: createPhotoOptions(card.photo),
              group: createGroupOptions(editHeroes[selectedHero[card.id]]),
              ancestorPoster: createAncestorPosterOptions(card.photo)
            }"
            :field-actions="{
              date: { take: createTakeDateOption(card.date) },
              rank: { take: createTakeRankOption(card.message) },
              awards: { take: createTakeAwardsOption(card.message) },
              fallen: { take: createTakeFallenOption(card.message) },
              sex: { take: createTakeSexOption(selectedHero[card.id]) },
              story: { take: card.message },
              url: { take: createTakeUrlOption(card.id) },
              ancestorStory: { take: card.message },
              ancestorUrl: { take: createTakeUrlOption(card.id) }
            }"
            @action="doAction({
              action: $event,
              name: selectedHero[card.id],
              data: editHeroes[selectedHero[card.id]],
              card: card
            })">
          </component-editor>

          <!-- Результат действий -->
          <div
            class="editor__log"
            v-if="actionsLog[card.id]">{{ actionsLog[card.id] }}</div>
        </li>
      </ul>

      <!-- Поиск карточек -->
      <component-search
        v-model="searchCardsQuery"
        :label="searchChannelByQueryNextRate ? 'Продолжить поиск' : 'Поиск'"
        @search="onSearchCards"></component-search>

      <!-- Навигация по карточкам -->
      <component-navigation
        v-if="cards.list.length"
        :items="cards"
        :stat="stat"
        :loading="loading"
        @navigate="navigateCardsByAction"></component-navigation>

      <!-- Автоподсказка (невидимая) -->
      <datalist id="hero-names">
        <option v-for="name in filteredHeroNames" :value="name"></option>
      </datalist>
    </section>
  `,
  components: {
    ComponentStat,
    ComponentNavigation,
    ComponentTelegramMessage,
    ComponentEditor,
    ComponentActions,
    ComponentSearch,
  },
  mixins: [MixinCommon],
  props: {
    channel: {
      type: String,
      required: true
    },
    channelTitle: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      loading: false,
      imageProgress: {},
      avatarLoading: {},
      recognizedNames: {},
      selectedCard: {},
      selectedHero: {},
      actionsLog: {},
      lockedUpdate: false,
      generalActions: [
        { type: 'clear-edit-heroes', label: 'Очистить кэш редактирования' },
      ],
      generalActionResult: '',
      actions: [
        { type: 'save-hero', label: 'Сохранить' },
      ],
      fields: [
        { key: 'photo', mode: 'edit', type: 'avatar', label: 'Фото', hideIfEmpty: true },
        { key: 'awards', mode: 'edit', type: 'multiselect', label: 'Награды', options: Awards.names },
        { key: 'rank', mode: 'edit', type: 'select', label: 'Звание', options: Ranks.names },
        { key: 'story', mode: 'edit', type: 'text', label: 'История' },
        { key: 'fallen', mode: 'edit', type: 'check', label: 'Погиб' },
        { key: 'date', mode: 'edit', type: 'date', label: 'Дата' },
        { key: 'group', mode: 'edit', type: 'multiselect', label: 'Товарищи по группе', options: [] },
        { key: 'sex', mode: 'edit', type: 'choice', label: 'Пол', options: [
            { value: 'мужчина', label: 'Мужчина' },
            { value: 'женщина', label: 'Женщина' }
          ]
        },
        { key: 'url', mode: 'edit', type: 'input', label: 'Ссылка' },
      ],
      searchHeroQuery: '',
      searchCardsQuery: '',
      searchChannelByQueryNextRate: 0,
    };
  },
  inject: ['confirm'],
  watch: {
    async channel () {
      await this.init();
      this.prepareFields();
    },
    selectedCard: {
      handler () {
        Object.keys(this.selectedCard).forEach(this.checkSyncEditHeroes);
      },
      deep: true
    },
    selectedHero: {
      handler () {
        Object.keys(this.selectedHero).forEach(this.checkSyncEditHeroes);
      },
      deep: true
    },
    heroes: {
      handler () {
        Object.keys(this.selectedHero).forEach(this.checkSyncEditHeroes);
      },
      deep: true
    },
    searchCardsQuery () {
      this.searchChannelByQueryNextRate = 0;
    }
  },
  computed: {
    channelUrl () {
      return `https://t.me/${this.channel}`;
    },
    displayChannelUrl () {
      return `t.me/${this.channel}`;
    },
    usefulCardsList () {
      return this.cards.list.filter(card => {
        // Не берем
        // - сообщения с пустым текстом и без приложений (напр. системное)
        // - карточки с пустым текстом и видео-приложением (все равно нечего взять)
        const hasText = Boolean(card.message);
        const hasMedia = Boolean(card.media || card.photo);
        const hasMediaVideo = (
          card.media?.className === 'MessageMediaDocument' &&
          card.media?.document.mimeType === 'video/mp4'
        );
        return hasText || (hasMedia && !hasMediaVideo);
      });
    }
  },
  async created () {
    await this.init();
    this.prepareFields();
    this.fields.filter(field => field.key === 'group')[0].options = Object.keys(this.heroes).sort();
  },
  methods: {
    async init () {
      this.loading = true;
      await this.getStat();
      await this.getCachedCards();
      if (!this.cards.list.length) {
        await this.navigateCardsByIndex(this.cards.from);
      }
      this.actionRecognizeHeroNames();
      this.loading = false;
    },
    async refreshStat () {
      this.loading = true;
      await this.getStat();
      const latestMessage = await getLatestMessage(this.channel);
      this.stat.total = latestMessage.id;
      await this.setStat();
      this.loading = false;
    },
    async getRemoteCards (from) {
      this.loading = true;
      this.cards = await getRemoteCards(this.channel, {
        from,
        limit: this.cards.limit
      });
      await this.getRemoteImages();
      await this.setCachedCards();
      await this.refreshStat();
      this.loading = false;
    },
    async getRemoteImages () {
      this.imageProgress = this.cards.list.reduce((images, message) => {
        if (ifMessageHasMediaPhoto(message)) {
          images[message.id] = true;
        }
        return images;
      }, {});
      await getRemoteImages({
        list: this.cards.list,
        callback: ({ index, url, base64, error }) => {
          if (error) {
            alert(`Ошибка с картинкой сообщения номер ${this.cards.list[index].id}: ${error.message}`);
          }
          // (Разрушить Telegram-объект, чтоб смочь изменить его)
          this.cards.list[index] = {
            ...this.cards.list[index],
            photo: (url || base64 || error),
          };
          delete this.cards.list[index].media;
          delete this.cards.list[index].originalArgs;
          this.imageProgress[this.cards.list[index].id] = false;
        }
      });
    },
    async navigateCardsByAction (type) {
      switch (type) {
        case 'first':
          await this.navigateCardsByIndex(0);
          break;
        case 'previous':
          await this.navigateCardsByIndex(this.cards.from - this.cards.limit);
          break;
        case 'current':
          await this.navigateCardsByIndex(this.cards.from);
          break;
        case 'next':
          await this.navigateCardsByIndex(this.cards.from + this.cards.limit);
          break;
        case 'last':
          await this.navigateCardsByIndex(this.stat.total - this.cards.limit);
          break;
      }
    },
    async navigateCardsByIndex (index) {
      this.loading = true;
      await this.getRemoteCards(index);
      this.actionRecognizeHeroNames();
      this.loading = false;
    },
    // syncEditHeroes () {
    //   //
    // },
    prepareFields () {
      if (this.channel === 'mod_russia') {
        const ancestorFields = this.fields.find(field => field.key.match(/ancestor/));
        if (!ancestorFields) {
          this.fields.push(
            { key: 'ancestorPoster', mode: 'edit', type: 'image', label: 'Постер #ПредковДостойны' },
            { key: 'ancestorStory', mode: 'edit', type: 'text', label: 'История #ПредковДостойны' },
            { key: 'ancestorDate', mode: 'edit', type: 'date', label: 'Дата #ПредковДостойны' },
            { key: 'ancestorUrl', mode: 'edit', type: 'input', label: 'Ссылка #ПредковДостойны' },
          );
        }
      }
    },

    //
    // Actions
    //

    async doAction ({ action, name, data, card }) {
      return ({
        'save-hero': this.actionSaveHero,
        'clear-edit-heroes': () => {
          this.clearEditHeroes();
          this.generalActionResult = 'Очищено';
        }
      })[action]({ name, data, card });
    },
    async actionCreateHero (name) {
      // Не создавать пустого или уже существующего
      if (!name || this.heroes[name]) {
        return;
      }
      // Сначала спросить
      const confirmed = await this.confirm({
        body: `Добавить героя по имени &laquo;${name}&raquo;?`
      });
      if (confirmed) {
        this.$emit('create-hero', name);
        this.actionRecognizeHeroNames();
      }
    },
    async actionSaveHero ({ name, data: update, card }) {
      this.actionsLog[card.id] = '';
      try {
        // Перенести все фотки
        await Promise.all(
          ['photo', 'ancestorPoster'].map(async field => {
            if (update[field] && typeof update[field] === 'string' && !update[field].match(/^data\/images/)) {
              const from = update[field];
              const filename = from.split('/').slice(-1)[0];
              const saveTo = `data/images/${filename}`;
              update[field] = saveTo;
              await copyFile(from, saveTo);
            }
          })
        );
        const updateHero = {
          [name]: {
            name: name || '',
            rank: update.rank || '',
            awards: clone(update.awards?.slice() || []),
            sex: update.sex || 'мужчина',
            fallen: Boolean(update.fallen),
            group: clone(update.group || []),
            resources: Object.assign({}, update.resources),
          }
        };
        if (update.date) {
          if (!update.resources[this.channel]) {
            updateHero[name].resources[this.channel] = {};
          }
          updateHero[name].resources[this.channel].date = update.date || '';
        }
        if (update.ancestorPoster || update.ancestorStory) {
          updateHero[name].resources.ancestor = {
            poster: update.ancestorPoster || '',
            story: update.ancestorStory || '',
            date: update.ancestorDate || '',
            url: update.ancestorUrl || ''
          }
        }
        this.$emit('update-heroes', clone(updateHero));
        await this.setCachedEditHeroes();
        this.actionsLog[card.id] = 'Готово';
      } catch (error) {
        this.actionsLog[card.id] = error.message;
      }
    },
    async actionRecognizeHeroNames () {
      this.cards.list.forEach(({ id, message }) => {
        if (message) {
          this.recognizedNames[id] = recognizeContacts(message, this.heroNames);
          this.selectedHero[id] = this.recognizedNames[id][0];
        }
      });
    },
    async actionDownloadPhoto (cardId, name) {
      const card = this.cards.list.find(card => {
        return Number(card.id) === Number(cardId);
      });
      if (card && card.photo && typeof card.photo === 'string' && !this.isSavedImage(card.photo)) {
        this.avatarLoading[cardId] = true;
        const filename = `${slug(name)}-${cardId}-${this.channel}.jpg`;
        const saveTo = `${this.resourceCachePath}/images/${filename}`;
        await downloadImage(card.photo, saveTo);
        card.photo = saveTo;
        this.avatarLoading[cardId] = false;
      }
    },
    async onSearchCards (query) {
      this.loading = true;
      console.log(query, this.channel);
      const result = await searchChannelByQuery({
        query,
        channel: this.channel,
        limit: this.cards.limit,
        offsetRate: this.searchChannelByQueryNextRate,
      });
      if (result.nextRate) {
        this.searchChannelByQueryNextRate = result.nextRate;
      }
      console.log(result);
      this.cards.list = result.list;
      await this.getRemoteImages();
      this.actionRecognizeHeroNames();
      await this.setCachedCards();
      // await this.refreshStat();
      this.loading = false;
    },

    //
    // Utils
    //

    isRecognizedSelectedHero (cardId) {
      return this.heroNames.includes(this.selectedHero[cardId]);
    },
    getRecognizedNames (cardId) {
      return this.recognizedNames[cardId]
        ? this.recognizedNames[cardId].join(', ')
        : '';
    },
    createPhotoOptions (photo) {
      return photo ? [photo] : []
    },
    createGroupOptions (group) {
      return group || [];
    },
    createAncestorPosterOptions (poster) {
      return poster ? [poster] : [];
    },
    createTakeDateOption (ms) {
      return formatDate(ms * 1000, 'YYYY-MM-DD');
    },
    createTakeRankOption (message) {
      return recognizeRanks(message)?.[0]?.name;
    },
    createTakeAwardsOption (message) {
      return recognizeAwards(message).map(award => award.name);
    },
    createTakeFallenOption (message) {
      return Boolean(recognizeFallen(message));
    },
    createTakeSexOption (name) {
      return recognizeSex(name);
    },
    createTakeUrlOption (cardId) {
      return `https://t.me/${this.channel}/${cardId}`;
    },
    createEditHero (name) {
      this.lockedUpdate = true;
      this.editHeroes[name] = Object.assign(
        {},
        clone(this.heroes[name] || {}),
        clone(this.heroes[name].resources?.[this.channel] || {}),
        {
          ancestorPoster: this.heroes[name]?.resources?.ancestor?.poster || '',
          ancestorStory: this.heroes[name]?.resources?.ancestor?.story || '',
          ancestorDate: this.heroes[name]?.resources?.ancestor?.date || '',
          ancestorUrl: this.heroes[name]?.resources?.ancestor?.url || '',
        }
      );
      this.lockedUpdate = false;
    },
    async checkSyncEditHeroes (cardId) {
      const name = this.selectedHero[cardId];
      const isSelected = this.selectedCard[cardId];
      const isRecognized = this.heroes[name];
      const editHeroEmpty = !this.editHeroes[name];
      if (isSelected && isRecognized && editHeroEmpty) {
        this.createEditHero(name);
      }
      if (isSelected && isRecognized) {
        await this.actionDownloadPhoto(cardId, name);
      }
      if (!isSelected) {
        this.actionsLog[cardId] = '';
      }
    }
  }
};
