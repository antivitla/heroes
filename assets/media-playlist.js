export class HTMLMediaPlaylistElement extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
    `;
  }

  cleanupTasks = [];

  get mediaType () {
    return this.getAttribute('type');
  }

  get mediaElement () {
    return document.querySelector(this.getAttribute('for'));
  }

  static get observedAttributes () {
    return ['for'];
  }

  attributeChangedCallback (name, previousValue, value) {
    switch (name) {
      case 'for':
        this.setupFor();
        break;
    }
  }

  connectedCallback () {

    if (!this.mediaElement) {
      console.warn('HTMLMediaPlaylistElement: No \'for\' attribute, won\'t play anything');
    } else {
      this.setupFor();
    }

    this.listen('toggle-playlist-item', this, event => {
      this.mediaElement.dispatchEvent(new CustomEvent(`toggle-${this.mediaType}`, {
        detail: event.detail
      }));
    });
  }

  disconnectedCallback () {
    this.cleanup();
  }

  setupFor () {
    this.cleanup();
    if (this.mediaElement) {
      this.listen('playing-audio', this.mediaElement, event => {
        Array.from(this.querySelectorAll('media-playlist-item')).forEach(element => {
          if (element.getAttribute('src') === event?.detail.source) {
            element.dispatchEvent(new CustomEvent('playing'));
          } else {
            element.dispatchEvent(new CustomEvent('stopped'));
          }
        });
      });
      this.listen('stopped-audio', this.mediaElement, event => {
        Array.from(this.querySelectorAll('media-playlist-item')).forEach(element => {
          element.dispatchEvent(new CustomEvent('stopped'));
        });
      });
      this.listen('paused-audio', this.mediaElement, event => {
        Array.from(this.querySelectorAll('media-playlist-item')).forEach(element => {
          if (element.getAttribute('src') === event?.detail.source) {
            element.dispatchEvent(new CustomEvent('paused'));
          } else {
            element.dispatchEvent(new CustomEvent('stopped'));
          }
        });
      });
    }
  }

  // Event helpers

  listen (event, target, callback, group) {
    const callbackBinded = callback.bind(this);
    const cleanupTask = () => target.removeEventListener(event, callbackBinded);
    target.addEventListener(event, callbackBinded);
    this.cleanupTasks.push(group ? [group, cleanupTask] : cleanupTask);
  }

  cleanup (group) {
    if (group) {
      this.cleanupTasks = this.cleanupTasks.filter(task => {
        if (Array.isArray(task) && task[0] === group) {
          task[1]();
          return false;
        } else {
          return true;
        }
      });
    } else {
      while (this.cleanupTasks.length) {
        const task = this.cleanupTasks.shift();
        if (Array.isArray(task)) task[1]();
        else task();
      };
    }
  }
}

export class HTMLMediaPlaylistItemElement extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        :host .media-playlist-item-link:empty {
          display: none;
        }

        :host .media-playlist-item-link {
          color: var(--color-media-playlist-item-link, inherit);
          margin-left: 0.75rem;
        }

        :host .media-playlist-item-link svg {
          display: block;
        }

        :host .media-playlist-item-label {
          cursor: pointer;
          position: relative;
          font-size: var(--font-size-media-playlist-item-label, inherit);
          line-height: 1.25;
        }

        :host .media-playlist-item-label.playing:before {
          content: "\u25B8 ";
          position: absolute;
          left: -1rem;
          top: 50%;
          transform: translateY(-50%);
          line-height: 1;
          font-size: var(--font-size-media-playlist-item-play-icon, inherit);
        }

        :host .media-playlist-item-label.paused:before {
          content: "=";
          position: absolute;
          left: -1rem;
          top: 50%;
          transform: translateY(-50%) rotate(90deg);
          line-height: 1;
          font-size: var(--font-size-media-playlist-item-play-icon, inherit);
        }
      </style>
      <span class="media-playlist-item-label" title="Запустить"><slot></slot></span>
      <a class="media-playlist-item-link" target="_blank" title="Открыть в новом окне"></a>
    `;
  }

  cleanupTasks = [];

  get source () {
    return this.getAttribute('src') || '';
  }

  get href () {
    return this.getAttribute('href') || '';
  }

  set href (href) {
    this.setAttribute('href', href);
  }

  get linkElement () {
    return this.shadowRoot.querySelector('.media-playlist-item-link');
  }

  get labelElement () {
    return this.shadowRoot.querySelector('.media-playlist-item-label');
  }

  // Lifecycle


  static get observedAttributes () {
    return ['href'];
  }

  attributeChangedCallback (name, previousValue, value) {
    switch (name) {
      case 'href':
        this.setupHref(value);
        break;
    }
  }

  connectedCallback () {
    // Настроить события
    this.listen('click', this.labelElement, event => {
      this.dispatchEvent(new CustomEvent('toggle-playlist-item', {
        detail: { source: this.source },
        bubbles: true
      }))
    });

    this.listen('playing', this, () => {
      console.log('playing', this.textContent);
      this.labelElement.classList.add('playing');
      this.labelElement.classList.remove('paused');
    });

    this.listen('stopped', this, () => {
      this.labelElement.classList.remove('playing');
      this.labelElement.classList.remove('paused');
    });

    this.listen('paused', this, () => {
      console.log('paused', this.textContent);
      this.labelElement.classList.remove('playing');
      this.labelElement.classList.add('paused');
    });
  }

  disconnectedCallback () {
    this.cleanup();
  }

  // Init

  setupHref (href) {
    const linkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16"><path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"></path><path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"></path></svg>`;
    if (href) {
      // Добавить ссылку
      this.linkElement.innerHTML = linkIcon;
      this.linkElement.href = href;
    } else {
      // Убрать ссылку
      this.linkElement.innerHTML = '';
    }
  }

  // Event helpers

  listen (event, target, callback, group) {
    const callbackBinded = callback.bind(this);
    const cleanupTask = () => target.removeEventListener(event, callbackBinded);
    target.addEventListener(event, callbackBinded);
    this.cleanupTasks.push(group ? [group, cleanupTask] : cleanupTask);
  }

  cleanup (group) {
    if (group) {
      this.cleanupTasks = this.cleanupTasks.filter(task => {
        if (Array.isArray(task) && task[0] === group) {
          task[1]();
          return false;
        } else {
          return true;
        }
      });
    } else {
      while (this.cleanupTasks.length) {
        const task = this.cleanupTasks.shift();
        if (Array.isArray(task)) task[1]();
        else task();
      };
    }
  }
}

customElements.define('media-playlist', HTMLMediaPlaylistElement);
customElements.define('media-playlist-item', HTMLMediaPlaylistItemElement);
