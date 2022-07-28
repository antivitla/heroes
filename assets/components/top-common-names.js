import { debounce } from '../utils.js';

export default {
  template: `
    <div class="top-common-names content-component">
      <p class="content-component__note">Клик по элементам графика найдет соответствующих героев.</p>
      <div id="top-common-names-chart" class="content-component__chart"></div>
      <p>[Женщины]</p>
    </div>
  `,
  props: {
    heroes: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      chart: null,
    };
  },
  watch: {
    heroes (heroes) {
      if (heroes?.length) {
        this.renderChart();
      }
    }
  },
  computed: {
    firstNamesListCount () {
      return Object.entries(this.heroes.reduce((map, hero) => {
        const firstName = hero.name.split(/\s+/)[0];
        map[firstName] = (map[firstName] || 0) + 1;
        return map;
      }, {})).map(entry => {
        return { name: entry[0], count: entry[1] };
      }).sort((a, b) => {
        return b.count - a.count;
      });
    },
  },
  mounted () {
    //
  },
  unmounted () {
    this.chart?.destroy();
  },
  methods: {
    renderChart () {
      const height = 400;
      const fontFamily = 'IBM Plex Sans';
      const fillTextInvert = '#e2e2df';
      const fillText = '#495266';
      const fillTextMuted = '#767d8a';
      const fillTextDisabled = '#9fa3aa';

      this.chart = new G2.Chart({
        container: 'top-common-names-chart',
        height: height,
        autoFit: true,
      });

      this.chart.forceFit();
      this.chart.data(this.firstNamesListCount.slice(0, 10).reverse());
      this.chart.coordinate().transpose();
      this.chart.tooltip(false);
      this.chart.legend(false);

      const interval = this.chart.interval()
        .position('name*count')
        .size((height * 0.1) - 15)
        .style({
          radius: [5, 5, 0, 0]
        })
        .state({
          active: {
            style: {
              lineWidth: 0,
              stroke: 'transparent'
            }
          }
        })
        .color('name', name => {
          if (name === 'Иван') {
            return '#647485';
          } else if (name.match(/лександр|ергей|лексей/)) {
            return '#7aa7e0';
          } else {
            return '#71c491'; // Остальные
          }
        })
        .label('count', {
          offset: -10,
          style: {
            fill: fillTextInvert,
            fontFamily: fontFamily,
            fontSize: 14,
            fontWeight: 600,
          }
        });
      this.chart.axis('name', {
        title: null,
        tickLine: null,
        tickStates: {
          inactive: {
            labelStyle: {
              fill: fillTextDisabled,
            }
          }
        },
        line: null,
        label: {
          style: {
            fontFamily: 'Leksa',
            fontWeight: 400,
            fontSize: 14,
            fill: fillText
          },
        }
      });
      this.chart.axis('count', {
        title: {
          text: 'Количество героев',
          offset: 50,
          style: {
            fontSize: 16,
            fontFamily: 'Leksa',
            fontWeight: 600,
          }
        }
      });
      this.chart.annotation()
        .text({
          content: 'А вот и не Ваня на первом месте',
          style: {
            fontWeight: 600,
            fontFamily: fontFamily,
            fill: fillTextInvert,
            fontSize: 14
          },
          position: ['Иван', 1]
        })
        .text({
          content: 'Саня',
          style: {
            fontWeight: 600,
            fontFamily: fontFamily,
            fill: fillTextInvert,
            fontSize: 14
          },
          position: ['Александр', 1]
        })
        .text({
          content: 'Серёга',
          style: {
            fontWeight: 600,
            fontFamily: fontFamily,
            fill: fillTextInvert,
            fontSize: 14
          },
          position: ['Сергей', 1]
        })
        .text({
          content: 'Лёха',
          style: {
            fontWeight: 600,
            fontFamily: fontFamily,
            fill: fillTextInvert,
            fontSize: 14
          },
          position: ['Алексей', 1]
        });

      G2.registerInteraction('axis-label-cursor-pointer', {
        start: [{
          trigger: 'axis-label:mouseenter',
          action: ['cursor:pointer']
        }],
        end: [{
          trigger: 'axis-label:mouseleave',
          action: ['cursor:default']
        }]
      });
      G2.registerInteraction('element-cursor-pointer', {
        start: [{
          trigger: 'element:mouseenter',
          action: ['cursor:pointer']
        }],
        end: [{
          trigger: 'element:mouseleave',
          action: ['cursor:default']
        }]
      });
      // this.chart.interaction('element-active');
      // this.chart.interaction('element-highlight');
      // this.chart.interaction('element-list-highlight');
      // this.chart.interaction('axis-label-highlight');
      this.chart.interaction('element-cursor-pointer');
      this.chart.interaction('axis-label-cursor-pointer');

      this.chart.on('element:click', event => {
        const heroName = event.target.get('element')?.getModel().data.name;
        if (heroName) {
          this.heroesNamesSearch(`${heroName}\\s+`);
        }
      });

      this.chart.on('axis-label:click', event => {
        const heroName = event.target.get('delegateObject').item.name;
        if (heroName) {
          this.heroesNamesSearch(`${heroName}\\s+`);
        }
      });

      this.chart.render();
    },
    heroesNamesSearch (searchQuery) {
      document.dispatchEvent(new CustomEvent('heroes-names-search', {
        detail: {
          searchQuery: searchQuery || '',
          orderBy: 'firstName',
          orderDirection: true
        }
      }));
    }
  }
}