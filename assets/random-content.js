export class HTMLRandomContentElement extends HTMLElement {
  constructor () {
    super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          ::slotted(option) {
            display: inherit;
          }
        </style>
        <slot></slot>
      `;
  }

  get optionsElements () {
    return Array.from(this.querySelectorAll('random-content-option'));
  }

  connectedCallback () {
    const randomOptionElement = this.getRandomOption();
    this.optionsElements.forEach(element => {
      if (element !== randomOptionElement) {
        element.classList.remove('selected');
      } else {
        element.classList.add('selected');
      }
    })
  }

  getRandomOption () {
    const randomIndex = parseInt(Math.random() * this.optionsElements.length, 10);
    return this.optionsElements[randomIndex];
  }
}

export class HTMLRandomContentOptionElement extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: none;
          }
          :host(.selected) {
            display: inherit;
          }
        </style>
        <slot></slot>
      `;
  }
}

customElements.define('random-content', HTMLRandomContentElement);
customElements.define('random-content-option', HTMLRandomContentOptionElement);