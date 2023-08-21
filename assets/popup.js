class SocialFloating extends HTMLElement {
  constructor() {
    super();

    // Prevent popup on Shopify robot challenge page
    if (window.location.pathname === '/challenge') {
      return;
    }

    this.classes = {
      activeClass: 'is-active',
      closingClass: 'is-closing'
    };

    this.querySelectorAll('[data-social-toggle]').forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    if (!theme.config.mqlSmall) return;

    this.classList.contains(this.classes.activeClass) ? this.close() : this.open();
  }

  open() {
    this.classList.add(this.classes.activeClass);

    // close promo-popup
    const popup = document.querySelector('promo-popup');
    popup && popup.close();
  }

  close() {
    this.classList.add(this.classes.closingClass);

    setTimeout(() => {
      this.classList.remove(this.classes.activeClass);
      this.classList.remove(this.classes.closingClass);
    }, 500);
  }
}
customElements.define('social-floating', SocialFloating);

class PromoPopup extends HTMLElement {
  constructor() {
    super();

    // Prevent popup on Shopify robot challenge page
    if (window.location.pathname === '/challenge') {
      return;
    }

    this.cookieName = 'beyours:promo-popup';

    this.classes = {
      bodyClass: 'promo-popup--open',
      activeClass: 'is-active',
      closingClass: 'is-closing',
      showImage: 'show-image'
    };

    this.popup = this.querySelector('.promo-popup');

    // Open modal if errors or success message exist
    if (this.querySelector('.form__message')) {
      this.open();
    }

    this.querySelectorAll('[data-popup-toggle]').forEach((button) => {
      button.addEventListener('click', this.onButtonClick.bind(this));
    });

    if (!this.getCookie(this.cookieName) || this.dataset.testMode === 'true') {
      this.init();
    }
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

    setTimeout(function() {
      this.open();
    }.bind(this), parseInt(this.dataset.delay) * 1000);
  }

  onButtonClick(event) {
    event.preventDefault();
    this.popup.classList.contains(this.classes.activeClass) ? this.close() : this.open();
  }

  open() {
    document.body.classList.remove(this.classes.bodyClass);
    this.popup.classList.add(this.classes.activeClass);
    setTimeout(() => {
      this.popup.classList.add(this.classes.showImage);
    }, 600);

    if (this.popup.dataset.position === 'center') {
      setScrollbarWidth();
      document.body.classList.add(this.classes.bodyClass);
    }

    // close social-floating
    const social = document.querySelector('social-floating');
    social && social.close();
  }

  close() {
    this.popup.classList.add(this.classes.closingClass);

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
customElements.define('promo-popup', PromoPopup);
