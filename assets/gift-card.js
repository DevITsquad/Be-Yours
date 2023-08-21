(function() {
  document.addEventListener('DOMContentLoaded', function() {
    new QRCode( document.querySelector('.gift-card__qr-code'), {
      text: document.querySelector('.gift-card__qr-code').dataset.identifier,
      width: 120,
      height: 120,
      imageAltText: qrStrings.imageAlt
    });
  });
  
  const template = document.getElementsByTagName("template")[0];
  const clonedTemplate = template.content.cloneNode(true);
  
  let isMessageDisplayed = false;
  document
  .querySelector('.gift-card__copy-link')
  .addEventListener('click', () => {
    navigator.clipboard.writeText(document.querySelector('.gift-card__number').value).then(function () {
      if (!isMessageDisplayed) {
        document.querySelector('.gift-card__copy-success').appendChild(clonedTemplate);
        isMessageDisplayed = true;
      }
    });
  });
})();
