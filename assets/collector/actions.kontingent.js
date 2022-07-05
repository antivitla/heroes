import { formatDate } from './utils.common.js';
import { getJsonDocument } from './utils.resource.js';

export async function getAllOurHeroesList ({ limit = 20, callback } = {}) {
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

  console.log('Всего', items.length, 'записей');

  return items.map(item => {
    return {
      id: item.slug,
      name: item.title.replace(/Герои Z\.\s+/gi, '').replace('.', ''),
      photo: item.image_url,
      url: `https://kontingent.press/post/${item.slug}`
    };
  });
}

