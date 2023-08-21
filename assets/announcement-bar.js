class AnnouncementBar extends HTMLElement {
  constructor() {
    super();

    this.config = {
      autorotate: this.dataset.autorotate === 'true',
      autorotateSpeed: parseInt(this.dataset.autorotateSpeed) * 1000,
      moveTime: parseFloat(this.dataset.speed), // 100px going to move for
      space: 100, // 100px
    };

    if (theme.config.mqlSmall) {
      this.initOnMobile();
    }
    else {
      this.initOnDesktop();
    }

    document.addEventListener('matchSmall', () => {
      this.unload();
      this.initOnMobile();
    });

    document.addEventListener('unmatchSmall', () => {
      this.unload();
      this.initOnDesktop();
    });
  }

  initOnDesktop() {
    switch(this.dataset.layout) {
      case 'carousel':
        this.initCarousel();
        break;

      case 'marquee':
        this.initMarquee();
        break;

      default:
        this.initMarqueeOptimized();
    }
  }

  initOnMobile() {
    switch(this.dataset.mobileLayout) {
      case 'carousel':
        this.initCarousel();
        break;

      case 'marquee':
        this.initMarquee();
        break;
    }
  }

  unload() {
    if (this.flickity && typeof this.flickity.destroy === 'function') {
      this.flickity.destroy();
      this.removeNextPrevListeners();
    }

    if (this.classList.contains('marquee')) {
      this.classList.remove('marquee');
      this.querySelectorAll('.announcement-slider[aria-hidden]').forEach((slider) => {
        slider.remove();
      });
    }

    if (this.observer && typeof this.observer.unobserve === 'function') {
      this.observer.unobserve(this);
    }
  }

  initCarousel() {
    if (this.dataset.blockCount == 1) {
      return;
    }

    const slider = this.querySelector('.announcement-slider');
    setTimeout(() => {
      this.flickity = new Flickity(slider, {
        accessibility: false,
        rightToLeft: theme.config.rtl,
        prevNextButtons: false,
        pageDots: false,
        wrapAround: true,
        setGallerySize: false,
        autoPlay: this.config.autorotate ? this.config.autorotateSpeed : false,
      });
    });

    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    this.onNextPrevClick = this.handleNextPrevClick.bind(this);
    this.prevButton && this.prevButton.addEventListener('click', this.onNextPrevClick);
    this.nextButton && this.nextButton.addEventListener('click', this.onNextPrevClick);
  }

  removeNextPrevListeners() {
    this.prevButton && this.prevButton.removeEventListener('click', this.onNextPrevClick);
    this.nextButton && this.nextButton.removeEventListener('click', this.onNextPrevClick);
  }

  handleNextPrevClick(event) {
    event.preventDefault();
    const target = event.currentTarget;
    
    if (target.name === 'next') {
      this.flickity && this.flickity.next();
    }
    else if (target.name === 'previous') {
      this.flickity && this.flickity.previous();
    }
  }

  initMarqueeOptimized() {
    setTimeout(() => {
      this.marqueeAnimation();
    });

    // pause when out of view
    this.observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isAnimated && this.classList.remove('marquee--paused');
        }
        else {
          this.isAnimated && this.classList.add('marquee--paused');
        }
      });
    }, {rootMargin: '0px 0px 50px 0px'});

    this.observer.observe(this);

    window.addEventListener('resize', this.marqueeAnimation.bind(this));
  }

  marqueeAnimation() {
    const slider = this.querySelector('.announcement-slider');

    if (slider.scrollWidth > this.clientWidth) {
      if (!this.isAnimated) {
        for (let index = 0; index < 2; index++) {
          const clone = slider.cloneNode(true);
          clone.setAttribute('aria-hidden', true);
          this.appendChild(clone);
        }
        
        this.classList.add('marquee');
        this.style.setProperty('--duration', `${(slider.scrollWidth / this.config.space) * this.config.moveTime}s`);
        this.isAnimated = true;
      }
    }
    else if (this.isAnimated) {
      for (let index = 0; index < 2; index++) {
        this.removeChild(this.lastElementChild);
      }
      this.classList.remove('marquee');
      this.isAnimated = false;
    }
  }

  initMarquee() {
    setTimeout(() => {
      const slider = this.querySelector('.announcement-slider');

      for (let index = 0; index < 10; index++) {
        const clone = slider.cloneNode(true);
        clone.setAttribute('aria-hidden', true);
        this.appendChild(clone);
      }
  
      this.classList.add('marquee');
      this.style.setProperty('--duration', `${(slider.clientWidth / this.config.space) * this.config.moveTime}s`);
    });

    // pause when out of view
    this.observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.classList.remove('marquee--paused');
        }
        else {
          this.classList.add('marquee--paused');
        }
      });
    }, {rootMargin: '0px 0px 50px 0px'});

    this.observer.observe(this);
  }
}
customElements.define('announcement-bar', AnnouncementBar);
