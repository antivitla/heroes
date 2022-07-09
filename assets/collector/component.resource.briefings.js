// import {
//   recognizeTexts,
//   simpleParseRecognizedData } from './utils.recognize.js';
// import {
//   getLatestMessage,
//   getRemoteCards,
//   getRemoteImages,
//   ifMessageHasMediaPhoto } from './actions.telegram.js';
import { getRemoteBriefings, getRemoteBriefing } from './actions.zmil.js';
import { formatDate } from './utils.common.js';
import { saveJsonDocument, getJsonDocument } from './utils.resource.js';
import MixinCommon from './mixin.common.js';
import ComponentActions from './component.actions.js';
import ComponentStat from './component.stat.js';
import Histogram from './d3.histogram.js';

export default {
  template: `
    <section class="resource">
      <header>
        <h2>
          Статистика уничтожения противника
          <span v-if="loading" class="loading-indicator active"></span>
        </h2>
      </header>

      <!-- Статистика ресурса -->
      <component-stat
        :done="stat.done"
        :total="stat.total"
        :loading="loading"
        @refresh="refreshCards">Собираем статистику...</component-stat>

      <!-- Сохраненные карточки -->
      <!-- <div class="stat-items">
        <span
          v-for="item in editCards"
          :key="item.date"
          style="font-size: small;">
            <strong>{{ item.date }}, &ensp;</strong>
        </span>
      </div> -->

      <!-- Поиск карточек -->
      <!-- <component-search-telegram
        :channel="channel"
        :initial-query="initialQuery"
        @loading="loading = $event"
        @result="searchResults = $event"></component-search-telegram> -->


      <div class="d3"></div>


      <!-- Действия -->
      <component-actions
        v-if="globalActions.length"
        :actions="globalActions"
        :action-result="actionResult"
        @action="onEditCardsAction">
      </component-actions>

      <!-- Карточки -->
      <ul class="cards">
        <li class="card" v-for="card in allCards" :key="card.url" :class="{
          invalid: !card.splitted
        }">
          <h3>{{ card.date }}</h3>
          <p style="white-space: pre-line; font-size: xx-small; line-height: 1.5;">{{ card.splitted || getCardLastParagraph(card) }}</p>
          <p><small class="muted">{{ card.url }}</small></p>
          <p><small style="font-size: x-small;">{{ card.destroyed }}</small></p>
        </li>
      </ul>
    </section>
  `,
  components: {
    ComponentActions,
    ComponentStat,
  },
  mixins: [MixinCommon],
  data () {
    return {
      // channel: 'zvezdanews',
      // searchResults: [],
      allCards: [],
      editCards: {},
      // initialQuery: 'уничтоженных военных объектов',
      globalActions: [
        { type: 'load-briefings', label: 'Загрузить новые брифинги' },
        { type: 'recognize', label: 'Распознать данные' },
        { type: 'save', label: 'Сохранить статистику' }
      ],
      actionResult: '',
      loading: false,
      labels: {
        'САМОЛЕТЫ': {
          one: 'самолет',
          few: 'самолета',
          many: 'самолетов'
        },
        'ВЕРТОЛЕТЫ': {
          one: 'вертолет',
          few: 'вертолета',
          many: 'вертолетов'
        },
        'БЕСПИЛОТНИКИ': {
          one: 'беспилотный летательный аппарат',
          few: 'беспилотных летательных аппарата',
          many: 'беспилотных летательных аппаратов'
        },
        'ЗЕНИТКИ': {
          one: 'зенитный ракетный комплекс',
          few: 'зенитных ракетных комплекса',
          many: 'зенитных ракетных комплексов'
        },
        'ТАНКИ И БМ': {
          one: 'танк и других боевых бронированных машин',
          few: 'танка и других боевых бронированных машин',
          many: 'танков и других боевых бронированных машин'
        },
        'РСЗО': {
          one: 'установка реактивных систем залпового огня',
          few: 'установки реактивных систем залпового огня',
          many: 'установок реактивных систем залпового огня'
        },
        'АРТИЛЛЕРИЯ И МИНОМЕТЫ': {
          one: 'орудие полевой артиллерии и минометов',
          few: 'орудия полевой артиллерии и минометов',
          many: 'орудий полевой артиллерии и минометов'
        },
        'АВТОМОБИЛЬНАЯ ТЕХНИКА': {
          one: 'единица специальной военной автомобильной техники',
          few: 'единицы специальной военной автомобильной техники',
          many: 'единиц специальной военной автомобильной техники'
        }
      },
      regexps: {
        'САМОЛЕТЫ': /(\d+)\s+(боев[а-я]*\s+)*самолет/,
        'САМОЛЕТЫ НА ЗЕМЛЕ': /(\d+)\s+(боев[а-я]*\s+)*самолет([а-я]|\s)*земл/,
        'САМОЛЕТЫ В ВОЗДУХЕ': /(\d+)\s+(боев[а-я]*\s+)*самолет([а-я]|\s)*воздух/,
        'ВЕРТОЛЕТЫ': /(\d+)\s+вертолет/,
        'БЕСПИЛОТНИКИ': /(\d+)\s+([а-я]|\s)*(бпла|беспилотн)/,
        'ЗЕНИТКИ': /(\d+)\s+([а-я]|\s)*(зрк|(зенитн[а-я]+\s+ракетн))/,
        'ТАНКИ И БМ': /(\d+)\s+([а-я]|\s)*танк([а-я]|\s)*бронир/,
        'РСЗО': /(\d+)\s+([а-я]|\s)*(([а-я]|\s)*рсзо|(реактивн([а-я]|\s)*залпов))/,
        'АРТИЛЛЕРИЯ И МИНОМЕТЫ': /(\d+)\s+([а-я]|\s)*артиллер([а-я]|\s)*мином/,
        'АВТОМОБИЛЬНАЯ ТЕХНИКА': /(\d+)\s+([а-я]|\s)*автомобильн/,
        'КАТЕРА': /(\d+)\s+([а-я]|\s)*катер/,
        'ИНФРАСТРУКТУРА': /(\d+)\s+([а-я]|\s)*военн([а-я]|\s)*инфрастр/,
        'АЭРОДРОМЫ': /(\d+)\s+([а-я]|\s)*аэродром/,
        'КОМАНДНЫЕ ПУНКТЫ': /(\d+)\s+([а-я]|\s)*(командн|управлен)/,
        'РАДИОЛОКАТОРЫ': /(\d+)\s+([а-я]|\s)*радиолокац/,

      }
    };
  },
  watch: {
    editCards: {
      handler () {
        this.setCachedEditCards();
        const data = Object.values(this.editCards).map((card, i, array) => {
          const field = 'БЕСПИЛОТНИКИ';
          if (i === 0) {
            return {
              date: card.date,
              value: (card.destroyed[field] || 0)
            }
          } else {
            return {
              date: card.date,
              value: (card.destroyed[field] - array[i - 1].destroyed[field]) || 0
            };
          }
        });
        const node = Histogram(data, {
          x: d => d.date.split('.').slice(0,2).join('.'),
          y: d => d.value,
          width: 900
        });
        const d3 = this.$el.querySelector('.d3');
        d3.innerHTML = '';
        this.$el.querySelector('.d3').append(node);
      },
      deep: true
    }
  },
  computed: {
    //
  },
  async created () {
    await this.init();
  },
  mounted () {

  },
  methods: {
    async init () {
      this.loading = true;
      await this.getCachedAllCards();
      if (!this.allCards.length) {
        await this.getRemoteAllCards();
        await this.setCachedAllCards();
      }
      await this.getCachedEditCards();
      // await this.getCachedCards();
      // if (!this.cards.to || !this.cards.list.length) {
      //   const { from, limit } = this.cards;
      //   this.navigateCardsByIndex(from);
      // }
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
    async getRemoteAllCards () {
      const allCards = await getRemoteBriefings();
      allCards.reverse().forEach(card => {
        const index = this.allCards.findIndex(c => c.url === card.url);
        if (index < 0) {
          this.allCards.unshift(card);
        }
      });
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
    async getCachedEditCards () {
      this.editCards = await getJsonDocument(
        `${this.resourceCachePath}/edit-cards.json`,
        {}
      );
    },
    async setCachedEditCards () {
      return saveJsonDocument(
        `${this.resourceCachePath}/edit-cards.json`,
        this.editCards
      );
    },
    async refreshCards () {
      this.loading = true;
      await this.getRemoteAllCards();
      await this.setCachedAllCards();
      this.loading = false;
    },

    //
    // Actions
    //

    onEditCardsAction (action) {
      return ({
        'load-briefings': this.actionLoadBriefings,
        'recognize': this.actionRecognize,
        'save': this.actionSave
      })[action]();
    },
    async actionLoadBriefings () {
      this.loading = true;
      this.actionResult = '';
      let count = 0
      for await (let card of this.allCards) {
        card.text = await getRemoteBriefing(card.url);
        count += 1;
        this.actionResult = `${count}/${this.stat.total}`;
        await this.setCachedAllCards();
      }
      this.loading = false;
    },
    async actionSave () {
      this.loading = true;
      this.actionResult = '';
      await saveJsonDocument('data/destroyed.json', this.editCards);
      this.actionResult = 'Сохранено';
      this.loading = false;
    },
    async actionRecognize () {
      this.loading = true;
      this.actionResult = '';
      const RE = /(всего|с начала|к настоящему времени|в результате ударов|в ходе проведения)([а-я]|\s)*((выведен[а-я]*([а-я]|\s)*стро)|(поражен)|(уничтожен)|(потер[а-я]*([а-я]|\s)*состав))/;
      this.allCards.slice().reverse().forEach(card => {
        const date = card.date.trim();
        const url = card.url;
        const message = card.text
          .replace('ё', 'е')
          .replace(/  /gi, ' ')
          .split('\n\n')
          .map(line => line.trim())
          .filter(line => line)
          .join('\n\n');
        const splitted = message.toLowerCase().split(RE).slice(1).slice(-1)[0] || '';
        let check = 0;
        const match = Object.keys(this.regexps).reduce((map, key) => {
          const n = Number(splitted.match(this.regexps[key])?.[1] || 0);
          if (n) {
            map[key] = n;
            // Может взять старое значение?
            if (this.editCards[date]?.[key] > map[key]) {
              map[key] = this.editCards[date][key];
            }
            check = check + map[key];
          }
          return map;
        }, {});
        if (check > 0) {
          this.editCards[date] = {
            date,
            message,
            url,
            destroyed: Object.assign(this.editCards[date]?.destroyed || {}, match)
          };
        } else {
          console.warn(date, message);
        }
        // Fix
        if (this.editCards[date]?.destroyed['САМОЛЕТЫ НА ЗЕМЛЕ']) {
          this.editCards[date].destroyed['САМОЛЕТЫ'] = (
            this.editCards[date].destroyed['САМОЛЕТЫ НА ЗЕМЛЕ'] +
            this.editCards[date].destroyed['САМОЛЕТЫ В ВОЗДУХЕ']
          );
          delete this.editCards[date].destroyed['САМОЛЕТЫ НА ЗЕМЛЕ'];
          delete this.editCards[date].destroyed['САМОЛЕТЫ В ВОЗДУХЕ']
        }
        card.destroyed = this.editCards[date]?.destroyed || {};
        card.text = message;
        card.splitted = splitted;
      });
      await this.setCachedEditCards();
      await this.setCachedAllCards();
      this.actionResult = 'Распознано';
      this.loading = false;
    },

    //
    // Utils
    //

    getCardLastParagraph (card) {
      return card.text?.trim(); //.split('\n\n').slice(-1)[0];
    },
    splitBriefing () {
      const ending = /((выведен[а-яА-Я]*([а-яА-Я]|\s)*стро)|(поражен)|(уничтожен)|(потер[а-яА-Я]*([а-яА-Я]|\s)*состав))/;
    }
  }
}