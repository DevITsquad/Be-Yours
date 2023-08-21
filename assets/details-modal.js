class DetailsModal extends HTMLElement {
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

    this.summaryToggle.setAttribute('role', 'button');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open')
      ? this.close()
      : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open() {
    setScrollbarWidth();
    setTimeout(() => {
      this.detailsContainer.classList.add('modal-opening');
    });

    this.detailsContainer.setAttribute('open', '');
    this.onBodyClickEvent =
      this.onBodyClickEvent || this.onBodyClick.bind(this);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('details-modal--open');

    this.openAnimation();
  }

  openAnimation() {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      }
      else {
        trapFocus(
          this.detailsContainer.querySelector('[tabindex="-1"]'),
          this.detailsContainer.querySelector('input:not([type="hidden"])')
        );
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.classList.remove('modal-opening');
    document.body.removeEventListener('click', this.onBodyClickEvent);
    document.body.classList.remove('details-modal--open');
    document.body.classList.add('details-modal--closing');

    this.closeAnimation();
  }

  closeAnimation() {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      }
      else {
        this.detailsContainer.removeAttribute('open');
        document.body.classList.remove('details-modal--closing');
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}
customElements.define('details-modal', DetailsModal);
