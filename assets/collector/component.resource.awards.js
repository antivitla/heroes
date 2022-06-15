import MixinCommon from './mixin.common.js';
import { clone, slug, listMapEntryByKey } from './utils.common.js';
import {
  getRemoteAwardImages,
  getRemoteAwardReasons } from './actions.awards.js';
import {
  getJsonDocument,
  saveJsonDocument,
  downloadImage } from './utils.resource.js';
import ComponentActions from './component.actions.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>О наградах</h2>
      </header>

      <!-- Действия -->
      <component-actions
        :loading="progress.active"
        :label-progress="labelProgress"
        :actions="actions"
        :action-result="actionResult"
        @action="doAction"></component-actions>

      <!-- Готовые награды -->
      <h3>Готовые данные</h3>
      <ul class="cards">
        <li
          class="card"
          v-for="award in editAwards">
          <fieldset>
            <label class="input-block-label">Название</label>
            <div>{{ award.name }}</div>
          </fieldset>
          <fieldset>
            <label class="input-block-label">Тип</label>
            <div>{{ award.type }}</div>
          </fieldset>
          <fieldset>
            <label class="input-block-label">Степени</label>
            <div v-html="award.degrees || '&mdash;'"></div>
          </fieldset>

          <fieldset v-for="(degree, index) in award.images">
            <label v-if="award.images.length > 1" class="input-block-label">{{ ['I', 'II', 'III', 'IV'][index] }} степень</label>
            <label v-else class="input-block-label">Изображения</label>

            <p v-if="degree.main">
              <img :src="degree.main" width="50">
              <div><small><em>Основная картинка</em></small></div>
            </p>
            <p v-if="degree.ribbon">
              <img :src="degree.ribbon" height="20">
              <div><small><em>Основная полоска</em></small></div>
            </p>
            <p v-if="degree.mainVariant">
              <img :src="degree.mainVariant" height="50">
              <div><small><em>Вариант картинки</em></small></div>
            </p>
            <p v-if="degree.ribbonVariant">
              <img :src="degree.ribbonVariant" height="20">
              <div><small><em>Основная полоски</em></small></div>
            </p>
          </fieldset>
          <fieldset>
            <label class="input-block-label">Описание</label>
            <div class="input-block">
              <textarea v-model="award.reason" rows="10"></textarea>
            </div>
          </fieldset>
        </li>
      </ul>

      <h3>Картинки</h3>
      <ul class="cards">
        <li class="card" v-for="(card, cardIndex) in allCardsList">
          <fieldset>
            <label class="input-block-label">Проверить название ({{ card.name }})</label>
            <div class="input-block">
              <select @change="onCardAwardChange($event.target.value, allCardsList[cardIndex])">
                <option value="" disabled selected>(Выбрать)</option>
                <option
                  v-for="award in awardNames"
                  :value="award">{{ award }}</option>
              </select>
            </div>
          </fieldset>

          <fieldset v-for="(degree, degreeIndex) in card.images">
            <label v-if="card.images.length > 1" class="input-block-label">{{ ['I', 'II', 'III', 'IV'][degreeIndex] }} степень</label>
            <label v-else class="input-block-label">Изображения</label>
            <table style="font-size: x-small;">
              <thead>
                <tr>
                  <td>Картинка</td>
                  <td>Основная</td>
                  <td>Вариант основной</td>
                  <td>Полоска</td>
                  <td>Вариант полоски</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="src in degree">
                  <td><img :src="src" width="50"></td>
                  <td>
                    <input
                      type="radio"
                      :value="src"
                      :disabled="card.images[degreeIndex].mainVariant === src || card.images[degreeIndex].ribbon === src || card.images[degreeIndex].ribbonVariant === src"
                      v-model="card.images[degreeIndex].main">
                  </td>
                  <td>
                    <input
                      type="radio"
                      :value="src"
                      :disabled="card.images[degreeIndex].main === src || card.images[degreeIndex].ribbon === src || card.images[degreeIndex].ribbonVariant === src"
                      v-model="card.images[degreeIndex].mainVariant">
                  </td>
                  <td>
                    <input
                      type="radio"
                      :value="src"
                      :disabled="card.images[degreeIndex].main === src || card.images[degreeIndex].mainVariant === src || card.images[degreeIndex].ribbonVariant === src"
                      v-model="card.images[degreeIndex].ribbon">
                  </td>
                  <td>
                    <input
                      type="radio"
                      :value="src"
                      :disabled="card.images[degreeIndex].main === src || card.images[degreeIndex].ribbon === src || card.images[degreeIndex].mainVariant === src"
                      v-model="card.images[degreeIndex].ribbonVariant">
                  </td>
                </tr>
              </tbody>
            </table>
            <input type="button" @click="card.images[degreeIndex].main = ''; card.images[degreeIndex].mainVariant = ''; card.images[degreeIndex].ribbon = ''; card.images[degreeIndex].ribbonVariant = ''" value="Очистить">
          </fieldset>
        </li>
      </ul>

      <!-- <h3>Тексты</h3>
      <ul class="cards">
        <li class="card" v-for="(card, index) in allReasonsList">
          <fieldset>
            <label class="input-block-label">Проверить название ({{ card.name }})</label>
            <div class="input-block">
              <select @change="onCardReasonChange($event.target.value, allReasonsList[index])">
                <option value="" disabled selected>(Выбрать)</option>
                <option
                  v-for="award in awardNames"
                  :value="award">{{ award }}</option>
              </select>
            </div>
          </fieldset>
          <fieldset>
            <label class="input-block-label">Основания</label>
            <div class="input-block">
              <textarea v-model="card.reason" rows="15"></textarea>
            </div>
          </fieldset>
        </li>
      </ul> -->

    </section>
  `,
  components: {
    ComponentActions
  },
  mixins: [MixinCommon],
  data () {
    return {
      actions: [
        { type: 'save-images', label: 'Сохранить картинки' },
        { type: 'save-awards', label: 'Сохранить награды' }
      ],
      allCardsMap: {},
      allReasonsMap: {},
      editAwards: {},
      savedAwards: {},
    }
  },
  computed: {
    allCardsList () {
      return Object.values(this.allCardsMap);
    },
    allReasonsList () {
      return Object.values(this.allReasonsMap);
    },
    awardNames () {
      return Object.keys(this.savedAwards);
    }
  },
  created () {
    this.init();
  },
  methods: {
    async init () {
      await this.getCachedAllCards();
      if (!Object.values(this.allCardsMap).length) {
        await this.getRemoteAllCards();
        await this.setCachedAllCards();
      }
      await this.syncEditAwards();
    },
    async refresh () {
      await this.getRemoteAllCards();
      await this.setCachedAllCards();
      await this.syncEditAwards();
    },
    async syncEditAwards () {
      // this.savedAwards = await getJsonDocument('data/awards.json', {});
      this.savedAwards = (await import('../../data/references/awards.js')).default;
      this.editAwards = await getJsonDocument(
        `${this.resourceCachePath}/edit-awards.json`,
        {}
      );
    },
    async getCachedAllCards () {
      this.allCardsMap = await getJsonDocument(
        `${this.resourceCachePath}/all-cards-map.json`,
        []
      );
      this.allReasonsMap = await getJsonDocument(
        `${this.resourceCachePath}/all-reasons-map.json`,
        []
      );
    },
    async setCachedAllCards () {
      await saveJsonDocument(
        `${this.resourceCachePath}/all-cards-map.json`,
        this.allCardsMap
      );
      await saveJsonDocument(
        `${this.resourceCachePath}/all-reasons-map.json`,
        this.allReasonsMap
      );
    },
    async getRemoteAllCards () {
      this.loading = true;
      this.progress.active = true;
      this.progress.done = 0
      this.allCardsMap = await getRemoteAwardImages({
        callback: ({ list }) => {
          this.progress.done += 1;
          this.progress.total = list.length;
          this.progress.label = 'Cборники картинок:';
        }
      });
      this.progress.done = 0;
      this.allReasonsMap = await getRemoteAwardReasons({
        callback: ({ value, index, list }) => {
          this.progress.done += 1;
          this.progress.total = list.length;
          this.progress.label = 'Описания:';
        }
      });
      this.progress.active = false;
      this.loading = false;
    },
    displayReason (string) {
      if (!string) {
        return '(нет описания)';
      }
      return `<p>${string.join('</p>\n<p>')}</p>`
    },
    mergeWithSavedAward (name) {
      Object.assign(this.editAwards[name], {
        type: this.savedAwards[name].type,
        degrees: this.savedAwards[name].degrees,
        regexp: this.savedAwards[name].regexp.toString()
          .replace(/^\//, '')
          .replace(/\/g?i?$/, ''),
        testRegexp: this.savedAwards[name].testRegexp
      });
    },
    onCardReasonChange (name, card) {
      this.editAwards[name] = this.editAwards[name] || { name };
      this.mergeWithSavedAward(name);
      if (card.reason) {
        this.editAwards[name].reason = card.reason;
      }
    },
    onCardAwardChange (name, card) {
      this.editAwards[name] = this.editAwards[name] || { name };
      this.mergeWithSavedAward(name);
      // Взять данные из карточки:
      // 1. Степени
      if (card.degrees) {
        this.editAwards[name].degrees = card.degrees;
      } else {
        delete this.editAwards[name].degrees;
      }
      // 2. Картинки
      if (card.images) {
        this.editAwards[name].images = card.images;
      }
    },
    async actionSaveImages () {
      this.actionResult = '';
      this.progress.done = 0;
      this.progress.total = this.allCardsList.length;
      this.progress.active = true;
      this.progress.label = 'Сохранено';
      return Promise.all(Object.values(this.editAwards).map(award => {
        return Promise.all(award.images.map((group, index) => {
          return Promise.all(Object.keys(group).map(async key => {
            if (!key.match(/\d/)) {
              const filename = `${slug(award.name)}-${index}-${key}.${group[key].split('.').slice(-1)[0]}`;
              const saveTo = `data/references/images/${filename}`;
              await downloadImage(group[key], saveTo);
              group[key] = saveTo;
            }
          }));
        })).then(() => {
          this.progress.done += 1;
        });
      })).then(() => {
        this.progress.active = false;
      });
    },
    async actionSaveAwards () {
      const editAwards = clone(this.editAwards);
      Object.values(editAwards).forEach(award => {
        award.images = this.editAwards[award.name].images?.map(degree => {
          const degreeImages = {
            main: degree.main,
            ribbon: degree.ribbon,
          };
          if (degree.mainVariant) {
            degreeImages.mainVariant = degree.mainVariant;
          }
          if (degree.ribbonVariant) {
            degreeImages.ribbonVariant = degree.ribbonVariant;
          }
          return degreeImages;
        }) || [];
        if (award.images.length > 1) {
          award.degrees = award.images.length
        }
      });
      const sortedAwards = Object.values(editAwards).sort((a, b) => {
        if (a.type === b.type) {
          return a.name < b.name ? -1 : 1;
        }
        return a.type < b.type ? -1 : 1;
      }).reduce((awards, award) => {
        awards[award.name] = award;
        return awards;
      }, {});
      await saveJsonDocument(
        `${this.resourceCachePath}/edit-awards.json`,
        sortedAwards
      );
    },
    doAction (action) {
      const actions = ({
        'save-images': this.actionSaveImages,
        'save-awards': this.actionSaveAwards
      })[action]();
    }
  }
}