class InfiniteScroll extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', this.onClickHandler.bind(this));

    if (this.dataset.trigger == 'infinite') {
      new IntersectionObserver(this.handleIntersection.bind(this), {rootMargin: '0px 0px 200px 0px'}).observe(this);
    }
  }

  onClickHandler() {
    if (this.classList.contains('loading') || this.classList.contains('disabled')) return;
    this.classList.add('loading');
    this.classList.add('disabled');

    const sections = InfiniteScroll.getSections();
    sections.forEach(() => {
      const url = this.dataset.url;
      InfiniteScroll.renderSectionFromFetch(url);
    });
  }

  handleIntersection(entries, observer) {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(this);

    this.onClickHandler();
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      }
    ]
  }

  static renderSectionFromFetch(url) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        InfiniteScroll.renderPagination(html);
        InfiniteScroll.renderProductGridContainer(html);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  static renderPagination(html) {
    const container = document.getElementById('ProductGridContainer').querySelector('.pagination-wrapper');
    const pagination = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').querySelector('.pagination-wrapper');
    if (pagination) {
      container.innerHTML = pagination.innerHTML;
    }
    else {
      container.remove();
    }
  }

  static renderProductGridContainer(html) {
    const container = document.getElementById('product-grid');
    const products = new DOMParser().parseFromString(html, 'text/html').getElementById('product-grid');
    container.insertAdjacentHTML('beforeend', products.innerHTML);
  }
}
customElements.define('infinite-scroll', InfiniteScroll);
