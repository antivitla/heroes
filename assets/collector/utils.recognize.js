import { Awards, Months, Ranks, MaleNames, FemaleNames } from './utils.reference.js';
import { clone, random, listMapEntriesByKeys } from './utils.common.js';
import { getBase64Image } from './utils.resource.js';

let YANDEX_VISION_ANALYZE_FOLDER_ID;

export async function recognizeTextFromBase64Image (base64Image) {
  if (!YANDEX_VISION_ANALYZE_FOLDER_ID) {
    YANDEX_VISION_ANALYZE_FOLDER_ID = await fetch('credentials.json')
      .then(response => response.json())
      .then(credentials => credentials['yandex.vision'].folderId);
  }
  return fetch('api/yandex-vision-analyze.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      folderId: YANDEX_VISION_ANALYZE_FOLDER_ID,
      analyze_specs: [{
        content: base64Image.replace(/^data:image\/[^;]*;base64,/g, ''),
        features: [{
          type: 'TEXT_DETECTION',
          text_detection_config: {
            language_codes: ['ru', 'en']
          }
        }]
      }]
    })
  }).then(response => response.json()).then(result => {
    if (result.code && result.message) {
      alert(`Code ${result.code}, ${result.message}`);
      throw new Error(result.message, { cause: result });
    } else if (result.results[0].results[0].error) {
      const error = result.results[0].results[0].error;
      alert(`Code ${error.code}, ${error.message}`);
      throw new Error(error.message, { cause: error });
    } else {
      return result.results[0].results[0].textDetection.pages[0];
    }
  });
}

const recognitionParser = {
  poster: parsePosterData,
  ancestor: parseAncestorData,
  zmilPoster: parsePosterData,
};

export async function recognizeTexts ({ list, keys, callback, useParser = true }) {
  const listMap = listMapEntriesByKeys(list, keys);
  await Promise.all(
    listMap.map(async ({ index, key, value: url }) => {
      listMap[index].value = await getBase64Image(url);
    })
  );
  // Send pack of requests with small delay on each
  const parsed = [];
  const errors = [];
  return Promise.all(
    listMap.map(({ index, key, value: base64Image }) => {
      return new Promise(resolve => setTimeout(resolve, random(200, 500)))
        .then(() => recognizeTextFromBase64Image(base64Image))
        .then(result => {
          if (recognitionParser[key] && useParser) {
            return recognitionParser[key](result);
          } else {
            return result;
          }
        })
        .then(data => {
          callback({ index, key, value: data });
          parsed.push(clone({ index, key, value: data }));
        })
        .catch(error => errors.push(error));
    })
  ).then(() => ({ parsed, errors }));
}

export function simpleParseRecognizedData (page) {
  const words = items => items.map(word => word.text).join(' ');
  const lines = items => items.map(line => words(line.words)).join(' ');
  const blocks = items => items.map(block => lines(block.lines)).join('\n\n');
  return blocks(page.blocks);
}

function parsePosterData (page) {
  // Shortcuts
  const words = items => items.map(word => word.text).join(' ');
  const lines = items => items.map(line => words(line.words)).join(' ');
  const blocks = items => items
    .map(block => lines(block.lines))
    .reduce((fixedBlocks, block) => {
      if (fixedBlocks.length && fixedBlocks[fixedBlocks.length - 1].slice(-1) !== '.') {
        fixedBlocks[fixedBlocks.length - 1] += ` ${block}`;
      } else {
        fixedBlocks.push(block);
      }
      return fixedBlocks;
    }, [])
    .join('\n\n');
  const ifFirstBlockHasNameAndTitle = page.blocks[0].lines.length === 3;
  const ifFirstLineHasFullName = page.blocks[0].lines[0].words.length > 1;
  const ifFirstBlockHasOneLine = page.blocks[0].lines.length === 1;

  // Restore
  const data = { firstName: '', lastName: '', rank: '', story: '' };
  if (ifFirstBlockHasNameAndTitle) {
    data.firstName = page.blocks[0].lines[0].words[0].text;
    data.lastName = page.blocks[0].lines[1].words[0].text;
    data.rank = words(page.blocks[0].lines[2].words);
    data.story = blocks(page.blocks.slice(1));
  } else if (ifFirstLineHasFullName) {
    data.firstName = page.blocks[0].lines[0].words[0].text;
    data.lastName = page.blocks[0].lines[0].words[1].text;
    data.rank = lines(page.blocks[1].lines);
    data.story = blocks(page.blocks.slice(2));
  } else if (!ifFirstLineHasFullName && ifFirstBlockHasOneLine) {
    data.firstName = words(page.blocks[0].lines[0].words);
    data.lastName = words(page.blocks[1].lines[0].words);
    data.rank = lines(page.blocks[2].lines);
    data.story = blocks(page.blocks.slice(3));
  } else {
    data.firstName = words(page.blocks[0].lines[0].words);
    data.lastName = words(page.blocks[0].lines[1].words);
    data.rank = words(page.blocks[1].lines[0].words);
    data.story = blocks(page.blocks.slice(2));
  }
  return data;
}

function parseAncestorData (page) {
  return '(Рыба результата распознавания)';
}

export function recognizeMonth (string) {
  return Months.list.find(item => string.match(item.regexp));
}

export function recognizeDates (string) {
  const found = string.match(createDateRegExp()) || [];
  return found.map(string => {
    let [date, month, year] = string.split(/\s+/g);
    date = `0${date}`.slice(-2);
    month = `0${recognizeMonth(month).index}`.slice(-2);
    year = year || new Date().getFullYear();
    return new Date(`${year}-${month}-${date}`);
  });
}

export function recognizeAwards (string) {
  return Awards.list.filter(award => string.match(new RegExp(award.regexp, 'gi')));
}

export function recognizeRanks (src) {
  return Ranks.list.filter(rank => rank.regexp && String(src).match(rank.regexp));
}

export function recognizeContacts (string, contacts, getContact = item => item) {
  const normalizedString = string.replace('ё', 'е');
  return contacts.filter(contact => {
    return normalizedString.match(createContactRegExp(getContact(contact)));
  });
}

export function recognizeSex (name) {
  const parts = name
    .replace('ё', 'е')
    .toLowerCase()
    .split(/\s+/gi);
  const isFemaleName = parts.some(part => FemaleNames.names.includes(part));
  const isMaleName = parts.some(part => MaleNames.names.includes(part));
  return (isMaleName || !isFemaleName) ? 'мужчина' : 'женщина';
}

export function recognizeFallen (string) {
  return string.match(/погиб|посмерт/gi);
}

function createContactRegExp (contact) {
  if (!contact?.trim()) {
    alert('Empty contact');
    throw new Error('getNameRegExp: empty contact');
  }
  let [firstPart, secondPart] = contact.trim().split(/\s+/g);
  firstPart = firstPart.length > 2 ? firstPart.slice(0, -2) : firstPart;
  if (!secondPart) {
    return new RegExp(firstPart, 'gi');
  } else {
    secondPart = secondPart.length > 2 ? secondPart.slice(0, -2) : secondPart;
    const endingPart = '[а-яА-Я]*';
    const startingPart = '(^|[^а-я])';
    return new RegExp(`(${startingPart}${firstPart}${endingPart}\\s+${secondPart}${endingPart})|(${startingPart}${secondPart}${endingPart}\\s+${firstPart}${endingPart})`, 'gi');
  }
}

function createDateRegExp () {
  const dateRegExp = '\\d{1,2}\\s+';
  const monthRegExp = `(${Months.list.map(month => month.regexp.source).join('|')})[а-яА-Я]*\\s*`;
  const yearRegExp = '(\\d{2,4})*';
  return new RegExp(`(${dateRegExp}${monthRegExp}${yearRegExp})`, 'gi');
}
