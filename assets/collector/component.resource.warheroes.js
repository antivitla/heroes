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
  recognizeContacts } from './utils.recognize.js';
import { clone, slug, equal, formatDate, removeDuplicates } from './utils.common.js';
import { Ranks, Awards } from './utils.reference.js';
import { getWarheroesList } from './actions.warheroes.js';
import MixinCommon from './mixin.common.js';
import ComponentStat from './component.stat.js';
import ComponentNavigation from './component.navigation.js';
import ComponentEditor from './component.editor.js';
import ComponentFieldPreviewAwards from './component.field.preview-awards.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>База данных проекта &laquo;Герои России&raquo;</h2>
        <p><a
          href="https://warheroes.ru/main.asp/filter/get/"
          target="_blank">warheroes.ru/main.asp/filter/get/</a></p>
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
          <!-- Карточки -->
          <fieldset class="field-image" :class="{ saved: isSavedImage(card.photo) }">
            <img :src="card.photo" width="100%">
          </fieldset>
          <!-- Награды -->
          <component-field-preview-awards
            v-model="card.awards">
          </component-field-preview-awards>
          <!-- Имя -->
          <fieldset class="field-title" style="padding-right: 2rem;">
            <h3>{{ card.name }}</h3>
            <p><em>{{ card.area }}</em></p>
          </fieldset>
          <!-- Дата -->
          <fieldset>
            <label class="input-block-label">Дата гибели</label>
            <div>{{ card.dateOfDeath }}</div>
          </fieldset>
          <fieldset>
            <label class="input-block-label">Дата награждения</label>
            <div>{{ card.dateOfAward }}</div>
          </fieldset>
          <!-- История -->
          <fieldset>
            <label class="input-block-label">История</label>
            <div class="input-block">
              <textarea v-model="card.story" rows="10"></textarea>
            </div>
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
              date: { take: createTakeDateOption(card.date) },
              rank: { take: createTakeRankOption(card.story) },
              awards: { take: createTakeAwardsOption(card.story) },
              fallen: { take: createTakeFallenOption(card.story) },
              sex: { take: createTakeSexOption(selectedHero[card.id]) },
              story: { take: card.story }
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
        { key: 'url', mode: 'edit', type: 'input', label: 'Ссылка' },
        // { key: 'ancestorPoster', mode: 'edit', type: 'image', label: 'Постер #ПредковДостойны', hideIfEmpty: true },
        // { key: 'ancestorStory', mode: 'edit', type: 'text', label: 'История #ПредковДостойны' },
      ]
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
    },
    editHeroes: {
      handler () {
        this.setCachedEditHeroes();
      },
      deep: true
    }
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

      Object.values(this.editHeroes).forEach(hero => {
        Object.assign(
          this.editHeroes[hero.name],
          clone(this.heroes[hero.name] || {}),
          clone(this.heroes[hero.name]?.warheroes || {}),
        );
      });

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
      this.allCards = await getWarheroesList(new Date('01.01.2022'));
      this.loading = false;
      this.actionRecognizeHeroNames();
      await this.getStat();
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
      this.actionRecognizeHeroNames();
      await this.syncEditHeroes();
      await this.setCachedEditHeroes();
      await this.setCachedCards();
      this.loading = false;
    },
    async syncEditHeroes () {
      this.isUpdateLocked = true;
      this.editHeroes = this.cards.list.reduce((editHeroes, card) => {
        const name = this.recognizedNames[card.id][0];
        if (name) {
          editHeroes[name] = Object.assign(
            clone(this.heroes[name] || {}),
            clone(this.heroes[name]?.resources?.warheroes || {}),
            {
              awards: removeDuplicates(
                (this.heroes[name]?.awards || []).concat(card.awards)
              )
            }
          );
        }
        return editHeroes;
      }, {});
      await Promise.all(this.cards.list.map(async card => {
        const fragment = await getHtmlBodyFragmentFromUrl(card.url);
        const photo = fragment.querySelector('img[src*="content/images"]').getAttribute('src');
        const story = Array.from(fragment.querySelectorAll('blockquote'))
          .map(element => element.textContent).join('\n\n');
        // this.editHeroes[card.name].photo = `https://warheroes.ru${photo}`;
        // this.editHeroes[card.name].story = story;
        // card.id = slug(card.name);
        card.photo = `https://warheroes.ru${photo}`;
        card.story = story;
      }));
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
              const saveTo = `data/images/${filename}`;
              update[field] = saveTo;
              await copyFile(from, saveTo);
            }
          })
        );
        // Засунуть соотв. данные в поле 'warheroes'
        const heroUpdate = {
          [name]: {
            name: name || '',
            rank: update.rank || '',
            awards: clone(update.awards?.slice() || []),
            sex: update.sex || 'мужчина',
            fallen: Boolean(update.fallen),
            group: clone(update.group || []),
            resources: Object.assign({}, update.resources, {
              warheroes: {
                photo: update.photo || '',
                story: update.story || '',
                area: card.area || '',
                date: update.date || '',
                url: card.url || '',
              }
            })
          }
        };
        this.$emit('update-heroes', clone(heroUpdate));
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
        const filename = `${slug(name)}-${cardId}-warheroes.jpg`;
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
      this.editHeroes[name] = clone(this.heroes[name]);
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
    createTakeDateOption (date) {
      return formatDate(new Date(date).getTime(), 'YYYY-MM-DD');
    },
    createTakeRankOption (story) {
      return recognizeRanks(story)?.[0]?.name;
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
