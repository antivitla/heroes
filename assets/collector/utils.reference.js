import ranks from '../../data/references/ranks.js';
import awards from '../../data/references/awards.js';
import months from '../../data/references/months.js';
import maleNames from '../../data/references/male-names.js';
import femaleNames from '../../data/references/female-names.js';

export const Ranks = {
  map: ranks,
  list: Object.values(ranks),
  names: Object.keys(ranks),
};

export const Awards = {
  map: awards,
  list: Object.values(awards),
  names: Object.keys(awards),
};

export const Months = {
  map: months,
  list: Object.values(months),
  names: Object.keys(months)
};

function prepareNames (names) {
  const namesMap = names.reduce((map, name) => {
    map[name.Name.toLowerCase()] = (map[name.Name] || 0) + name.NumberOfPersons;
    return map;
  }, {});
  const sortedNamesMap = Object.entries(namesMap)
    .sort((a, b) => b[1] - a[1])
    .reduce((map, entry) => {
      map[entry[0]] = entry[1];
      return map;
    }, {});
  return sortedNamesMap;
}

const femaleNamesMap = prepareNames(femaleNames);
const maleNamesMap = prepareNames(maleNames);

export const FemaleNames = {
  map: femaleNamesMap,
  list: Object.entries(femaleNamesMap),
  names: Object.keys(femaleNamesMap)
};

export const MaleNames = {
  map: maleNamesMap,
  list: Object.entries(maleNamesMap),
  names: Object.keys(maleNamesMap)
};
