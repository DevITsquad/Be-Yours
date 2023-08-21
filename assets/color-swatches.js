class ColorSwatch extends HTMLElement {
  constructor() {
    super();

    this.cached = {};
    this.variantId = this.dataset.variantId;
    this.container = this.closest('.card-wrapper');
    
    if (this.variantId || theme.config.mqlSmall) {
      this.addEventListener('mouseenter', this.onHoverHandler.bind(this));
      this.querySelector('a').addEventListener('click', (event) => event.preventDefault());
    }
    else {
      this.addEventListener('mouseenter', this.onHoverHandler.bind(this));
    }
  }

  onHoverHandler() {
    if (this.variantId) {
      theme.config.mqlSmall ? this.colorSwatchChange() : this.colorSwatchFetch();
    }
    else {
      this.colorSwatchChange();
    }
  }

  colorSwatchChange(forceUpdate) {
    const image = this.container.querySelector('.media img');

    if (image !== null || forceUpdate) {
      if (image !== null) {
        image.src = this.dataset.src;
        image.srcset = this.dataset.srcset;
      }

      const swatches = this.container.querySelectorAll('.color-swatch');
      swatches.forEach((swatch) => {
        swatch.classList.remove('is-active');
      });
  
      this.classList.add('is-active');
    }
  }

  colorSwatchFetch() {
    const productHandle = this.dataset.productHandle;
    const collectionHandle = this.dataset.collectionHandle;
    let sectionUrl = `${window.routes.root_url}/products/${productHandle}?variant=${this.variantId}&view=card`;

    if (collectionHandle.length > 0) {
      sectionUrl = `${window.routes.root_url}/collections/${collectionHandle}/products/${productHandle}?variant=${this.variantId}&view=card`;
    }

    // remove double `/` in case shop might have /en or language in URL
    sectionUrl = sectionUrl.replace('//', '/');

    if (this.cached[sectionUrl]) {
      this.renderProductInfo(this.cached[sectionUrl]);
      return;
    }

    fetch(sectionUrl)
      .then(response => response.text())
      .then(responseText => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        this.cached[sectionUrl] = html;
        this.renderProductInfo(html);
      })
      .catch(e => {
        console.error(e);
      });
  }

  renderProductInfo(html) {
    this.updateButtons(html);
    this.updateTitle(html);
    this.updatePrice(html);

    this.colorSwatchChange(true);
  }

  updateTitle(html) {
    const selector = '.card-information__text';
    const destination = this.container.querySelector(selector);
    const source = html.querySelector(selector);

    if (source && destination) destination.innerHTML = source.innerHTML + '<small>&ndash;&nbsp;' + this.getAttribute('title') + '</small>';
  }

  updatePrice(html) {
    if (html.querySelector('color-swatch-radios')) return;
    
    const selector = '.price';
    const destination = this.container.querySelector(selector);
    const source = html.querySelector(selector);

    if (source && destination) destination.innerHTML = source.innerHTML;
  }

  updateButtons(html) {
    const selector = '.card-information__button';
    const destination = this.container.querySelector(selector);
    const source = html.querySelector(selector);

    if (source && destination) destination.innerHTML = source.innerHTML;

    destination.classList.remove('is-expanded');
    if (source.classList.contains('is-expanded')) destination.classList.add('is-expanded');
  }
}
customElements.define('color-swatch', ColorSwatch);

class ColorSwatchRadios extends HTMLElement {
  constructor() {
    super();

    this.classes = {
      soldOut: 'price--sold-out',
      onSale: 'price--on-sale',
      noCompare: 'price--no-compare',
      hidden: 'hidden',
      loading: 'loading'
    };
    this.selectors = {
      cardWrapper: '.card-wrapper',
      priceWrapper: '.price',
      price: '.price__regular .price-item--regular',
      comparePrice: '.price__sale .price-item--regular',
      salePrice: '.price__sale .price-item--sale',
      unitWrapper: '.unit-price',
      unitPrice: '[data-unit-price]',
      unitPriceBaseUnit: '[data-unit-base]'
    };

    this.miniCart = document.querySelector('mini-cart');

    this.init();
    this.addEventListener('change', this.onVariantChange);

    const buttons = this.querySelectorAll('.swatch:not(.disabled)');
    buttons.forEach((button) => button.addEventListener('mouseenter', this.onEnterHandler.bind(this)));
    buttons.forEach((button) => button.addEventListener('mouseleave', this.onLeaveHandler.bind(this)));

    const inputs = this.querySelectorAll('.swatch:not(.disabled) input');
    inputs.forEach((input) => input.addEventListener('click', this.onClickHandler.bind(this)));
  }

  cacheElements() {
    this.container = this.closest(this.selectors.cardWrapper);
    this.cache = {
      priceWrapper: this.container.querySelector(this.selectors.priceWrapper),
      price: this.container.querySelector(this.selectors.price),
      comparePrice: this.container.querySelector(this.selectors.comparePrice),
      salePrice: this.container.querySelector(this.selectors.salePrice),
      priceHTML: this.container.querySelector(this.selectors.priceWrapper).cloneNode(true).innerHTML,
      priceClass: this.container.querySelector(this.selectors.priceWrapper).cloneNode(true).getAttribute('class'),
    };
  }

  onClickHandler(event) {
    const input = event.currentTarget;
    const button = input.parentNode;
    const variantId = this.currentVariant.id;

    if (variantId) {
      if (document.body.classList.contains('template-cart') || !window.shopSettings.cartDrawer) {
        Shopify.postLink(window.routes.cart_add_url, {
          parameters: {
            id: variantId,
            quantity: 1
          },
        });
        return;
      }

      input.setAttribute('disabled', '');
      button.classList.add(this.classes.loading);
      const sections = this.miniCart ? this.miniCart.getSectionsToRender().map((section) => section.id) : [];

      const body = JSON.stringify({
        id: variantId,
        quantity: 1,
        sections: sections,
        sections_url: window.location.pathname
      });

      fetch(`${window.routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
        .then((response) => response.json())
        .then((parsedState) => {
          this.miniCart && this.miniCart.renderContents(parsedState);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          input.removeAttribute('disabled');
          button.classList.remove(this.classes.loading);
        });
    }
  }

  onEnterHandler(event) {
    const target = event.currentTarget;
    const input = target.querySelector('input');
    input.checked = true;
    this.dispatchEvent(new Event('change'));

    setTimeout(() => {
      this.cacheElements();
      this.updatePrice();
      this.updateUnitPrice();
    });
  }

  onLeaveHandler() {
    this.cache.priceWrapper.innerHTML = this.cache.priceHTML;
    this.cache.priceWrapper.setAttribute('class', this.cache.priceClass);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
  }

  init() {
    this.updateOptions();
    this.updateMasterId();
    this.setAvailability();
  }

  updatePrice() {
    const variant = this.currentVariant;
  
    if (variant) {
      // Remove classes
      this.cache.priceWrapper.classList.remove(this.classes.soldOut);
      this.cache.priceWrapper.classList.remove(this.classes.onSale);
      this.cache.priceWrapper.classList.remove(this.classes.noCompare);

      if (variant.available == false) {
        this.cache.priceWrapper.classList.add(this.classes.soldOut);
      }
      else if (variant.compare_at_price > variant.price) {
        this.cache.priceWrapper.classList.add(this.classes.onSale);
      }

      // Regular price
      this.cache.price.innerHTML = '<price-money><bdi>' + theme.Currency.formatMoney(variant.price, window.shopSettings.moneyFormat) + '</bdi></price-money>';

      // Sale price, if necessary
      if (variant.compare_at_price > variant.price) {
        this.cache.comparePrice.innerHTML = '<price-money><bdi>' + theme.Currency.formatMoney(variant.compare_at_price, window.shopSettings.moneyFormat) + '</bdi></price-money>';
        this.cache.salePrice.innerHTML = '<price-money><bdi>' + theme.Currency.formatMoney(variant.price, window.shopSettings.moneyFormat) + '</bdi></price-money>';
      }
      else {
        
      }
    }
  }

  updateUnitPrice() {
    const variant = this.currentVariant;
  
    if (this.container.querySelector(this.selectors.unitWrapper)) {
      if (variant && variant.unit_price) {
        this.container.querySelector(this.selectors.unitPrice).innerHTML = '<price-money><bdi>' + theme.Currency.formatMoney(variant.unit_price, window.shopSettings.moneyFormat) + '</bdi></price-money>';
        this.container.querySelector(this.selectors.unitPriceBaseUnit).innerHTML = theme.Currency.getBaseUnit(variant);
        this.container.querySelector(this.selectors.unitWrapper).classList.remove(this.classes.hidden);
      }
      else {
        this.container.querySelector(this.selectors.unitWrapper).classList.add(this.classes.hidden);
      }
    }
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData()?.find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  setAvailability() {
    if (!this.currentVariant) return;

    this.querySelectorAll('.variant-input-wrapper').forEach(group => {
      this.disableVariantGroup(group);
    });

    const currentlySelectedValues = this.currentVariant.options.map((value,index) => {return {value, index: `option${index+1}`}})
    const initialOptions = this.createAvailableOptionsTree(this.variantData, currentlySelectedValues, this.currentVariant);

    for (var [option, values] of Object.entries(initialOptions)) {
      this.manageOptionState(option, values);
    }
  }

  enableVariantOption(group, obj) {
    const value = obj.value.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');
    const input = group.querySelector('input[data-option-value="'+ value +'"]');

    if (!input) return;

    // Variant exists - enable & show variant
    input.removeAttribute('disabled');
    input.parentNode.classList.remove('disabled');

    // Variant sold out - cross out option (remains selectable)
    if (obj.soldOut) {
      input.setAttribute('disabled', '');
      input.parentNode.classList.add('disabled');
    }
  }

  disableVariantGroup(group) {
    group.querySelectorAll('input').forEach((input) => {
      input.setAttribute('disabled', '');
      input.parentNode.classList.add('disabled');
    });
  }

  manageOptionState(option, values) {
    const group = this.querySelector('.variant-input-wrapper[data-option-index="'+ option +'"]');

    // Loop through each option value
    values.forEach(obj => {
      this.enableVariantOption(group, obj);
    });
  }

  createAvailableOptionsTree(variants, currentlySelectedValues) {
    // Reduce variant array into option availability tree
    return variants.reduce((options, variant) => {

      // Check each option group (e.g. option1, option2, option3) of the variant
      Object.keys(options).forEach(index => {

        if (variant[index] === null) return;

        let entry = options[index].find(option => option.value === variant[index]);

        if (typeof entry === 'undefined') {
          // If option has yet to be added to the options tree, add it
          entry = {value: variant[index], soldOut: true}
          options[index].push(entry);
        }

        const currentOption1 = currentlySelectedValues.find(({value, index}) => index === 'option1')
        const currentOption2 = currentlySelectedValues.find(({value, index}) => index === 'option2')

        switch (index) {
          case 'option1':
            // Option1 inputs should always remain enabled based on all available variants
            entry.soldOut = entry.soldOut && variant.available ? false : entry.soldOut;
            break;
          case 'option2':
            // Option2 inputs should remain enabled based on available variants that match first option group
            if (currentOption1 && variant['option1'] === currentOption1.value) {
              entry.soldOut = entry.soldOut && variant.available ? false : entry.soldOut;
            }
          case 'option3':
            // Option 3 inputs should remain enabled based on available variants that match first and second option group
            if (
              currentOption1 && variant['option1'] === currentOption1.value
              && currentOption2 && variant['option2'] === currentOption2.value
            ) {
              entry.soldOut = entry.soldOut && variant.available ? false : entry.soldOut;
            }
        }
      })

      return options;
    }, { option1: [], option2: [], option3: []})
  }
}
customElements.define('color-swatch-radios', ColorSwatchRadios);
