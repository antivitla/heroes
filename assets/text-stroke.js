export default function initTextStroke () {
  Array.from(document.querySelectorAll('[data-text-stroke]')).forEach(element => {
    if (!element.getAttribute('data-text-content')) {
      element.setAttribute('data-text-content', element.textContent);
    }
    const type = element.getAttribute('data-text-stroke');
    element.classList.add(`text-stroke${type ? `-${type}` : ''}`);
  });
}