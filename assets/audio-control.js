function getAllPlayAudioElements () {
  return Array.from(document.querySelectorAll('[data-play-audio]') || []);
}

export default function initAudioControl () {
  const list = getAllPlayAudioElements();
  list.forEach(element => {
    if (!element.initAudioControl) {
      element.addEventListener('click', () => {
        const target = document.querySelector(element.getAttribute('data-target'));
        if (target) {
          const src = element.getAttribute('data-play-audio');
          target.dispatchEvent(new CustomEvent('play', {
            detail: src
          }))
        }
      });
      element.initAudioControl = true;
    }
  })
}