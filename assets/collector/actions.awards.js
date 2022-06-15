import { random } from './utils.common.js';
import { getHtmlBodyFragmentFromUrl } from './utils.resource.js';

export async function getRemoteAwardImages ({ callback }) {
  const awards = {};
  await Promise.all([
    'Ордена_Российской_Федерации',
    'Медали_Российской_Федерации',
    'Знаки_отличия_Российской_Федерации'
  ].map(async (url, index, array) => {
    const rows = await getRemoteAwardImage(url);
    const map = parseRemoteAwardRows(rows);
    Object.assign(awards, map);
    callback({ value: map, index, list: array });
  }));
  return awards;
}

function parseRemoteAwardRows (rows) {
  return rows
    .map(row => {
      const cells = Array.prototype.slice.call(row.querySelectorAll('td'));
      const images = Array.prototype.slice
        .call(cells[0].querySelectorAll('img'))
        .map(img => img.src.replace('thumb/', ''))
        .map(src => {
          return src.split('/').filter((item, index, parts) => {
            if (!item) {
              return true;
            } else if (index < parts.length -1) {
              return true;
            } else if (!item.match(/\d+px-/gi)) {
              return true;
            }
          }).join('/');
        });
      const name = cells[1].querySelector('a')
        .textContent
        .replace(' ', ' ')
        .trim();
      const degree = Number(
        cells[1].textContent
          .replace(' ', ' ')
          .replace(name, '')
          .trim()
          .replace(/iv/gi, '4')
          .replace(/iii/gi, '3')
          .replace(/ii/gi, '2')
          .replace(/i/gi, '1')
          .split(/\s+/)[0]
      ) || undefined;
      return { name, degree, images, };
    })
    .reduce((awards, award) => {
      // Если нет награды, создать
      if (!awards[award.name]) {
        awards[award.name] = { name: award.name, images: [] };
      }
      // Если награда имеет степени, создавать доп. поля
      if (award.degree) {
        // Берем наибольшую степень как кол-во степеней вообще
        if (
          !awards[award.name].degrees ||
          (award.degree > awards[award.name].degrees)
        ) {
          awards[award.name].degrees = award.degree;
        }
      }
      // Картинки
      awards[award.name].images[award.degree ? award.degree - 1 : 0] = award.images;
      return awards
    }, {});
}

async function getRemoteAwardImage (url) {
  const baseUrl = 'https://ru.wikipedia.org/wiki';
  const fragment = await getHtmlBodyFragmentFromUrl(`${baseUrl}/${url}`);
  const rows = Array.prototype.slice
    .call(fragment.querySelectorAll('table.wikitable tr'))
    .slice(1);
  return rows;
}

export async function getRemoteAwardReasons ({ callback }) {
  const awards = {}
  const baseUrl = 'http://award.gov.ru';
  const list = [
    'hero.html',
    'workhero.html',
  ];
  const folders = [
    'orders.html',
    'medals.html',
    'znakotl.html'
  ];
  // Получить список всех нужных страниц
  await Promise.all(folders.map(async url => {
    const fragment = await getHtmlBodyFragmentFromUrl(
      `${baseUrl}/${url}`
    );
    const pages = Array.prototype.slice
      .call(fragment.querySelectorAll('#listLayer .orders a'))
      .map(element => element.href.split('/').slice(-1)[0])
      .forEach(page => list.push(page));
  }));
  // Читаем все страницы
  let index = 0;
  while (index < list.length) {
    const award = await getRemoteAwardReason(list[index]);
    awards[award.name] = award;
    callback({ value: award, index: index, list })
    index += 1;
    await new Promise(resolve => {
      setTimeout(resolve, random(200, 500));
    });
  }
  return awards;
}

async function getRemoteAwardReason (url) {
  const baseUrl = 'http://award.gov.ru';
  const fragment = await getHtmlBodyFragmentFromUrl(
    `${baseUrl}/${url}`,
    'windows-1251'
  );
  return parseRemoteAwardReason(fragment.querySelector('#listLayer'));
}

function parseRemoteAwardReason (fragment) {
  const name = fragment.querySelector('p.articleName')
    .textContent
    .trim()
    .replace(/"([а-я]+)/gi, '«$1')
    .replace(/([а-я]+)"/gi, '$1»');
  const reason = Array.from(
    Array.from(fragment.querySelectorAll('ol, ul') || []).slice(-1)[0]?.children || []
  ).map(element => element.textContent.trim()).join('\n\n');
  return { name, reason };
}




