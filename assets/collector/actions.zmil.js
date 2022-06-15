import { getHtmlBodyFragmentFromUrl } from './utils.resource.js';

export async function getRemoteAllCards () {
  const baseUrl = 'https://z.mil.ru:443';
  const bodyFragment = await getHtmlBodyFragmentFromUrl(`${baseUrl}/spec_mil_oper/heroes.htm`);
  const heroNodeList = bodyFragment.querySelectorAll('.gallery_heroes > a');
  return Array.prototype.reduce.call(heroNodeList, (cards, node) => {
    let name = node.querySelector('span').textContent.trim();
    // Исправить ошибки в именах
    name = name.replace('Витайлий', 'Виталий');
    name = name.replace('ё', 'е');
    // Сформировать первичную карточку
    const photo = `${baseUrl}/${node.querySelector('img').getAttribute('src')}`;
    const poster = `${baseUrl}/${node.getAttribute('href')}`;
    cards.push({ name, photo, poster });
    return cards;
  }, []);
}

export async function getRemoteBriefings () {
  // https://z.mil.ru/spec_mil_oper/brief/briefings.htm?f=1&fid=0&blk=12411803&objInBlock=50
  const baseUrl = 'https://z.mil.ru';
  const limit = 50;
  let offset = 0;
  let done = false;
  let briefings = [];
  while (!done) {
    const params = new URLSearchParams({
      f: offset + 1,
      blk: 12411803,
      objInBlock: limit
    }).toString();
    const bodyFragment = await getHtmlBodyFragmentFromUrl(
      `${baseUrl}/spec_mil_oper/brief/briefings.htm?${params}`
    );
    const nodes = bodyFragment.querySelectorAll('.newsitem');
    if (!nodes.length) {
      done = true;
    } else {
      briefings = briefings.concat(Array.prototype.slice.call(nodes));
      offset += limit;
    }
  }
  return briefings.map(briefing => {
    return {
      date: briefing.querySelector('.date').textContent.split('(')[0].trim(),
      url: `${baseUrl}/${briefing.querySelector('a').getAttribute('href')}`
    };
  });
}

export async function getRemoteBriefing (url) {
  // https://z.mil.ru/spec_mil_oper/brief/briefings/more.htm?id=12424655@egNews
  const bodyFragment = await await getHtmlBodyFragmentFromUrl(url);
  const article = Array.prototype.slice.call(
    bodyFragment.querySelectorAll('#content #center h1 ~ p[style]')
  ).map(element => element.textContent.trim()).join('\n\n');
  return article;
}
