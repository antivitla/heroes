export default function initEmitClickEvent () {
  Array.from(document.querySelectorAll('[data-emit-on-click]')).forEach(element => {
    if (!element.initEmitOnClick) {
      element.addEventListener('click', () => {
        const event = element.getAttribute('data-emit-on-click');
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent(event));
        }, Number(element.getAttribute('data-emit-on-click-delay') || 0));
      });
      element.initEmitOnClick = true;
    }
  })
}