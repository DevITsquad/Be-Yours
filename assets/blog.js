class BlogFilter extends HTMLElement {
  constructor() {
    super();

    const filter = document.querySelector('select');
    filter.addEventListener('change', function() {
      window.location.href = filter.value;
    });
  }
}

customElements.define('blog-filter', BlogFilter);
