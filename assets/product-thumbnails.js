if (!customElements.get('product-thumbnails')) {
  customElements.define('product-thumbnails', class ProductThumbnails extends HTMLElement {
    constructor() {
      super();

      this.mql = window.matchMedia('(min-width: 750px)');

      this.querySelectorAll('.product__thumbnail').forEach(
        (button) => button.addEventListener('click', this.onButtonClick.bind(this))
      );
      
      if (this.mql.matches) {
        this.handleScrollSpy();
        this.addEventListener('scrollspy:changed', this.onScrollTargetChanged.bind(this));
      }
    }

    onButtonClick(event) {
      const thumbnail = event.target;
      const newMedia = document.querySelector(
        `[data-media-id="${thumbnail.dataset.section}-${thumbnail.dataset.mediaId}"]`
      );

      if (!newMedia) return;

      this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
      if (this.stickyHeader) {
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }
      window.setTimeout(() => { newMedia.scrollIntoView({ behavior: "smooth" }); });

      // deferred-media
      const deferredMedia = newMedia.querySelector(`#Deferred-Poster-${thumbnail.dataset.mediaId}`);
      if (deferredMedia) {
        deferredMedia.click();
      }
    }

    handleScrollSpy() {
      const handleIntersection = (entries) => {
        const oldTargetIndex = this.indicesInViewPort[0] || 0;

        entries.forEach((entry) => {
          this.updateIndicesInViewPort(entry, oldTargetIndex);
        });

        this.indicesInViewPort = this.indicesInViewPort.filter(function (value, index, self) {
          return self.indexOf(value) === index;
        });

        if (this.indicesInViewPort.length === 0 || oldTargetIndex === this.indicesInViewPort[0]) {
          return;
        }

        const event = new CustomEvent('scrollspy:changed', {
          detail: {
            newTarget: this.targets[this.indicesInViewPort[0]],
            oldTarget: this.targets[oldTargetIndex]
          }
        });

        this.dispatchEvent(event);
      }

      const observer = new IntersectionObserver(handleIntersection.bind(this), {
        rootMargin: '-50px 0px'
      });

      this.targets = [];
      this.targetIndices = {};
      this.indicesInViewPort = [];

      const sections = document.querySelectorAll('[id^="Slider-Gallery"] .product__media-item');
      sections.forEach((section, index) => {
        this.targets.push(section);
        this.targetIndices[section.id] = index;
        observer.observe(section);
      });
    }

    updateIndicesInViewPort(entry, oldTargetIndex) {
      const index = this.targetIndices[entry.target.id];

      if (entry.intersectionRatio === 0) {
        const indexInViewPort = this.indicesInViewPort.indexOf(index);

        if (indexInViewPort !== -1) {
          this.indicesInViewPort.splice(indexInViewPort, 1);
        }
      }
      else {
        if (index < oldTargetIndex) {
          this.indicesInViewPort.unshift(index);
        }
        else if (index > this.indicesInViewPort[this.indicesInViewPort.length - 1]) {
          this.indicesInViewPort.push(index);
        }
        else {
          this.indicesInViewPort.push(index);
          this.indicesInViewPort.sort();
        }
      }
    }

    onScrollTargetChanged(event) {
      const thumbnails = this.querySelectorAll('.product__thumbnail');
      const thumbnailActive = this.querySelector('.product__thumbnail[data-thumbnail-position="' + event.detail.newTarget.getAttribute('data-media-position') + '"]');

      thumbnails.forEach(function (item) {
        return item.classList.remove('is-active');
      });
      thumbnailActive.classList.add('is-active');
    }
  });
}
