class SearchModal extends HTMLElement {
  constructor() {
    super();

    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener(
      'keyup',
      (event) => event.code && event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.summaryToggle.addEventListener(
      'click',
      this.onSummaryClick.bind(this)
    );
    this.querySelector('button[type="button"]').addEventListener(
      'click',
      this.close.bind(this)
    );
    this.querySelector('button[type="reset"]').addEventListener(
      'click',
      this.reset.bind(this)
    );

    this.summaryToggle.setAttribute('role', 'button');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open')
      ? this.close()
      : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close();
  }

  open() {
    setScrollbarWidth();
    setHeaderBottomPosition();
    
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
      
    this.detailsContainer.setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('search-modal--open');

    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close() {
    removeTrapFocus();
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('search-modal--open');
    document.dispatchEvent(new CustomEvent('searchmodal:close'));
  }

  reset(event) {
    event.preventDefault();
    this.querySelector('input[type="search"]').value = '';
  }
}

customElements.define('search-modal', SearchModal);
