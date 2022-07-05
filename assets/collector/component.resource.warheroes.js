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
import ComponentActions from './component.actions.js';
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

      <!-- Карточки -->
      <ul class="cards">
        <li v-for="card in cards.list" class="card" :key="card.id">
          <!-- Картинки -->
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
              date: { take: createTakeDateOption(card.date) },
              rank: { take: createTakeRankOption(card.story) },
              awards: { take: createTakeAwardsOption(card.story) },
              fallen: { take: createTakeFallenOption(card.story) },
              sex: { take: createTakeSexOption(cardHeroId[card.id]) },
              story: { take: card.story }
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
  },
  mixins: [MixinCommon],
  data () {
    return {
      globalActions: [
        // { type: 'add-id', label: '(ОПАСНО) Добавить ID' },
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
        { key: 'url', mode: 'edit', type: 'input', label: 'Ссылка' },
        // { key: 'ancestorPoster', mode: 'edit', type: 'image', label: 'Постер #ПредковДостойны', hideIfEmpty: true },
        // { key: 'ancestorStory', mode: 'edit', type: 'text', label: 'История #ПредковДостойны' },
      ]
    };
  },
  methods: {
    async getRemoteAllCards () {
      this.loading = true;
      this.allCards = await getWarheroesList(new Date('01.01.2022'));
      this.loading = false;
      this.actionRecognizeHeroNames();
      await this.getStat();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async syncEditHeroes () {
      // Скачаем фотки, вытащим историю
      await Promise.all(this.cards.list.map(async card => {
        const fragment = await getHtmlBodyFragmentFromUrl(card.url);
        const photo = fragment.querySelector('img[src*="content/images"]')?.getAttribute('src') || '';
        const story = Array.from(fragment.querySelectorAll('blockquote'))
          .map(element => element.textContent).join('\n\n');
        card.photo = photo ? `https://warheroes.ru${photo}` : '';
        card.story = story;
      }));
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
          resourceKey: this.resourceKey,
          list: [{
            name: hero.name || '',
            rank: hero.rank || '',
            awards: clone(hero.awards?.slice() || []),
            sex: hero.sex || 'мужчина',
            fallen: Boolean(hero.fallen),
            group: clone(hero.group?.slice() || []),
            resources: clone(Object.assign({}, hero.resources, {
              [this.resourceKey]: {
                photo: hero.photo || '',
                story: hero.story || '',
                area: card.area || '',
                date: hero.date || '',
                url: card.url || '',
                id: card.id || ''
              }
            }))
          }]
        };
        this.$emit('update-heroes', update);
        await this.setCachedEditHeroes();
        this.actionsLog[card.id] = 'Готово';
      } catch (error) {
        this.actionsLog[card.id] = error.message;
      }
    },
    async doGlobalAction (action) {
      return ({
        'add-id': this.actionAddId
      })[action]();
    },
    async doAction ({ action, cardHeroId, hero, card }) {
      return ({
        'save-hero': this.actionSaveHero,
      })[action]({ cardHeroId, hero, card });
    },
    createTakeDateOption (date) {
      return formatDate(new Date(date).getTime(), 'YYYY-MM-DD');
    },
    createTakeRankOption (story) {
      return recognizeRanks(story)?.[0]?.name || '';
    }
  }
};
