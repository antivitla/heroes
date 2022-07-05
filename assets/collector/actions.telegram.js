const { TelegramClient } = window.telegram;
const { StringSession } = window.telegram.sessions;
const { Api } = window.telegram.tl;
import { clone } from './utils.common.js';
import { getJsonDocument, saveJsonDocument } from './utils.resource.js';

let telegramClient;

async function getTelegramClient () {
  telegramClient = telegramClient || await createTelegramClient();
  if (!telegramClient.connected && !telegramClient.connecting) {
    await telegramClient.connect();
  }
  return telegramClient;
}

async function createTelegramClient () {
  // 1. init telegram
  const credentials = await fetch('credentials.json').then(response => response.json());
  const client = new TelegramClient(
    new StringSession(credentials.telegram.session || ''),
    Number(credentials.telegram.apiId),
    credentials.telegram.apiHash,
    { connectionRetries: 5 }
  );
  await client.start({
    phoneNumber: async () => credentials.telegram.phoneNumber,
    password: async () => prompt('Telegram password:'),
    phoneCode: async () => prompt('Telegram phone code:'),
    onError (error) {
      console.log(error);
    }
  });
  credentials.telegram.session = client.session.save(); // save credentials
  await fetch(`api/save-document-to-file.php?${new URLSearchParams({
    saveTo: 'credentials.json'
  }).toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials, null, '  ')
  });
  return client;
}

//
// Получить данные
//

export async function getLatestMessage (channel) {
  if (!channel) {
    alert('getLatestMessage: no channel name');
    throw new Error('getLatestMessage: no channel name');
  }
  const client = await getTelegramClient();
  const { messages: [message] } = await client.invoke(
    new Api.messages.GetHistory({
      peer: channel,
      limit: 1
    })
  );
  return message;
}

export async function getChannelInfo (channel) {
  if (!channel) {
    alert('getChannelInfo: no channel name');
    throw new Error('getChannelInfo: no channel name');
  }
  const client = await getTelegramClient();
  const result = await client.invoke(
    new Api.channels.GetFullChannel({ channel })
  );
  return result;
}

export async function getRemoteCards (channel, { from, limit }) {
  if (!channel) {
    alert('getRemoteCards: no channel name');
    throw new Error('getRemoteCards: no channel name');
  }
  const client = await getTelegramClient();
  const { messages } = await client.invoke(
    new Api.messages.GetHistory({
      peer: channel,
      offsetId: (from >= 0 ? from : 0) + limit,
      limit
    })
  );
  messages.reverse();
  return {
    from: (from >= 0 ? from : 0),
    limit,
    to: from + limit,
    list: messages.filter(message => message.id >= from)
  };
}

export async function getRemoteImages ({ list, callback }) {
  const images = [];
  return Promise.all(
    list.map(async (card, index) => {
      // Мы должны получить или ссылку на картинку или base64
      if (card.media?.webpage?.type === 'photo') {
        const url = card.media.webpage.url.replace('http:', 'https:');
        images.push({ index, url });
        callback({ index, url });
      } else if (card.media?.photo) {
        try {
          const { base64 } = await getRemotePhotoFile(card.media.photo);
          images.push({ index, base64 });
          callback({ index, base64 });
        } catch (error) {
          callback({ index, error });
        }
      }
      return Promise.resolve();
    })
  ).then(() => images);
}

async function getRemotePhotoFile ({ id, accessHash, fileReference, sizes }) {
  const client = await getTelegramClient();
  const thumbSize = sizes.slice(-1)[0].type;
  const { bytes } = await client.invoke(
    new Api.upload.GetFile({
      location: new Api.InputPhotoFileLocation({
        id,
        accessHash,
        fileReference,
        thumbSize
      }),
      limit: 1024 * 1024
    }, {
      isFileTransfer: true,
      createClient: true
    })
  );
  return new Promise(resolve => {
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    const reader = new FileReader();
    reader.onload = function () {
      resolve({
        blob,
        base64: this.result
      });
    };
    reader.readAsDataURL(blob);
  })
}

export async function searchChannelByQuery ({
  query = '',
  channel = '',
  limit = 20,
  offsetRate = 0
}) {
  if (!channel) {
    alert('getChannelInfo: no channel name');
    throw new Error('getChannelInfo: no channel name');
  }
  if (!query) {
    alert('getChannelInfo: no query');
    throw new Error('getChannelInfo: no query');
  }
  const client = await getTelegramClient();
  const result = await client.invoke(
    new Api.messages.SearchGlobal({
      offsetPeer: channel,
      q: query,
      filter: new Api.InputMessagesFilterPhotos({}),
      limit,
      offsetRate
    })
  );
  return {
    limit,
    list: result.messages,
    total: result.count,
    nextRate: result.nextRate
  };
}

export function ifMessageHasMediaPhoto (message) {
  return message.media?.photo || message.media?.webpage?.type === 'photo';
}
