import { clone, formatDate } from '../utils.js';
import Ranks from '../lib/ranks.js';

// Ожидаем в this.heroes список героев
export default {
  methods: {
    extendCloneHeroes (list) {
      const clonedList = clone(list);
      clonedList.forEach(hero => {
        const date = this.getHeroDate(hero) || '';
        const dateFormatted = date ? formatDate(date, 'D MMMM YYYY') : '';
        const stories = Object.values(hero.resources)
          .map(resource => resource.story)
          .filter(story => story);
        const fallenTags = hero.fallen
          ? 'погиб умер убит убили смерть посмертно'
          : 'жив живой выжил'
        hero.extended = {
          date,
          dateFormatted,
          stories,
          fallenTags
        };
      });
      return clonedList;
    },

    getHeroesOrderedBy (order, list = [], direction = true) {
      return list.slice().sort((heroA, heroB) => {
        let a, b;
        switch (order) {
          case 'firstName':
            a = heroA.name;
            b = heroB.name;
            break;
          case 'lastName':
            a = heroA.name.split(/\s+/).slice(-1)[0];
            b = heroB.name.split(/\s+/).slice(-1)[0];
            break;
          case 'date':
            a = this.getHeroDate(heroA);
            b = this.getHeroDate(heroB);
            break;
          case 'awards':
            a = heroA.awards.slice(0).sort().join(', ');
            b = heroB.awards.slice(0).sort().join(', ');
            break;
          case 'sex':
            a = heroA.sex;
            b = heroB.sex;
            break;
          case 'rank':
            a = this.getHeroRankLevel(heroA);
            b = this.getHeroRankLevel(heroB);
            // Разбросать надо — уровень вроде тот же, но названия разные
            if (a === b) {
              // A
              if (Ranks[heroA.rank]?.type) {
                a += 0.1
              }
              else if (Ranks[heroA.rank]?.land && heroA.rank.match(/[Гг]вард/i)) {
                a += 0.3
              }
              else if (Ranks[heroA.rank]?.land) {
                a += 0.2
              }
              else if (Ranks[heroA.rank]?.naval && heroA.rank.match(/[Гг]вард/i)) {
                a += 0.5
              }
              else if (Ranks[heroA.rank]?.naval) {
                a += 0.4
              }

              // B
              if (Ranks[heroB.rank]?.type) {
                b += 0.1
              }
              else if (Ranks[heroB.rank]?.land && heroB.rank.match(/[Гг]вард/i)) {
                b += 0.3
              }
              else if (Ranks[heroB.rank]?.land) {
                b += 0.2
              }
              else if (Ranks[heroB.rank]?.naval && heroB.rank.match(/[Гг]вард/i)) {
                b += 0.5
              }
              else if (Ranks[heroB.rank]?.naval) {
                b += 0.4
              }
            }
            break;
        }
        const dir = direction ? 1 : -1;
        if (!a && a !== 0) {
          return dir;
        }
        if (!b && b !== 0) {
          return -dir;
        }
        return (a > b ? 1 : a < b ? -1 : 0) * (direction ? 1 : -1);
      });
    },

    getHeroById (id, list = []) {
      return list.find(hero => {
        return Object.values(hero.resources)
          .map(resource => resource.id)
          .filter(id => id)
          .includes(id)
      });
    },

    hasHeroId (id, hero) {
      return Object.values(hero.resources)
        .map(resource => resource.id)
        .filter(id => id)
        .includes(id);
    },

    //
    // Extract data
    //

    getHeroFirstName (hero) {
      return hero.name.split(/\s+/)[0];
    },

    getHeroLastName (hero) {
      return hero.name.split(/\s+/).slice(-1)[0];
    },

    getHeroDate (hero) {
      const priority = ['zmil'];
      let date;
      priority.some(key => {
        date = hero.resources[key]?.date;
        if (date) {
          return true;
        }
      });
      if (date) {
        return date;
      }
      const exclude = ['ancestor'];
      // Пройтись по всем датам доступным
      Object.keys(hero.resources).forEach(key => {
        if (exclude.includes(key)) {
          return;
        }
        if (
          (hero.resources[key]?.date && !date) ||
          hero.resources[key]?.date < date
        ) {
          date = hero.resources[key].date;
        }
      });
      return date;
    },

    getHeroId (hero) {
      return Object.values(hero.resources).find(resource => resource.id)?.id;
    },

    getHeroStories (hero) {
      return Object.values(hero.resources)
        .map(resource => resource.story)
        .filter(story => story)
    },

    getHeroRankLevel (hero) {
      return Ranks[hero.rank]?.level || 0;
    },

    // Кэш

    getCachedHeroData (heroId) {
      const Heroes = JSON.parse(localStorage.getItem('Heroes') || '{}');
      return Heroes[heroId];
    },

    setCachedHeroData (heroId, data) {
      const Heroes = JSON.parse(localStorage.getItem('Heroes') || '{}');
      if (!Heroes[heroId]) {
        Heroes[heroId] = {};
      }
      Object.assign(Heroes[heroId] || {}, data);
      localStorage.setItem('Heroes', JSON.stringify(Heroes));
    }
  }
}