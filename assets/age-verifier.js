class AgeVerifier extends HTMLElement {
  constructor() {
    super();

    this.cookieName = 'beyours:age-verifier';

    this.classes = {
      bodyClass: 'promo-popup--open',
      activeClass: 'is-active',
      closingClass: 'is-closing',
      showImage: 'show-image',
      blurImage: 'promo-popup--blur'
    };

    this.blurImage = this.dataset.blurImage === 'true';

    this.popup = this.querySelector('.promo-popup');

    if (!this.getCookie(this.cookieName) || this.dataset.testMode === 'true') {
      this.init();
    }

    const button = this.querySelector('button');
    if (button) button.addEventListener('click', this.close.bind(this));
  }

  connectedCallback() {
    if (Shopify.designMode) {
      this.onShopifySectionLoad = this.onSectionLoad.bind(this);
      this.onShopifySectionSelect = this.onSectionSelect.bind(this);
      this.onShopifySectionDeselect = this.onSectionDeselect.bind(this);
      document.addEventListener('shopify:section:load', this.onShopifySectionLoad);
      document.addEventListener('shopify:section:select', this.onShopifySectionSelect);
      document.addEventListener('shopify:section:deselect', this.onShopifySectionDeselect);
    }
  }
  disconnectedCallback() {
    if (Shopify.designMode) {
      document.removeEventListener('shopify:section:load', this.onShopifySectionLoad);
      document.removeEventListener('shopify:section:select', this.onShopifySectionSelect);
      document.removeEventListener('shopify:section:deselect', this.onShopifySectionDeselect);

      document.body.classList.remove(this.classes.bodyClass);
      this.blurImage && document.body.classList.remove(this.classes.blurImage);
    }
  }
  onSectionLoad(event) {
    filterShopifyEvent(event, this, () => this.open.bind(this));
  }
  onSectionSelect(event) {
    filterShopifyEvent(event, this, this.open.bind(this));
  }
  onSectionDeselect(event) {
    filterShopifyEvent(event, this, this.close.bind(this));
  }

  init() {
    if (Shopify && Shopify.designMode) {
      return;
    }

    this.open();
  }

  open() {
    console.log(this.blurImage);
    document.body.classList.remove(this.classes.bodyClass);
    this.blurImage && document.body.classList.remove(this.classes.blurImage);

    this.popup.classList.add(this.classes.activeClass);
    setTimeout(() => {
      this.popup.classList.add(this.classes.showImage);
    }, 600);

    if (this.popup.dataset.position === 'center') {
      setScrollbarWidth();
      document.body.classList.add(this.classes.bodyClass);
      this.blurImage && document.body.classList.add(this.classes.blurImage);
    }
  }

  close() {
    this.popup.classList.add(this.classes.closingClass);
    this.blurImage && document.body.classList.remove(this.classes.blurImage);

    setTimeout(() => {
      this.popup.classList.remove(this.classes.activeClass);
      this.popup.classList.remove(this.classes.closingClass);
      this.popup.classList.remove(this.classes.showImage);

      if (this.popup.dataset.position === 'center') {
        document.body.classList.remove(this.classes.bodyClass);
      }
    }, 500);

    // Remove a cookie in case it was set in test mode
    if (this.dataset.testMode === 'true') {
      this.removeCookie(this.cookieName);
      return;
    }

    this.setCookie(this.cookieName, this.dataset.expiry);
  }

  getCookie(name) {
    const match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
    return match ? match[2] : null;
  }

  setCookie(name, expiry) {
    document.cookie = `${name}=true; max-age=${(expiry * 24 * 60 * 60)}; path=/`;
  }

  removeCookie(name) {
    document.cookie = `${name}=; max-age=0`;
  }
}
customElements.define('age-verifier', AgeVerifier);
