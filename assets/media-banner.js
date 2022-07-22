export class HTMLMediaBannerElement extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 100vh;
        }
        :host(.action) {
          cursor: pointer;
        }
        :host video {
          position: absolute;
          z-index: 0;
        }
        :host .interlace {
          background-image: linear-gradient(
            0deg,
            #c9d1b8 12.50%,
            #757368 12.50%,
            #757368 50%,
            #c9d1b8 50%,
            #c9d1b8 62.50%,
            #757368 62.50%,
            #757368 100%
          );
          background-size: 8.00px 8.00px;
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          opacity: 0.125;
          z-index: 0;
        }
        :host .audio-control {
          position: absolute;
          right: 4rem;
          top: 1rem;
          font-size: 1.5rem;
          line-height: 2rem;
          width: 2rem;
          height: 2rem;
          display: block;
          /*background-color: transparent;*/
          background-color: #4e4e4b;
          border-radius: 25%;
          border: 0;
          padding: 0;
          margin: 0;
          text-align: center;
          cursor: pointer;
          z-index: 3;
        }
        ::slotted(*) {
          position: relative;
          z-index: 1;
        }
      </style>
      <slot></slot>
    `;

    // Запускать треки извне
    this.listen('toggle-audio', this, event => {
      // Если есть треки уже (инициализировано),
      // поставить играть трек. Или сначала инициализировать
      const src = event.detail.source;
      if (!this.audioSources.includes(src)) {
        this.audioSources.push(src);
      }
      if (this.currentAudioSource !== src || this.mediaAudioElement.paused) {
        this.playAudioSource(src);
      } else {
        this.stopAudioSource();
      }
    });
  }

  cleanupTasks = [];

  audioPlayerId = 'media-banner-audio-player';

  currentAudioSource = '';

  // Properties

  get videoRatio () {
    return this.getAttribute('video-ratio') || (16 / 9);
  }

  get videoPosition () {
    return this.getAttribute('video-position') || 'center center';
  }

  get videoFilter () {
    return this.getAttribute('video-filter') || '';
  }

  get videoInterlace () {
    return this.getBooleanAttribute('video-interlace');
  }

  get videoNoResize () {
    return this.getBooleanAttribute('video-noresize');
  }

  get audioSources () {
    return this.getAttribute('audio').split(/\s*,\s*/);
  }

  set audioSources (list = []) {
    this.setAttribute('audio', list.join(', '));
  }

  get currentAudioType () {
    const types = {
      'mp3': 'audio/mpeg'
    };
    return types[this.currentAudioSource?.split(/\./).slice(-1)[0] || 'mp3'];
  }

  // DOM references

  get mediaVideoElement () {
    return this.shadowRoot.querySelector('video');
  }

  get mediaAudioElement () {
    return document.getElementById(this.audioPlayerId);
  }

  get mediaAudioControl () {
    return this.shadowRoot.querySelector('button.audio-control');
  }

  // Lifecycle

  static get observedAttributes () {
    return ['color', 'image', 'video', 'audio'];
  }

  attributeChangedCallback (name, previousValue, value) {
    switch (name) {
      case 'color':
        this.setupMediaColor(value);
        break;
      case 'image':
        this.setupMediaImage(value);
        break;
      case 'video':
        this.setupMediaVideo(value);
        break;
      case 'audio':
        this.setupMediaAudio(value);
        break;
    }
  }

  disconnectedCallback () {
    this.cleanup();
  }

  // Setup

  setupMediaColor (color) {
    this.style.backgroundColor = color;
  }

  setupMediaImage (image) {
    this.style.backgroundImage = `url(${image})`;
    this.style.backgroundSize = this.getAttribute('image-size') || 'auto';
    this.style.backgroundRepeat = this.getAttribute('image-repeat') || 'no-repeat';
    this.style.backgroundPosition = this.getAttribute('image-position') || 'left center';
    this.style.filter = this.getAttribute('image-filter');
    if (this.videoInterlace) {
      const interlace = document.createElement('div');
      interlace.classList.add('interlace');
      this.shadowRoot.insertBefore(interlace, this.shadowRoot.querySelector('slot')); // cleanup 1
    }
  }

  setupMediaVideo (video) {
    this.cleanup('video'); // initial cleanup

    if (video) {
      const t = document.createElement('template');
      t.innerHTML = `
        <video muted="true" autoplay="" preload>
          <source src="${video}" type="video/${video.split('.').slice(-1)[0]}">
        </video>
        ${this.videoInterlace ? '<div class="interlace"></div>' : ''}
      `;

      // insert video element
      this.shadowRoot.insertBefore(
        t.content.cloneNode(true),
        this.shadowRoot.querySelector('slot')
      ); // cleanup 1

      // position + resize
      this.positionMediaVideo();
      if (!this.videoNoResize) {
        this.listen('resize', window, this.resizeMediaVideo, 'video');
        this.listen('resize-media-banner', document, this.resizeMediaVideo, 'video');
        requestAnimationFrame(this.resizeMediaVideo.bind(this))
      }

      // autoplay + loop
      this.mediaVideoElement.play();
      this.listen('ended', this.mediaVideoElement, () => {
        this.mediaVideoElement.play();
      }, 'video');

      // Style (image filter)
      if (this.videoFilter) {
        this.mediaVideoElement.style.filter = this.videoFilter;
      }

      // Cleanup 1
      this.cleanupTasks.push(['video', () => {
        if (this.mediaVideoElement) {
          this.mediaVideoElement.remove();
        }
      }]);
    }
  }

  setupMediaAudio (audio = '') {
    // add global player
    if (!this.mediaAudioElement) {
      const audioTemplate = document.createElement('template');
      audioTemplate.innerHTML = `<audio id="${this.audioPlayerId}" preload></audio>`;
      document.body.append(audioTemplate.content.cloneNode(true));
    }
    this.currentAudioSource = this.randomAudioSource(this.audioSources);
    this.mediaAudioElement.setAttribute('src', this.currentAudioSource);
    this.mediaAudioElement.setAttribute('type', this.currentAudioType);

    // add control to media banner (may be multiple)
    const controlTemplate = document.createElement('template');
    controlTemplate.innerHTML = `
      <button class="audio-control">🔈</button>
    `;
    // insert audio element
    this.shadowRoot.insertBefore(
      controlTemplate.content.cloneNode(true),
      this.shadowRoot.querySelector('slot')
    ); // cleanup 1

    // Add handlers
    this.listen('click', this, () => {
      // Play if muted, mute if playing
      if (this.mediaAudioElement.getAttribute('src') !== this.currentAudioSource) {
        this.mediaAudioElement.setAttribute('src', this.currentAudioSource);
      }
      if (this.mediaAudioElement.paused || this.mediaAudioControl.innerHTML === '🔈') {
        this.mediaAudioElement.play();
        this.mediaAudioControl.innerHTML = '🔊';
      } else {
        this.mediaAudioElement.pause();
        this.mediaAudioControl.innerHTML = '🔈';
      }
    }, 'audio');

    this.listen('play', this.mediaAudioElement, () => {
      this.dispatchEvent(new CustomEvent('playing-audio', {
        detail: { source: this.currentAudioSource }
      }));
      // ???
      if (this.mediaAudioElement.getAttribute('src') !== this.currentAudioSource) {
        this.mediaAudioControl.innerHTML = '🔈';
      }
    });

    this.listen('ended', this.mediaAudioElement, () => {
      this.playAudioSource(this.randomAudioSource(this.audioSources));
      this.dispatchEvent(new CustomEvent('stopped-audio'));
    });

    this.listen('pause', this.mediaAudioElement, () => {
      this.dispatchEvent(new CustomEvent('paused-audio', {
        detail: { source: this.currentAudioSource }
      }));
    });

    // Кастомное проигрывание треков

    // Cleanup 1
    this.cleanupTasks.push(['audio', () => {
      if (this.mediaAudioControl) {
        this.mediaAudioControl.remove();
      }
    }]);
  }

  // Utils

  resizeMediaVideo () {
    var rect = this.getBoundingClientRect();
    if (rect.width / rect.height > this.videoRatio) {
      this.mediaVideoElement.style.width = '101%';
      this.mediaVideoElement.style.height = `${(rect.width / this.videoRatio) + 6}px`;
    } else {
      this.mediaVideoElement.style.width = `${rect.height * this.videoRatio}px`;
      this.mediaVideoElement.style.height = '101%';
    }
  }

  positionMediaVideo () {
    const setPosition = (position, transform) => {
      const [top, right, bottom, left] = position.split(/\s/g);
      Object.assign(this.mediaVideoElement.style, { top, right, bottom, left, transform });
    };
    if (this.videoPosition.match(/^((center)|(center center))$/)) {
      setPosition('50% auto auto 50%', 'translateX(-50%) translateY(-50%)');
    } else if (this.videoPosition.match(/^((left center)|(center left))$/)) {
      setPosition('50% auto auto 0', 'translateX(0) translateY(-50%)');
    } else if (this.videoPosition.match(/^((right center)|(center right))$/)) {
      setPosition('50% 0 auto auto', 'translateX(0) translateY(-50%)');
    } else if (this.videoPosition.match(/^((top center)|(center top))$/)) {
      setPosition('0 auto auto 50%', 'translateX(-50%) translateY(0)');
    } else if (this.videoPosition.match(/^((bottom center)|(center bottom))$/)) {
      setPosition('auto auto 0 50%', 'translateX(-50%) translateY(0)');
    } else if (this.videoPosition.match(/^((top left)|(left top))$/)) {
      setPosition('0 auto auto 0', 'translateX(0) translateY(0)');
    } else if (this.videoPosition.match(/^((top right)|(right top))$/)) {
      setPosition('0 0 auto auto', 'translateX(0) translateY(0)');
    } else if (this.videoPosition.match(/^((bottom left)|(left bottom))$/)) {
      setPosition('auto auto 0 0', 'translateX(0) translateY(0)');
    } else if (this.videoPosition.match(/^((bottom right)|(right bottom))$/)) {
      setPosition('auto 0 0 auto', 'translateX(0) translateY(0)');
    }
  }

  randomAudioSource (sources = []) {
    const source = sources[parseInt(Math.random() * sources.length, 10)];
    if (this.currentAudioSource === source) {
      return this.randomAudioSource(sources);
    } else {
      return source;
    }
  }

  playAudioSource (src) {
    this.currentAudioSource = src;
    this.mediaAudioElement.setAttribute('src', this.currentAudioSource);
    this.mediaAudioElement.play();
    this.mediaAudioControl.innerHTML = '🔊';
  }

  stopAudioSource () {
    this.mediaAudioElement.pause();
    this.mediaAudioControl.innerHTML = '🔈';
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

  getBooleanAttribute (name) {
    const attr = this.getAttribute(name);
    return attr === 'true' || attr === '' || (attr && attr !== 'false');
  }
}

customElements.define('media-banner', HTMLMediaBannerElement);
