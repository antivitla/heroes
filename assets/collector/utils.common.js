export const htmlEntity = {
  check: '✔',
  cross: '✖',
  times: '×',
  asterisk: '＊',
  star: '✯',
  mdash: '—'
};

const DebounceRegistry = new Map();

export function debounce (func, delayMs = 300) {
  clearTimeout(DebounceRegistry.get(func));
  DebounceRegistry.set(func, setTimeout(func, delayMs));
}

export function random(min, max) {
  return min + Math.round(Math.random() * (max - min));
}

export function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function equal (a, b) {
  if (!a || !b) {
    return a === b;
  } else {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

export function formatDate (date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
    'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  if (/DD.MM.YYYY/.test(format)) {
    return `${('0' + d.getDate()).slice(-2)}.${('0' + (d.getMonth() + 1)).slice(-2)}.${d.getFullYear()}`;
  } else if (/DD MMMM YYYY/.test(format)) {
    return `${('0' + d.getDate()).slice(-2)} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } else if (/D MMMM YYYY/.test(format)) {
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } else if (/D MMM YYYY/.test(format)) {
    return `${d.getDate()} ${months[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  } else if (/YYYY-MM-DD/.test(format)) {
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  }
}

export function listMapEntryByKey (list, key) {
  return list.map((item, index) => ({ index, key, value: item[key] }));
}

export function listMapEntriesByKeys (list, keys) {
  return keys.reduce((result, key) => result.concat(listMapEntryByKey(list, key)), []);
}

export function slug (text = '', lang = 'ru') {
  const locale = {
    ru: {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
      'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
      'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
      'э': 'e', 'ю': 'yu', 'я': 'ya',
    }
  };
  return text
    .toLowerCase()
    // clear html entities
    .replace(/&\w+;/g, '')
    // replace '. ' or ', ' with '--'
    .replace(/(\.|,)\s+/g, '--')
    // replace '.' with '-'
    .replace(/\./g, '-')
    // replace '/' with '--'
    .replace(/\/+|\\+/g, '--')
    // replace any other whitespace with '-'
    .replace(/\s+/g, '-')
    // remove starting and ending '-'
    .replace(/(^-+)|(-+$)/g, '')
    // split by char
    .split('')
    // translit
    .map(char => (locale[lang][char] || char))
    .join('')
    .replace(/[^\w-]/g, '');
};

export function createFragmentFromHtmlString (string) {
  const templateElement = document.createElement('template');
  templateElement.innerHTML = string;
  return templateElement.content;
}


export function capitalizeFirstLetter(string) {
  if (!string) {
    console.log('no string', string);
    return '';
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function removeDuplicates (array) {
  return Array.from(array.reduce((map, item) => {
    map.set(item, item);
    return map;
  }, new Map()).values());
}

export function possibleCombinations (array) {
  // На самом деле это задача составить числовой ряд, где цифер array.length, отсчет с нуля
  const row = [];
  const map = {};
  const length = parseInt(`${String(array.length - 1).repeat(array.length)}`, array.length);
  for (let i = 0; i < length; i += 1) {
    let n = removeDuplicates(String(i.toString(array.length)).split('').sort()).join('');
    map[n] = n.split('').map(id => array[id]);
  }
  return Object.values(map);
}

