import { capitalizeFirstLetter } from './utils.common.js';
import ComponentDisplayArray from './component.display-array.js';

export default {
  template: `
    <div class="hero-stat">
      <dl class="color">
        <dt
          @click="$emit('filter-heroes', [])"
          title="Показать">Всего</dt>
        <dd>
          {{ heroCount }}
        </dd>
      </dl>

      <dl v-for="(source, index) in sources" :class="{ 'color' : index % 2 > 0 }">
        <dt
          :class="'color-' + source"
          @click="$emit('filter-heroes', [source])"
          title="Показать">{{ capitalizeFirstLetter(source) }}</dt>
        <dd>
          <span>{{ getSourceTypesList([source]).length }}</span>
        </dd>
      </dl>
    </div>
  `,
  components: {
    ComponentDisplayArray
  },
  props: {
    heroesList: {
      type: Array,
      required: true
    },
    sources: {
      type: Array,
      required: true
    },
    combinations: {
      type: Array,
      default: []
    }
  },
  computed: {
    heroCount () {
      return this.heroesList.length;
    },
    zmilList () {
      return this.getSourceTypesList(['zmil']);
    },
    zmilCount () {
      return this.zmilList.length;
    },
    warheroesList () {
      return this.getSourceTypesList(['warheroes']);
    },
    warheroesCount () {
      return this.warheroesList.length;
    },
    tsargradList () {
      return this.getSourceTypesList(['tsargrad']);
    },
    tsargradCount () {
      return this.tsargradList.length;
    },
    kontingentList () {
      return this.getSourceTypesList(['kontingent']);
    },
    kontingentCount () {
      return this.kontingentList.length;
    },
    ancestorList () {
      return this.getSourceTypesList(['ancestor']);
    },
    ancestorCount () {
      return this.ancestorList.length;
    },
    rabotaembratList () {
      return this.getSourceTypesList(['rabotaembrat']);
    },
    rabotaembratCount () {
      return this.rabotaembratList.length;
    },
    mod_russiaList () {
      return this.getSourceTypesList(['mod_russia']);
    },
    mod_russiaCount () {
      return this.mod_russiaList.length;
    },
  },
  methods: {
    // getIfEmptySourceType (type, hero) {
    //   let check = [];
    //   if (type === 'zmil') {
    //     check = ['photo', 'poster', 'story', 'url'];
    //   } else if (type === 'warheroes') {
    //     check = ['photo', 'story', 'url', 'area'];
    //   } else if (type === 'tsargrad') {
    //     check = ['photo', 'story', 'url'];
    //   } else if (type === 'kontingent') {
    //     check = ['photo', 'story', 'url'];
    //   }
    //   return !check.reduce((result, field) => {
    //     return result && Boolean(hero.resources?.[type][field]);
    //   }, true);
    // },
    getSourceTypesList (types) {
      return this.heroesList.filter(hero => {
        return types.reduce((result, type) => {
          return result && Boolean(hero.resources?.[type]);
        }, true);
      });
    },
    // getEmptySourceTypeList (type) {
    //   return this.getSourceTypesList([type]).filter(hero => {
    //     return this.getIfEmptySourceType(type, hero);
    //   });
    // },
    // getSourceTypeListWithEmptyFields (type, fields) {
    //   const list = this.getSourceTypesList([type]);
    //   return list.filter(item => {
    //     return fields.some(field => {
    //       return !item.resources[type]?.[field];
    //     });
    //   });
    // },
    // getCrossFilterEmptyField (typeA, typeB, field) {
    //   return this.getSourceTypesList([typeA]).filter(item => !item.resources[typeB]?.[field]);
    // },
    capitalizeFirstLetter
  }
};