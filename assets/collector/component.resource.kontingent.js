import {
  getJsonDocument,
  saveJsonDocument,
  getHtmlBodyFragmentFromUrl,
  downloadImage,
  copyFile } from './utils.resource.js';
import {
  recognizeRanks,
  recognizeAwards,
  recognizeFallen,
  recognizeSex,
  recognizeDates,
  recognizeContacts } from './utils.recognize.js';
import { clone, slug, equal, formatDate } from './utils.common.js';
import { Ranks, Awards } from './utils.reference.js';
import { getOurHeroesList } from './actions.kontingent.js';
import MixinCommon from './mixin.common.js';
import ComponentStat from './component.stat.js';
import ComponentNavigation from './component.navigation.js';
import ComponentEditor from './component.editor.js';
import ComponentFieldPreviewAwards from './component.field.preview-awards.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>Проект &laquo;Герои Z&raquo; издания &laquo;Контингент&raquo;</h2>
        <p><a
          href="https://ug.tsargrad.tv/ourheroes"
          target="_blank">ug.tsargrad.tv/ourheroes</a></p>
      </header>

      <!-- Статистика ресурса -->
      <component-stat
        :done="stat.done"
        :total="stat.total"
        :loading="loading"
        @refresh="refreshCards">Собираем статистику...</component-stat>

      <!-- Навигация по карточкам-->
      <component-navigation
        :items="cards"
        :stat="stat"
        @navigate="navigateCardsByAction"></component-navigation>

      <!-- Карточки -->
      <ul class="cards">
        <li v-for="card in cards.list" class="card" :key="card.id">

          <fieldset class="field-image" :class="{ saved: isSavedImage(card.photo) }">
            <img :src="card.photo" width="100%">
          </fieldset>

          <fieldset class="field-title" style="padding-right: 2rem;">
            <h3>{{ card.name }}</h3>
            <p>{{ card.rank }}</p>
          </fieldset>

          <fieldset>
            <label class="input-block-label">История</label>
            <div v-html="editHeroes[card.name]?.story" style="height: 300px; overflow: scroll; white-space: pre-line;"></div>
          </fieldset>

          <!-- Выбор куда сохранять -->
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
                @keyup="onSearchHero($event, card.id)"
                @keyup.enter="actionCreateHero(selectedHero[card.id])">
              <input
                type="button"
                v-if="!isRecognizedSelectedHero(card.id)"
                value="Добавить"
                @click="actionCreateHero(selectedHero[card.id])">
            </div>
          </fieldset>

          <!-- Редактирование -->
          <component-editor
            v-if="selectedCard[card.id] && isRecognizedSelectedHero(card.id)"
            v-model="editHeroes[selectedHero[card.id]]"
            :fields="fields"
            :actions="heroActions"
            :options="{
              photo: createPhotoOptions(card.photo),
            }"
            :field-actions="{
              date: { take: createTakeDateOption(card.story) },
              rank: { take: createTakeRankOption(card) },
              awards: { take: createTakeAwardsOption(card.story) },
              fallen: { take: createTakeFallenOption(card.story) },
              sex: { take: createTakeSexOption(selectedHero[card.id]) },
              story: { take: card.story },
              url: { take: card.url }
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

      <!-- Навигация по карточкам-->
      <component-navigation
        v-if="cards.list.length"
        :items="cards"
        :stat="stat"
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
    ComponentEditor,
    ComponentFieldPreviewAwards,
  },
  mixins: [MixinCommon],
  inject: ['confirm'],
  data () {
    return {
      allCards: [],
      recognizedNames: {},
      selectedHero: {},
      selectedCard: {},
      actionsLog: {},
      heroActions: [
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
        { key: 'artist', mode: 'edit', type: 'input', label: 'Иллюстратор' },
        { key: 'url', mode: 'edit', type: 'input', label: 'Ссылка' },
      ],
    };
  },
  watch: {
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
    }
  },
  computed: {
    //
  },
  async created () {
    await this.init();
    this.fields.filter(field => field.key === 'group')[0].options = this.heroNames;
  },
  methods: {
    async init () {
      await this.getCachedAllCards();
      if (!this.allCards.length) {
        this.loading = true;
        await this.getRemoteAllCards();
        await this.setCachedAllCards();
      }
      await this.getCachedEditHeroes();
      await this.getCachedCards();
      if (!this.cards.to || !this.cards.list.length) {
        const { from, limit } = this.cards;
        this.navigateCardsByIndex(from);
      }
      this.actionRecognizeHeroNames();
      this.loading = false;
    },
    async getCachedAllCards () {
      this.allCards = await getJsonDocument(
        `${this.resourceCachePath}/all-cards.json`,
        []
      );
      await this.getStat();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async setCachedAllCards () {
      return saveJsonDocument(
        `${this.resourceCachePath}/all-cards.json`,
        this.allCards
      );
    },
    async getRemoteAllCards () {
      this.loading = true;
      await this.getStat();
      this.allCards = await getOurHeroesList({
        callback: ({ total }) => {
          this.stat.total = total;
        }
      });
      this.loading = false;
      this.actionRecognizeHeroNames();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async refreshCards () {
      this.loading = true;
      await this.getRemoteAllCards();
      await this.setCachedAllCards();
      this.loading = false;
    },
    async navigateCardsByAction (action) {
      switch (action) {
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
    async navigateCardsByIndex(from, to, limit) {
      this.cards.from = from || 0;
      this.cards.limit = limit || this.defaultCardsLimit;
      this.cards.to = to || (this.cards.from + this.cards.limit);
      this.cards.list = this.allCards.slice(this.cards.from, this.cards.to);
      this.loading = true;
      await this.syncEditHeroes();
      this.actionRecognizeHeroNames();
      await this.setCachedEditHeroes();
      await this.setCachedCards();
      this.loading = false;
    },
    async syncEditHeroes () {
      this.isUpdateLocked = true;
      await Promise.all(this.cards.list.map(async card => {
        const fragment = await getHtmlBodyFragmentFromUrl(card.url);
        const json = JSON.parse(fragment.querySelector('script#__NEXT_DATA__').textContent);
        const pageData = json.props.pageProps;
        card.rank = recognizeRanks(pageData.imageCaption)[0]?.name || '';
        card.photo = pageData.image_url;
        card.artist = `Иллюстрация ${pageData.imageCaption.split('Иллюстрация ')[1].replace('.', '').trim()}`;
        card.id = slug(card.name);

        const template = document.createElement('template');
        template.innerHTML = pageData.content
          .replace(/ /gi, ' ')
          .replace(/<br \/>/gi, '<br><br>')
          .replace(/&nbsp;/gi, ' ');
        card.story = template.content.textContent.trim();
        if (card.name.match(/алла/)) {
          console.log(card.story, pageData.content);
        }
      }));
      this.editHeroes = this.cards.list.reduce((map, card) => {
        map[card.name] = Object.assign(
          {
            name: card.name,
            rank: card.rank,
            photo: card.photo,
            artist: card.artist,
            story: card.story,
            url: card.url,
          },
          clone(this.heroes[card.name] || {}),
          clone(this.heroes[card.name]?.resources?.kontingent || {})
        );
        return map;
      }, {});
      this.isUpdateLocked = false;
    },
    isRecognizedSelectedHero (cardId) {
      return this.heroNames.includes(this.selectedHero[cardId]);
    },
    getRecognizedNames (cardId) {
      return this.recognizedNames[cardId]
        ? this.recognizedNames[cardId].join(', ')
        : '';
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
    async actionRecognizeHeroNames () {
      this.cards.list.forEach(({ id, name }) => {
        this.recognizedNames[id] = recognizeContacts(
          name.split(/\s+/).slice(0, 2).join(' '),
          this.heroNames
        );
        this.selectedHero[id] = this.recognizedNames[id][0];
      });
    },
    async actionSaveHero ({ name, data: update, card }) {
      this.actionsLog[card.id] = '';
      try {
        // Перенести все фотки
        await Promise.all(
          ['photo'].map(async field => {
            if (update[field] && !update[field].match(/^data\/images/)) {
              const from = update[field];
              const filename = from.split('/').slice(-1)[0];
              const saveTo = `data/images/${filename.toLowerCase()}`;
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
            resources: Object.assign({}, update.resources, {
              kontingent: {
                photo: update.photo || '',
                artist: update.artist || '',
                story: update.story || '',
                date: update.date || '',
                url: update.url || 'https://ug.tsargrad.tv/ourheroes'
              }
            })
          }
        };
        this.$emit('update-heroes', clone(updateHero));
        await this.setCachedEditHeroes();

        this.actionsLog[card.id] = 'Готово';
      } catch (error) {
        this.actionsLog[card.id] = error.message;
      }
    },
    async actionDownloadPhoto (cardId, name) {
      const card = this.cards.list.find(card => card.id === cardId);
      if (card && card.photo && !this.isSavedImage(card.photo)) {
        // this.avatarLoading[cardId] = true;
        const filename = `${slug(name)}-${cardId}-kontingent.jpg`;
        const saveTo = `${this.resourceCachePath}/images/${filename}`;
        await downloadImage(card.photo, saveTo);
        card.photo = saveTo;
        // this.avatarLoading[cardId] = false;
      }
    },
    async doAction ({ action, name, data, card }) {
      return ({
        'save-hero': this.actionSaveHero,
      })[action]({ name, data, card });
    },
    createEditHero (name) {
      this.lockedUpdate = true;
      this.editHeroes[name] = Object.assign(
        {},
        clone(this.heroes[name]),
        clone(this.heroes[name].resources?.kontingent)
      );
      this.lockedUpdate = false;
    },
    onSearchHero (event, cardId) {
      clearTimeout(this.timeoutSearchHero);
      this.timeoutSearchHero = setTimeout(() => {
        if (event.target.value.length <= 3) {
          this.searchHeroQuery = '';
        } else {
          this.searchHeroQuery = event.target.value;
        }
      }, 300);
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
    createTakeDateOption (story) {
      return formatDate(recognizeDates(story).slice(-1)[0], 'YYYY-MM-DD');
    },
    createTakeRankOption (card) {
      return card.rank;
    },
    createTakeAwardsOption (story) {
      return recognizeAwards(story).map(award => award.name);
    },
    createTakeFallenOption (story) {
      return Boolean(recognizeFallen(story));
    },
    createTakeSexOption (name) {
      return recognizeSex(name);
    },
  }
};
