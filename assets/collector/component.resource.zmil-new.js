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
import {
  clone,
  slug,
  equal,
  formatDate,
  capitalizeFirstLetter
} from './utils.common.js';
import { Ranks, Awards } from './utils.reference.js';
import { getRemoteNewCards, getRemoteNewCard } from './actions.zmil.js';
import MixinCommon from './mixin.common.js';
import ComponentStat from './component.stat.js';
import ComponentNavigation from './component.navigation.js';
import ComponentEditor from './component.editor.js';
import ComponentActions from './component.actions.js';
import ComponentFieldPreviewAwards from './component.field.preview-awards.js';
import ComponentSearch from './component.search.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>Страница проекта Минобороны России &laquo;Герои Z&raquo; II</h2>
        <p><a
          href="https://z.mil.ru/spec_mil_oper/heroes_z.htm"
          target="_blank">z.mil.ru/spec_mil_oper/heroes_z.htm</a></p>
      </header>

      <!-- Статистика ресурса -->
      <component-stat
        :total="stat.total"
        :loading="loading"
        @refresh="refreshAllCards">Собираем статистику...</component-stat>

      <!-- Навигация по карточкам-->
      <component-navigation
        :items="cards"
        :stat="stat"
        @navigate="navigateCardsByAction"></component-navigation>

      <!-- Действия -->
      <component-actions
        v-if="globalActions.length"
        :loading="progress.active"
        :label-progress="labelProgress"
        :actions="globalActions"
        :action-result="actionResult"
        @action="doGlobalAction"></component-actions>

      <component-search
        v-model="searchHeroesQuery"
        label="Найти"
        @search="onSearchHeroes"></component-search>

      <!-- Карточки -->
      <ul class="cards">
        <li v-for="card in (filteredHeroList.length ? filteredHeroList : cards.list)" class="card" :key="card.id">

          <fieldset class="field-image" :class="{ saved: isSavedImage(card.photo) }">
            <img :src="card.photo" width="100%">
          </fieldset>

          <fieldset class="field-title" style="padding-right: 2rem;">
            <h3>{{ card.name }}</h3>
            <p>{{ card.rank }}</p>
          </fieldset>

          <fieldset>
            <label class="input-block-label">История</label>
            <div v-html="card.story" style="height: 300px; overflow: scroll; white-space: pre-line;"></div>
          </fieldset>

          <!-- Выбор куда сохранять -->
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
                @click="actionCreateHero(card.id, 'zmil')">
            </div>
          </fieldset>

          <!-- Редактирование -->
          <component-editor
            v-if="selectedCard[card.id] && recognizedHeroFromCard(card.id)"
            v-model="editHeroes[cardHeroId[card.id]]"
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
              sex: { take: createTakeSexOption(cardHeroId[card.id]) },
              story: { take: card.story },
              url: { take: card.url }
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
    ComponentActions,
    ComponentFieldPreviewAwards,
    ComponentSearch,
  },
  mixins: [MixinCommon],
  data () {
    return {
      searchHeroesQuery: '',
      filteredHeroList: [],
      searchHeroTimeout: null,
      globalActions: [
        // { type: 'add-id', label: '(Опасно) Добавить ID' }
        { type: 'clear-edit-heroes', label: 'Очистить кэш редактирования' },
      ],
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
        { key: 'artist', mode: 'edit', type: 'input', label: 'Иллюстратор' },
        { key: 'url', mode: 'edit', type: 'input', label: 'Ссылка' },
      ],
    };
  },
  watch: {
    searchHeroesQuery () {
      if (this.searchHeroesQuery.length > 2) {
        this.onSearchHeroes();
      }
    }
  },
  methods: {
    async getRemoteAllCards () {
      this.loading = true;
      await this.getStat();
      const allCards = await getRemoteNewCards();
      this.allCards = allCards.filter(card => !this.getHeroById(card.id));
      this.loading = false;
      this.actionRecognizeHeroNames();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async syncEditHeroes () {
      // Вытащим дополнительные данные
      await Promise.all(this.cards.list.map(async card => {
        const fragment = await getHtmlBodyFragmentFromUrl(card.url);
        const name = fragment.querySelector('#center h1').textContent.trim();
        const rank = capitalizeFirstLetter(
          fragment.querySelector('#center h1').nextSibling.textContent.trim()
        );
        const story = Array.prototype.slice.call(
          fragment.querySelectorAll('#center h2 ~ div, #center h2 ~ p')
        ).map(div => div.textContent.trim()).join('\n\n').trim() || '';
        // Меняем местами имя и фамилию
        card.name = name.split('\s').reverse().join(' ').replace('ё', 'е');
        card.rank = card.rank || rank || '';
        card.story = story;
      }));
    },
    async checkSyncEditHeroes (cardId) {
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
          clone(recognizedHero.resources?.zmil || {})
        );
      } else if (isSelected && recognizedHero && editHeroEmptyCardData) {
        Object.assign(this.editHeroes[this.cardHeroId[cardId]], cardClone);
      }
      if (isSelected && recognizedHero) {
        // this.editHeroes
        await this.actionDownloadPhoto(cardId);
      }
      if (!isSelected) {
        this.actionsLog[cardId] = '';
      }
      await this.setCachedEditHeroes();
    },
    async actionSaveHero ({ cardHeroId, hero, card }) {
      this.actionsLog[card.id] = '';
      try {
        // Перенести фотки
        await Promise.all(
          ['photo'].map(async field => {
            if (hero[field] && !hero[field].match(/^data\/images/)) {
              const from = hero[field];
              const filename = from.split('/').slice(-1)[0];
              const to = `data/images/${filename.toLowerCase()}`;
              hero[field] = to;
              await copyFile(from, to);
            }
          })
        );
        const update = {
          resourceKey: 'zmil',
          ids: [hero.id],
          list: [{
            name: hero.name || '',
            rank: hero.rank || '',
            awards: clone(hero.awards?.slice() || []),
            sex: hero.sex || 'мужчина',
            fallen: Boolean(hero.fallen),
            group: clone(hero.group?.slice() || []),
            resources: clone(Object.assign({}, hero.resources, {
              ['zmil']: {
                photo: hero.photo || '',
                story: hero.story || '',
                date: hero.date || '',
                url: card.url || '',
                id: card.id || ''
              }
            }))
          }]
        };
        this.$emit('update-heroes', update);
        this.editHeroes[card.id] = Object.assign(
          clone(update.list[0]),
          clone(update.list[0].resources.zmil)
        );
        this.cardHeroId[card.id] = card.id;
        await this.setCachedEditHeroes();
        this.actionsLog[card.id] = 'Готово';
      } catch (error) {
        console.error(error);
        this.actionsLog[card.id] = error.message;
      }
    },
    async onSearchHeroes () {
      clearTimeout(this.searchHeroTimeout);
      this.searchHeroTimeout = setTimeout(async () => {
        this.cards.list = this.allCards.filter(card => {
          return JSON.stringify(card).toLowerCase().match(
            new RegExp(this.searchHeroesQuery.toLowerCase()),
            'gi'
          );
        });
        this.actionRecognizeHeroNames();
        await this.clearEditHeroes();
        await this.syncEditHeroes();
        await this.setCachedEditHeroes();
        await this.setCachedCards();
      }, 500);
    },
    async doGlobalAction (action) {
      return ({
        'add-id': this.actionAddId,
        'clear-edit-heroes': () => {
          this.clearEditHeroes();
          this.generalActionResult = 'Очищено';
        }
      })[action]();
    },
    async doAction ({ action, cardHeroId, hero, card }) {
      return ({
        'save-hero': this.actionSaveHero,
      })[action]({ cardHeroId, hero, card });
    },
  }
};
