class PasswordModal extends DetailsModal {
  constructor() {
    super();

    if (this.querySelector('input[aria-invalid="true"]')) this.querySelector('summary').click();
  }
}
customElements.define('password-modal', PasswordModal);
