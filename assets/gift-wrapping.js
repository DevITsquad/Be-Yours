class GiftQuantity extends QuantityInput {
  constructor() {
    super();
  }

  init() {
    super.init();

    this.giftWrapping = document.querySelector('gift-wrapping');
    this.cartItemsSize = parseInt(this.getAttribute('cart-items-size'));
    this.giftWrapsInCart = parseInt(this.getAttribute('gift-wraps-in-cart'));
    this.itemsInCart = parseInt(this.getAttribute('items-in-cart'));

    // If we have nothing but gift-wrap items in the cart.
    if (this.cartItemsSize == 1 && this.giftWrapsInCart > 0) {
      this.giftWrapping.removeGiftWrap();
    }
    // If we don't have the right amount of gift-wrap items in the cart.
    else if (this.giftWrapsInCart > 0 & this.giftWrapsInCart != this.itemsInCart) {
      this.update();
    }
    // If we have a gift-wrap item in the cart but our gift-wrapping cart attribute has not been set.
    else if (this.giftWrapsInCart > 0 && this.giftWrapping.length == 0) {
      this.update();
    }
    // If we have no gift-wrap item in the cart but our gift-wrapping cart attribute has been set.
    else if (this.giftWrapsInCart == 0 && this.giftWrapping.length > 0) {
      this.update();
    }
  }

  update() {
    this.input.value = this.itemsInCart;
    this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define('gift-quantity', GiftQuantity);

class GiftWrapping extends HTMLElement {
  constructor() {
    super();

    this.miniCart = document.querySelector('mini-cart');
    this.giftWrapId = this.dataset.giftWrapId;
    this.giftWrapping = this.dataset.giftWrapping;
    this.cartItemsSize = parseInt(this.getAttribute('cart-items-size'));
    this.giftWrapsInCart = parseInt(this.getAttribute('gift-wraps-in-cart'));
    this.itemsInCart = parseInt(this.getAttribute('items-in-cart'));

    // When the gift-wrapping checkbox is checked or unchecked.
    this.querySelector('[name="attributes[gift-wrapping]"]').addEventListener("change", (event) => {
      event.target.checked ? this.setGiftWrap() : this.removeGiftWrap();
    });

    if (this.miniCart) return;

    // If we have nothing but gift-wrap items in the cart.
    if (this.cartItemsSize == 1 && this.giftWrapsInCart > 0) {
      this.removeGiftWrap();
    }
    // If we don't have the right amount of gift-wrap items in the cart.
    else if (this.giftWrapsInCart > 0 & this.giftWrapsInCart != this.itemsInCart) {
      this.setGiftWrap();
    }
    // If we have a gift-wrap item in the cart but our gift-wrapping cart attribute has not been set.
    else if (this.giftWrapsInCart > 0 && this.giftWrapping.length == 0) {
      this.setGiftWrap();
    }
    // If we have no gift-wrap item in the cart but our gift-wrapping cart attribute has been set.
    else if (this.giftWrapsInCart == 0 && this.giftWrapping.length > 0) {
      this.setGiftWrap();
    }
  }

  setGiftWrap() {
    const loadingOverlay = this.querySelector('.loading-overlay');
    loadingOverlay.classList.remove('hidden');

    const sections = this.getSectionsToRender().map((section) => section.section);
    const body = JSON.stringify({
      updates: {
        [this.giftWrapId]: this.itemsInCart
      },
      attributes: {
        'gift-wrapping': true
      },
      sections: sections,
      sections_url: window.location.pathname
    });

    fetch(`${window.routes.cart_update_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => response.json())
      .then((response) => {
        loadingOverlay.classList.add('hidden');

        if (document.body.classList.contains('template-cart')) {
          window.location.href = window.routes.cart_url;
          return;
        }

        this.miniCart && this.miniCart.renderContents(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  removeGiftWrap() {
    const loadingOverlay = this.querySelector('.loading-overlay');
    loadingOverlay.classList.remove('hidden');

    const sections = this.getSectionsToRender().map((section) => section.section);
    const body = JSON.stringify({
      updates: {
        [this.giftWrapId]: 0
      },
      attributes: {
        'gift-wrapping': '',
        'gift-note': ''
      },
      sections: sections,
      sections_url: window.location.pathname
    });

    fetch(`${window.routes.cart_update_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => response.json())
      .then((response) => {
        loadingOverlay.classList.add('hidden');
        
        if (document.body.classList.contains('template-cart')) {
          window.location.href = window.routes.cart_url;
          return;
        }

        this.miniCart && this.miniCart.renderContents(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  getSectionsToRender() {
    return [
      {
        id: 'mini-cart',
        section: 'mini-cart',
        selector: '.shopify-section'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'mobile-cart-icon-bubble',
        section: 'mobile-cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      }
    ];
  }
}
customElements.define('gift-wrapping', GiftWrapping);

class GiftNote extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('change', debounce((event) => {
      const body = JSON.stringify({ attributes: { 'gift-note': event.target.value } });
      fetch(`${window.routes.cart_update_url}`, {...fetchConfig(), ...{ body }});
    }, 300));
  }
}
customElements.define('gift-note', GiftNote);
