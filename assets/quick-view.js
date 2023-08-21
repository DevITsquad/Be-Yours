class QuickViewDrawer extends MenuDrawer {
  constructor() {
    super();

    this.setClasses({
      open: 'quick-view--open',
      opening: 'quick-view--opening',
      closing: 'quick-view--closing'
    });

    this.addEventListener('close', () => {
      const drawerContent = this.querySelector('.quick-view__content');
      drawerContent.innerHTML = '';
      drawerContent.classList.remove('hide-cover');

      document.dispatchEvent(new CustomEvent('quickview:close'));
    });
  }
}
customElements.define('quick-view-drawer', QuickViewDrawer);

class QuickViewButton extends MenuDrawer {
  constructor() {
    super();

    this.addEventListener('click', () => {
      const wrapper = this.closest('.card-wrapper');
      const drawer = wrapper.querySelector('quick-view-drawer');
      if (drawer) {
        drawer.querySelector('summary').click();

        document.dispatchEvent(new CustomEvent('quickview:open', {
          detail: {
            productUrl: this.dataset.productUrl
          }
        }));
      }
      else if (this.dataset.productUrl) {
        window.location.href = this.dataset.productUrl;
      }
    });
  }
}
customElements.define('quick-view-button', QuickViewButton);

class QuickView extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    new IntersectionObserver(this.handleIntersection.bind(this)).observe(this);
  }

  handleIntersection(entries, _observer) {
    if (!entries[0].isIntersecting) return;

    const selector = '.quick-view__content';
    const drawerContent = this.querySelector(selector);
    const productUrl = this.dataset.productUrl.split('?')[0];
    const sectionUrl = `${productUrl}?view=modal`;

    fetch(sectionUrl)
      .then(response => response.text())
      .then(responseText => {
        setTimeout(() => {
          const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
          const productElement = responseHTML.querySelector(selector);
          this.setInnerHTML(drawerContent, productElement.innerHTML);

          if (window.Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }
        }, 200);

        setTimeout(() => {
          drawerContent.classList.add('hide-cover');

          document.dispatchEvent(new CustomEvent('quickview:loaded', {
            detail: {
              productUrl: this.dataset.productUrl
            }
          }));
        }, 500);
      })
      .catch(e => {
        console.error(e);
      });
  }

  setInnerHTML(element, html) {
    element.innerHTML = html;

    // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
    element.querySelectorAll('script').forEach(oldScriptTag => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach(attribute => {
        newScriptTag.setAttribute(attribute.name, attribute.value)
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}
customElements.define('quick-view', QuickView);
