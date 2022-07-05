import { createFragmentFromHtmlString, capitalizeFirstLetter } from './utils.common.js';
import { getHtmlDocumentFromUrl } from './utils.resource.js';

export async function getAllOurHeroesList ({ callback }) {
  const baseUrl = 'https://ug.tsargrad.tv/ajax/moreourheroes';
  // Собираем постранично, пока не закончится
  let done = false;
  let page = 0;
  let list = []
  while (!done) {
    const params = new URLSearchParams({
      page,
      referer: 'https://ug.tsargrad.tv/ourheroes'
    }).toString();
    try {
      const htmlString = await getHtmlDocumentFromUrl(`${baseUrl}?${params}`);
      if (!htmlString.trim()) {
        alert('Кажется, больше нет страниц, все загружено. ' + params);
        done = true;
      } else {
        const bodyFragment = createFragmentFromHtmlString(htmlString);
        list = list.concat(Array.from(bodyFragment.querySelectorAll('.heroes__item')));
      }
      callback({ index: page, list });
      page += 1;
    } catch (error) {
      console.log(error);
      done = true;
    }
  }
  return list.map(parseOurHeroFragment);
}

function parseOurHeroFragment (element) {
  const photo = element.querySelector('.article__media-single img').getAttribute('src');
  return {
    name: element.querySelector('.heroes__item-head h3').textContent.trim()
      .replace('ё', 'е'),
    rank: element.querySelector('.heroes__item-head h4').textContent.trim()
      .replace(/^([а-я])/g, s => s.toUpperCase()),
    photo,
    story: element.querySelector('.article__content').innerHTML.trim(),
    url: 'https://ug.tsargrad.tv/ourheroes',
    id: photo
  };
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
//   return totalRows.filter(row => row.childElementCount > 1)
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
//     });
// }

// function getWarheroesTableRows (fromDate, page) {
//   const params = new URLSearchParams();
//   if (fromDate) {
//     params.set('fromDate', fromDate);
//   }
//   if (page > 1) {
//     params.set('page', page);
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

