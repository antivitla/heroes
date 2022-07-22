export default function initToggle (parent = document.documentElement) {
  Array.from(parent.querySelectorAll('[data-toggle-container]')).forEach(element => {
    // Выставить исходные данные
    const data = JSON.parse(localStorage.getItem('toggle-container')) || {};
    Object.keys(data).forEach(selector => {
      parent.querySelector(selector).classList.add(data[selector]);
    });
    // Подписка на события чтоб реагировать
    if (!element.initToggle) {
      element.addEventListener('click', () => {
        const selector = element.getAttribute('data-toggle-container') || '';
        const container = parent.querySelector(selector);
        const toggleClass = element.getAttribute('data-toggle-class') || 'toggle-on';
        container?.classList.toggle(toggleClass);
        if (container?.classList.contains(toggleClass)) {
          data[selector] = toggleClass;
        } else {
          delete data[selector];
        }
        localStorage.setItem('toggle-container', JSON.stringify(data));
      });
      element.initToggle = true;
    }
  });
};