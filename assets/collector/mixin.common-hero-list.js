export default {
  methods: {
    getHeroIndexByAnyResourceParamValue (value, resource = '') {
      if (resource) {
        return this.heroesList.findIndex(hero => {
          return Object.values(hero.resources?.[resource] || {}).includes(value);
        });
      } else {
        return this.heroesList.findIndex(hero => {
          return this.allResourcesKeys.some(key => {
            return Object.values(hero.resources?.[key] || {}).includes(value);
          });
        });
      }
    },
    getHeroByAnyResourceParamValue (value, resource = '') {
      return this.heroesList[this.getHeroIndexByAnyResourceParamValue(value, resource)];
    },
    getHeroIndexById (id, resource = '') {
      if (resource) {
        return this.heroesList.findIndex(hero => {
          return hero.resources?.[resource]?.id === id;
        });
      } else {
        return this.heroesList.findIndex(hero => {
          return this.allResourcesKeys.some(key => {
            return hero.resources?.[key]?.id === id;
          });
        });
      }
    },
    getHeroById (id, resource = '') {
      return this.heroesList[this.getHeroIndexById(id, resource)];
    },
    getHeroId (hero) {
      const resourceKey = this.allResourcesKeys.find(key => {
        return hero.resources[key]?.id;
      });
      if (resourceKey) {
        return hero.resources[resourceKey].id;
      }
    },
    getHeroesIdsByName (name) {
      if (!name) {
        return [];
      }
      return this.heroesList
        .filter(hero => hero.name === name)
        .map(hero => this.getHeroId(hero));
    },
    getHeroesByName (name) {
      if (!name) {
        return [];
      }
      return this.heroesList.filter(hero => hero.name === name);
    },
  }
};