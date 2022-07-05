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
        :total="stat.total"
        :loading="loading"
        @refresh="refreshStat">Собираем статистику...</component-stat>

      <!-- Навигация по карточкам -->
      <component-navigation
        :items="cards"
        :stat="stat"
        :loading="loading"
        @navigate="navigateCardsByAction"></component-navigation>

      <!-- Действия -->
      <component-actions
        v-if="globalActions.length"
        :actions="globalActions"
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
        <li class="card" v-for="card in usefulCardsList" :key="card.id">
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
              recognized: recognizedHeroFromCard(card.id)
            }">
            <label class="input-action" title="Выбрать">
              <input type="checkbox" v-model="selectedCard[card.id]">
              <strong v-if="!selectedCard[card.id] && getRecognizedNames(card.id)">
                {{ getRecognizedNames(card.id) }}
              </strong>
            </label>
            <div class="input-actions" v-if="selectedCard[card.id]">
              <select v-model="cardHeroId[card.id]">
                <option :value="undefined" disabled selected>Выбрать</option>
                <option
                  v-for="option in selectHeroOptions"
                  :value="option.value">{{ option.label }}</option>
              </select>
              <input
                type="button"
                value="Новый"
                @click="actionCreateHero(card.id)">
            </div>
          </fieldset>
          <div
            class="editor__loading-indicator muted"
            v-if="avatarLoading[card.id]">
            <span class="loading-indicator active"></span>
          </div>

          <!-- Редактирование героя -->
          <component-editor
            v-if="selectedCard[card.id] && recognizedHeroFromCard(card.id)"
            v-model="editHeroes[cardHeroId[card.id]]"
            :fields="fields"
            :actions="heroActions"
            :options="{
              photo: createPhotoOptions(card.photo),
              group: createGroupOptions(editHeroes[cardHeroId[card.id]]),
              ancestorPoster: createAncestorPosterOptions(card.photo)
            }"
            :field-actions="{
              date: { take: createTakeDateOption(card.date) },
              rank: { take: createTakeRankOption(card.message) },
              awards: { take: createTakeAwardsOption(card.message) },
              fallen: { take: createTakeFallenOption(card.message) },
              sex: { take: createTakeSexOption(cardHeroId[card.id]) },
              story: { take: card.message },
              url: { take: createTakeUrlOption(card.id) },
              ancestorStory: { take: card.message },
              ancestorUrl: { take: createTakeUrlOption(card.id) }
            }"
            @action="doAction({
              action: $event,
              cardHeroId: cardHeroId[card.id],
              hero: editHeroes[cardHeroId[card.id]],
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
      // selectedCard: {},
      // selectedHero: {},
      // actionsLog: {},
      lockedUpdate: false,
      globalActions: [
        { type: 'clear-edit-heroes', label: 'Очистить кэш редактирования' },
      ],
      generalActionResult: '',
      heroActions: [
        { type: 'save-hero', label: 'Сохранить' },
      ],
      fields: [
        { key: 'photo', mode: 'edit', type: 'avatar', label: 'Фото', hideIfEmpty: true },
        { key: 'awards', mode: 'edit', type: 'multiselect', label: 'Награды', options: [] },
        { key: 'rank', mode: 'edit', type: 'select', label: 'Звание', options: [] },
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
      this.prepareAncestorFields();
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
  // async created () {
  //   this.cards = this.createInitialCards();
  //   this.stat = this.createInitialStat();
  //   await this.init();
  //   this.prepareFieldsOptions();
  // },
  async created () {
    this.prepareAncestorFields();
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
    prepareAncestorFields () {
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
    // async navigateCardsByAction (type) {
    //   switch (type) {
    //     case 'first':
    //       await this.navigateCardsByIndex(0);
    //       break;
    //     case 'previous':
    //       await this.navigateCardsByIndex(this.cards.from - this.cards.limit);
    //       break;
    //     case 'current':
    //       await this.navigateCardsByIndex(this.cards.from);
    //       break;
    //     case 'next':
    //       await this.navigateCardsByIndex(this.cards.from + this.cards.limit);
    //       break;
    //     case 'last':
    //       await this.navigateCardsByIndex(this.stat.total - this.cards.limit);
    //       break;
    //   }
    // },
    async navigateCardsByIndex (index) {
      this.loading = true;
      await this.getRemoteCards(index);
      this.actionRecognizeHeroNames();
      this.loading = false;
    },
    // syncEditHeroes () {
    //   //
    // },


    //
    // Actions
    //

    async doAction ({ action, cardHeroId, hero, card }) {
      return ({
        'save-hero': this.actionSaveHero,
        'clear-edit-heroes': () => {
          this.clearEditHeroes();
          this.generalActionResult = 'Очищено';
        }
      })[action]({ cardHeroId, hero, card });
    },
    // async actionCreateHero (name) {
    //   // Не создавать пустого или уже существующего
    //   if (!name || this.heroes[name]) {
    //     return;
    //   }
    //   // Сначала спросить
    //   const confirmed = await this.confirm({
    //     body: `Добавить героя по имени &laquo;${name}&raquo;?`
    //   });
    //   if (confirmed) {
    //     this.$emit('create-hero', name);
    //     this.actionRecognizeHeroNames();
    //   }
    // },
    async actionSaveHero ({ cardHeroId, hero, card }) {
      this.actionsLog[card.id] = '';
      try {
        // Перенести все фотки
        await Promise.all(
          ['photo', 'ancestorPoster'].map(async field => {
            if (hero[field] && typeof hero[field] === 'string' && !hero[field].match(/^data\/images/)) {
              const from = hero[field];
              const filename = from.split('/').slice(-1)[0];
              const to = `data/images/${filename}`;
              hero[field] = to;
              await copyFile(from, to);
            }
          })
        );
        const update = {
          resourceKey: this.resourceKey,
          list: [{
            name: hero.name || '',
            rank: hero.rank || '',
            awards: clone(hero.awards?.slice() || []),
            sex: hero.sex || 'мужчина',
            fallen: Boolean(hero.fallen),
            group: clone(hero.group || []),
            resources: Object.assign({}, hero.resources),
          }]
        };
        if (hero.date) {
          if (!hero.resources[this.resourceKey]) {
            update.list[0].resources[this.resourceKey] = {};
          }
          update.list[0].resources[this.resourceKey].date = hero.date || '';
        }
        if (hero.ancestorPoster || hero.ancestorStory) {
          update.list[0].resources.ancestor = {
            poster: hero.ancestorPoster || '',
            story: hero.ancestorStory || '',
            date: hero.ancestorDate || '',
            url: hero.ancestorUrl || '',
            id: hero.ancestorUrl || ''
          }
        }
        this.$emit('update-heroes', update);
        await this.setCachedEditHeroes();
        this.actionsLog[card.id] = 'Готово';
      } catch (error) {
        this.actionsLog[card.id] = error.message;
      }
    },
    async actionRecognizeHeroNames () {
      this.cards.list.forEach(({ id, message }) => {
        if (message) {
          this.recognizedNames[id] = recognizeContacts(
            message,
            this.recognizeHeroNamesOptions
          );
          this.cardHeroId[id] = this.getHeroesIdsByName(this.recognizedNames[id][0])[0];
        }
      });
    },
    async actionDownloadPhoto (card, hero) {
      if (card && card.photo && typeof card.photo === 'string' && !this.isSavedImage(card.photo)) {
        this.avatarLoading[card.id] = true;
        const filename = `${slug(hero.name)}-${card.id}-${this.resourceKey.replace('.','-')}.jpg`;
        const saveTo = `${this.resourceCachePath}/images/${filename}`;
        await downloadImage(card.photo, saveTo);
        card.photo = saveTo;
        this.avatarLoading[card.id] = false;
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

    // recognizedHeroFromCard (cardId) {
    //   return this.heroNames.includes(this.selectedHero[cardId]);
    // },
    // getRecognizedNames (cardId) {
    //   return this.recognizedNames[cardId]
    //     ? this.recognizedNames[cardId].join(', ')
    //     : '';
    // },
    // createPhotoOptions (photo) {
    //   return photo ? [photo] : []
    // },
    // createGroupOptions (group) {
    //   return group || [];
    // },
    // createAncestorPosterOptions (poster) {
    //   return poster ? [poster] : [];
    // },
    createTakeDateOption (ms) {
      return formatDate(ms * 1000, 'YYYY-MM-DD');
    },
    createTakeRankOption (message) {
      return recognizeRanks(message)?.[0]?.name;
    },
    // createTakeAwardsOption (message) {
    //   return recognizeAwards(message).map(award => award.name);
    // },
    // createTakeFallenOption (message) {
    //   return Boolean(recognizeFallen(message));
    // },
    // createTakeSexOption (name) {
    //   return recognizeSex(name ||);
    // },
    createTakeUrlOption (cardId) {
      return `https://t.me/${this.channel}/${cardId}`;
    },


    // createEditHero (name) {
    //   this.editHeroes[name] = Object.assign(
    //     {},
    //     clone(this.heroes[name] || {}),
    //     clone(this.heroes[name].resources?.[this.channel] || {}),
    //     {
    //       ancestorPoster: this.heroes[name]?.resources?.ancestor?.poster || '',
    //       ancestorStory: this.heroes[name]?.resources?.ancestor?.story || '',
    //       ancestorDate: this.heroes[name]?.resources?.ancestor?.date || '',
    //       ancestorUrl: this.heroes[name]?.resources?.ancestor?.url || '',
    //     }
    //   );
    // },
    async checkSyncEditHeroes (cardId) {
      // const name = this.selectedHero[cardId];
      const card = this.cards.list.find(card => card.id === cardId) || {};
      const isSelected = this.selectedCard[cardId];
      const recognizedHero = this.recognizedHeroFromCard(cardId);
      const editHero = this.editHeroes[this.cardHeroId[cardId]];
      const editHeroEmpty = !editHero;
      const editHeroEmptyCardData = editHero && (
        !editHero.url ||
        !editHero.photo ||
        !editHero.story ||
        !editHero.id
      );
      const cardClone = clone(card);
      delete cardClone.name;

      if (isSelected && recognizedHero && editHeroEmpty) {
        // Создать микс из существующего героя и новых данных
        this.editHeroes[this.cardHeroId[cardId]] = Object.assign(
          {},
          cardClone,
          clone(recognizedHero),
          clone(recognizedHero.resources?.zmil || {}),
          clone(recognizedHero.resources?.[this.resourceKey] || {}),
          {
            ancestorPoster: recognizedHero.resources?.ancestor?.poster || '',
            ancestorStory: recognizedHero.resources?.ancestor?.story || '',
            ancestorDate: recognizedHero.resources?.ancestor?.date || '',
            ancestorUrl: recognizedHero.resources?.ancestor?.url || '',
          }
        );
      } else if (isSelected && recognizedHero && editHeroEmptyCardData) {
        Object.assign(this.editHeroes[this.cardHeroId[cardId]], cardClone);
      }
      if (isSelected && recognizedHero) {
        await this.actionDownloadPhoto(card, clone(recognizedHero));
      }
      if (!isSelected) {
        this.actionsLog[cardId] = '';
      }
      await this.setCachedEditHeroes();
    }
  }
};
