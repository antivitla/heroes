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
import { getAllOurHeroesList } from './actions.kontingent.js';
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
        <h2>Проект &laquo;Герои Z&raquo; издания &laquo;Контингент&raquo;</h2>
        <p><a
          href="https://kontingent.press/category/geroi-z"
          target="_blank">kontingent.press/category/geroi-z</a></p>
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
  },
  mixins: [MixinCommon],
  data () {
    return {
      globalActions: [
        { type: 'add-id', label: '(Опасно) Добавить ID' }
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
  methods: {
    async getRemoteAllCards () {
      this.loading = true;
      await this.getStat();
      this.allCards = await getAllOurHeroesList({
        callback: ({ total }) => {
          this.stat.total = total;
        }
      });
      this.loading = false;
      this.actionRecognizeHeroNames();
      this.stat.total = this.allCards.length;
      await this.setStat();
    },
    async syncEditHeroes () {
      // Вытащим дополнительные данные
      await Promise.all(this.cards.list.map(async card => {
        const fragment = await getHtmlBodyFragmentFromUrl(card.url);
        const json = JSON.parse(fragment.querySelector('script#__NEXT_DATA__').textContent);
        const pageData = json.props.pageProps;
        card.rank = recognizeRanks(pageData.imageCaption)[0]?.name || '';
        card.photo = pageData.image_url;
        card.artist = `Иллюстрация ${pageData.imageCaption.split('Иллюстрация ')[1].replace('.', '').trim()}`;
        // card.id уже определен

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
                artist: hero.artist || '',
                story: hero.story || '',
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
        console.error(error);
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
  }
};
