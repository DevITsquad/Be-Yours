class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();

    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);
    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    }
    window.addEventListener('popstate', onHistoryChange);
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const facetDrawer = document.getElementById('FacetDrawer');
    const countContainer = document.getElementById('ProductCount');
    const countContainerMobile = document.getElementById('ProductCountMobile');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer){
      countContainer.classList.add('loading');
    }   
    if (countContainerMobile){
      countContainerMobile.classList.add('loading');
    } 
    if (countContainerDesktop){
      countContainerDesktop.classList.add('loading');
    }
    if (facetDrawer){
      facetDrawer.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl) ?
        FacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
        FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
    
    document.dispatchEvent(new CustomEvent('collection:reloaded'));
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
      })
      .catch((e) => {
        console.error(e);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').innerHTML;
    
    const layoutSwitcher = document.querySelector('#FacetSortFiltersForm layout-switcher');
    if (layoutSwitcher) layoutSwitcher.onButtonClick(layoutSwitcher.querySelector('.list-view__item--active'));
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML
    const container = document.getElementById('ProductCount');
    const containerMobile = document.getElementById('ProductCountMobile');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    if (container) {
      container.innerHTML = count;
      container.classList.remove('loading');
    }
    if (containerMobile) {
      containerMobile.innerHTML = count;
      containerMobile.classList.remove('loading');
    }
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#FacetSortFiltersForm .js-filter, #FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter');
    const matchesIndex = (element) => { 
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false; 
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));

    const facetDrawer = document.getElementById('FacetDrawer');
    if (facetDrawer) {
      facetDrawer.classList.remove('loading');
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.facets__open', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('facet-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetElement = target.querySelector('.facets__selected');
    const sourceElement = source.querySelector('.facets__selected');

    if (sourceElement && targetElement) {
      target.querySelector('.facets__selected').outerHTML = source.querySelector('.facets__selected').outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      }
    ]
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData);
  }

  mergeSearchParams(form, searchParams) {
    const params = this.createSearchParams(form);
    params.forEach((value, key) => {
      searchParams.append(key, value);
    });
    return searchParams;
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();

    const currentForm = event.target.closest('form');
    if (currentForm.id === 'FacetFiltersFormMobile') {
      const searchParams = this.createSearchParams(currentForm);
      this.onSubmitForm(searchParams.toString(), event);
    }
    else {
      let searchParams = new URLSearchParams();

      if (currentForm.id === 'FacetSortFiltersForm' && currentForm.dataset.filterType === 'drawer') {
        const mobileForm = document.getElementById('FacetFiltersFormMobile');
        searchParams = this.mergeSearchParams(mobileForm, searchParams);
        searchParams.delete('sort_by');
      }
  
      const sortFilterForms = document.querySelectorAll('facet-filters-form form');
      sortFilterForms.forEach((form) => {
        if (form.id === 'FacetFiltersForm' || form.id === 'FacetSortFiltersForm') {
          searchParams = this.mergeSearchParams(form, searchParams);
        }
      });

      this.onSubmitForm(searchParams.toString(), event);
    }
    /*
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData).toString();
    FacetFiltersForm.renderPage(searchParams, event);
    */
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.renderPage(new URL(event.currentTarget.href).searchParams.toString());
  }
}
FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class FacetRemove extends HTMLElement {
  constructor() {
    super();

    this.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
      form.onActiveFilterClick(event);
    });
  }
}
customElements.define('facet-remove', FacetRemove);

class PriceRange extends HTMLElement {
	constructor() {
    super();

    this.min = Number(this.dataset.min);
		this.max = Number(this.dataset.max);
    this.track = this.querySelector(".price-range__track");
		this.handles = [...this.querySelectorAll(".price-range__thumbs")];
		this.startPos = 0;
		this.activeHandle;
		
		this.handles.forEach(handle => {
			handle.addEventListener("mousedown", this.startMove.bind(this));
		})
		
		window.addEventListener("mouseup", this.stopMove.bind(this));

    this.querySelectorAll('input').forEach(
      element => element.addEventListener('change', this.onRangeChange.bind(this))
    );
	}

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }
	
	startMove(e) {
		this.startPos = e.offsetX;
		this.activeHandle = e.target;
		this.moveListener = this.move.bind(this);
		window.addEventListener("mousemove", this.moveListener);
	}
	
	move(e) {
		const isLower = this.activeHandle.classList.contains("is-lower");
		const property = isLower ? "--progress-lower" : "--progress-upper";
		const parentRect = this.track.getBoundingClientRect();
		const handleRect = this.activeHandle.getBoundingClientRect();
		let newX = e.clientX - parentRect.x - this.startPos;
		
    if (isLower) {
			const otherX = parseInt(this.style.getPropertyValue("--progress-upper"));
      const percentageX = otherX * parentRect.width / 100;
			newX = Math.min(newX, percentageX - handleRect.width);
			newX = Math.max(newX, 0 - handleRect.width/2);
		}
    else {
			const otherX = parseInt(this.style.getPropertyValue("--progress-lower"));
      const percentageX = otherX * parentRect.width / 100;
			newX = Math.max(newX, percentageX);
			newX = Math.min(newX, parentRect.width - handleRect.width/2);
		}

    const percentage = (newX + handleRect.width/2) / parentRect.width;
    const valuenow = this.calcHandleValue(percentage);
    this.style.setProperty(property, percentage * 100 + "%");
		this.activeHandle.ariaValueNow = valuenow;

    const output = this.activeHandle.nextElementSibling;
    const text = output.querySelector('.price-range__output-text');
    text.innerHTML = valuenow;

    const inputs = this.querySelectorAll('input');
    const input = isLower ? inputs[0] : inputs[1];
    input.value = valuenow;
    
    this.adjustToValidValues(input);
    this.setMinAndMaxValues();
	}
	
	calcHandleValue(percentage) {
		return Math.round(percentage * (this.max - this.min) + this.min);
	}
	
	stopMove() {
		window.removeEventListener("mousemove", this.moveListener);
    const form = this.closest('form');
    
    if (this.activeHandle && form) form.dispatchEvent(new Event('input'));
	}

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}
customElements.define('price-range', PriceRange);

class LayoutSwitcher extends HTMLElement {
	constructor() {
    super();

    this.cookieName = 'beyours:collection-layout';

    this.initLayoutMode();
    this.querySelectorAll('.list-view__item').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
	}
	
  onButtonClick(event) {
    const target = event.target ? event.target : event;
    this.changeLayoutMode(target, target.dataset.layoutMode);
  }

  initLayoutMode() {
    if (isStorageSupported('local')) {
      const layoutMode = window.localStorage.getItem(this.cookieName);

      if (layoutMode !== null) {
        const target = this.querySelector(`.list-view__item[data-layout-mode="${layoutMode}"]`);

        if (target) {
          this.changeLayoutMode(target, layoutMode);
        }
      }
    }
  }

  changeLayoutMode(target, layoutMode) {
    const productGrid = document.getElementById('product-grid');

    if (productGrid.classList.contains('collection--empty')) {
      return;
    }

    const removedClass = ['list', 'grid', 'grid--1-col', 'grid--2-col', 'grid--3-col-tablet', 'grid--2-col-desktop', 'grid--3-col-desktop', 'grid--4-col-desktop'];
    removedClass.forEach((removed) => {
      productGrid.classList.remove(removed);
    });

    let addedClass = [];
    switch (layoutMode) {
      case 'list':
        addedClass = ['grid', 'grid--1-col', 'grid--2-col-desktop', 'list'];
        break;

      case 'grid-2':
        addedClass = ['grid', 'grid--2-col'];
        break;

      case 'grid-3':
        addedClass = ['grid', 'grid--2-col', 'grid--3-col-tablet', 'grid--3-col-desktop'];
        break;

      case 'grid-4':
        addedClass = ['grid', 'grid--2-col', 'grid--3-col-tablet', 'grid--4-col-desktop'];
        break;
    }
    addedClass.forEach((added) => {
      productGrid.classList.add(added);
    });

    this.querySelectorAll('.list-view__item').forEach(
      (button) => button.classList.remove('list-view__item--active')
    );

    target.classList.add('list-view__item--active');

    if (isStorageSupported('local')) {
      window.localStorage.setItem(this.cookieName, layoutMode);
    }
  }
}
customElements.define('layout-switcher', LayoutSwitcher);

class StickyFacetFilters extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.onScrollHandler = this.onScroll.bind(this);

    window.addEventListener('scroll', this.onScrollHandler, false);
    this.onScrollHandler();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScrollHandler);
  }

  onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > this.parentNode.offsetTop) {
      window.requestAnimationFrame(this.reveal.bind(this));
    } else {
      window.requestAnimationFrame(this.reset.bind(this));
    }
  }

  reveal() {
    this.classList.add('shopify-section-filters-sticky');
  }

  reset() {
    this.classList.remove('shopify-section-filters-sticky');
  }
}
customElements.define('sticky-facet-filters', StickyFacetFilters);

class ShowMoreButton extends HTMLElement {
  constructor() {
    super();

    const attributes = {
      expanded: 'aria-expanded'
    };

    const button = this.querySelector('.button-show-more');
    button.addEventListener('click', () => {
      const filter = this.closest('.js-filter');
      filter.setAttribute(
        attributes.expanded,
        (filter.getAttribute(attributes.expanded) === 'false').toString()
      );

      this.querySelectorAll('.visually-hidden').forEach(element => element.classList.toggle('hidden'));
    });
  }
}
customElements.define('show-more-button', ShowMoreButton);
