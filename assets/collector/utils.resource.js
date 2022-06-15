import { random, listMapEntriesByKeys } from './utils.common.js';

export async function getJsonDocument (path, defaultResult = {}) {
  return fetch(path).then(response => {
    if (response.ok) {
      return response.json();
    } else if (response.status === 404) {
      return defaultResult;
    } else {
      throw new Error(response.statusText, { cause: response });
    }
  });
}

export async function saveJsonDocument (saveTo, jsonDocument) {
    if (!jsonDocument) {
    alert('saveJsonDocument: no document to save, you my loose old data');
    throw new Error('saveJsonDocument: no document name, you my loose old data');
  }
  const params = new URLSearchParams({ saveTo }).toString();
  return fetch(`api/save-document-to-file.php?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(jsonDocument, null, '  ')
  }).then(response => {
    if (response.ok) {
      return response.text();
    } else {
      throw new Error(response.statusText, { cause: response });
    }
  });
}

export async function getHtmlDocumentFromUrl (url, charset) {
  const params = new URLSearchParams({ url });
  if (charset) {
    params.set('charset', charset);
  }
  return fetch(`api/fetch-document-from-url.php?${params.toString()}`)
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        const message = `${url}: ${response.statusText}`;
        alert(message);
        throw new Error(message, { cause: response });
      }
    })
    .then(text => {
      if (!text) {
        const message = `getHtmlDocumentFromUrl "${url}" error: empty text`;
        alert(message);
        throw new Error(message);
      } else {
        return text;
      }
    });
}

export async function getHtmlBodyFragmentFromUrl (url, charset) {
  const htmlString = await getHtmlDocumentFromUrl(url, charset);
  const htmlBodyString = htmlString.split(/<body[^>]*>/)[1].split(/<\/body>/)[0];
  const templateElement = document.createElement('template');
  templateElement.innerHTML = htmlBodyString;
  return templateElement.content;
}

export function getHtmlBodyFragmentFromString (htmlString) {
  const htmlBodyString = htmlString.split(/<body[^>]*>/)[1].split(/<\/body>/)[0];
  const templateElement = document.createElement('template');
  templateElement.innerHTML = htmlBodyString;
  return templateElement.content;
}

export async function getBase64Image (path) {
  return fetch(path)
    .then(response => response.blob())
    .then(blob => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = function () { resolve(this.result); };
      reader.readAsDataURL(blob);
    }));
}

export function downloadImages ({ list, keys, callback, pathSaveTo }) {
  const errors = [];
  return Promise.all(
    listMapEntriesByKeys(list, keys).map(async ({ index, key, value: url}) => {
      let filename;
      if (url.match(/^https?:/i) || !url.match(/^data:image/i)) {
        filename = url.split('/').slice(-1)[0];
      } else {
        filename = `${index}-${key}-${uuidv1()}.jpg`;
      }
      const saveTo = `${pathSaveTo.trim().replace(/\/$/, '')}/${filename}`;
      await new Promise(resolve => {
        setTimeout(resolve, random(500, 700));
      });
      return downloadImage(url, saveTo).then(() => {
        callback({ index, key, saveTo })
      }).catch(error => {
        errors.push(error);
      });
    })
  ).then(() => errors);
}

export function downloadImage (url, saveTo) {
  // Common remote url
  if (url.match(/^https?:/gi) || !url.match(/^data:image/gi)) {
    const params = new URLSearchParams({ url, saveTo }).toString();
    return fetch(`api/download-image-from-url.php?${params}`);
  }
  // Base64 data url
  else {
    return fetch(url).then(result => result.blob()).then(blob => {
      const file = new File([blob], 'temp.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('files[]', file);
      const params = new URLSearchParams({ saveTo }).toString();
      return fetch(`api/save-image-to-file.php?${params}`, {
        method: 'POST',
        body: formData
      }).then(response => {
        if (response.ok) {
          return response.text();
        } else {
          throw new Error(`"api/save-image-to-file.php" ${response.statusText}`);
        }
      });
    });
  }
}

export function copyFile (from, to) {
  const params = new URLSearchParams({ from, to }).toString();
  return fetch(`api/copy-file.php?${params}`).then(response => {
    if (response.ok) {
      return response.text();
    } else {
      throw new Error(`"api/copy-file.php" ${response.statusText}`);
    }
  });
}
