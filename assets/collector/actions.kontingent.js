import { formatDate } from './utils.common.js';
import { getJsonDocument } from './utils.resource.js';

export async function getOurHeroesList ({ limit = 20, callback } = {}) {
  let items = [];
  let offset = 0;
  let next = `https://kontingent.press/api/v1/posts/posts/?category=geroi-z&limit=${limit}&offset=${offset}`;

  while (next) {
    const data = await getJsonDocument(next);
    offset += limit;
    callback({ index: offset, total: data.count });
    items = items.concat(data.results);
    next = data.next ? data.next.replace(/^http:/, 'https:') : null;
  }

  return items.map(item => {
    return {
      id: item.id,
      name: item.title.replace(/Герои Z\.\s+/gi, '').replace('.', ''),
      photo: item.image_url,
      url: `https://kontingent.press/post/${item.slug}`,
    };
  });

  console.log(items);

}

// export async function getWarheroesList(fromDate) {
//   // Начиная с какой-то заданной даты, получить все страницы списка героев
//   let page = 1;
//   let totalRows = []
//   while (page > 0) {
//     const { rows, nextPage } = await getWarheroesTableRows(
//       fromDate && formatDate(new Date(fromDate), 'DD.MM.YYYY'),
//       page
//     );
//     page = Number(nextPage);
//     totalRows = totalRows.concat(rows);
//   }

//   page = 1;
//   while (page > 0) {
//     const { rows, nextPage } = await getWarheroesTableRows(
//       fromDate && formatDate(new Date(fromDate), 'DD.MM.YYYY'),
//       page,
//       true
//     );
//     page = Number(nextPage);
//     totalRows = totalRows.concat(rows);
//   }
//   const heroesMap = totalRows.filter(row => row.childElementCount > 1)
//     .map(row => {
//       const cells = row.querySelectorAll('td');
//       const dateOfAward = convertWarheroesDateFormat(cells[3].textContent.trim());
//       const dateOfDeath = convertWarheroesDateFormat(cells[5].textContent.trim());
//       const hero = {
//         awards: cells[0].querySelector('img[src*="11_star.gif"]')
//           ? ['Герой Труда Российской Федерации']
//           : ['Герой Российской Федерации'],
//         area: cells[1].querySelector('img[alt]').getAttribute('alt').trim(),
//         name: cells[2].querySelector('a.main').textContent
//           .trim()
//           .replace('ё', 'е')
//           .replace(/[^а-я]+/gi, ' '),
//         url: cells[2].querySelector('a.main').getAttribute('href').trim(),
//         dateOfAward,
//       };
//       if (dateOfDeath) {
//         hero.dateOfDeath = dateOfDeath;
//       }
//       return hero;
//     }).sort((a, b) => {
//       const dateA = (!a.dateOfDeath || a.dateOfDeath > a.dateOfAward)
//         ? a.dateOfAward
//         : a.dateOfDeath;
//       const dateB = (!b.dateOfDeath || b.dateOfDeath > b.dateOfAward)
//         ? b.dateOfAward
//         : b.dateOfDeath;
//       a.date = dateA;
//       b.date = dateB;
//       return dateA < dateB ? -1 : 1;
//     }).reduce((map, hero) => {
//       map[hero.name] = hero;
//       return map;
//     }, {});
//   return Object.values(heroesMap);
// }

// function getWarheroesTableRows (fromDate, page, byDeath = false) {
//   const params = new URLSearchParams();
//   if (fromDate) {
//     params.set('fromDate', fromDate);
//   }
//   if (page > 1) {
//     params.set('page', page);
//   }
//   if (byDeath) {
//     params.set('byDeath', true);
//   }
//   return fetch(`api/warheroes-search.php?${params.toString()}`)
//     .then(response => {
//       if (response.ok) {
//         return response.text();
//       } else {
//         throw new Error(response);
//       }
//     })
//     .then(htmlString => {
//       const fragment = getHtmlBodyFragmentFromString(htmlString)
//       const rows = Array.prototype.slice.call(
//         fragment.querySelector('a[href*="/hero/hero.asp"]')
//           .closest('table')
//           .querySelectorAll('tr'),
//         0
//       ).slice();
//       const nextPage = fragment
//         .querySelector('a[href*="/main.asp/page/"].href_nav')?.closest('tr')
//         .querySelector('td:last-child > a[href*="/main.asp/page/"]')?.getAttribute('href')
//         .split('page/')[1].split('/')[0] || -1;
//       return {
//         rows: rows.filter(row => row.childElementCount > 1).slice(1),
//         nextPage
//       };
//     })
//     .catch(error => {
//       console.log(error);
//     });
// }

// function convertWarheroesDateFormat (string) {
//   let raw = string.trim().replace('?', '');
//   if (!raw) {
//     return '';
//   }
//   const parts = raw.split('.');
//   const y = parts[2] || '';
//   const m = parts[1] || '';
//   const d = parts[0] || '';
//   return `${y || '2022'}-${m || '01'}-${d || '01'}`;
// }

