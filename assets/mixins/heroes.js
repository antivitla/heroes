// Ожидаем в this.heroes список героев
export default {
  computed: {
    //
  },
  methods: {
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
        }
        const dir = direction ? 1 : -1;
        if (!a) {
          return dir;
        }
        if (!b) {
          return -dir;
        }
        return (a > b ? 1 : a < b ? -1 : 0) * (direction ? 1 : -1);
      });
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
    }
  }
}