let observer = null;

function wrapRatingsSectionWithSpoiler() {
  if (observer) observer.disconnect();

  function wrapSectionWithSpoiler(section, spoilerText) {
    if (!section || section.dataset.processed) return;
    section.dataset.processed = "true";

    const heading = section.querySelector('h2');

    const spoilerContainer = document.createElement('div');
    spoilerContainer.className = 'js-spoiler-container';

    const hasSpoilers = document.createElement('div');
    hasSpoilers.className = 'has-spoilers';
    hasSpoilers.innerHTML = `
      <span class="icon" role="presentation"></span>
      <div class="disclaimer">
        ${spoilerText} 
        <a href="#" class="trigger">I can handle the truth.</a>
      </div>
    `;

    spoilerContainer.appendChild(hasSpoilers);

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'ratings-real-content spoiler-real-content';

    if (heading) heading.remove();

    while (section.firstChild) {
      contentWrapper.appendChild(section.firstChild);
    }

    if (heading) section.appendChild(heading);
    section.appendChild(spoilerContainer);
    section.appendChild(contentWrapper);

    contentWrapper.style.visibility = 'hidden';
    contentWrapper.style.height = '0';
    contentWrapper.style.overflow = 'hidden';
    contentWrapper.style.transition = 'height 0.3s ease, visibility 0.3s ease';

    const trigger = hasSpoilers.querySelector('.trigger');
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      spoilerContainer.remove();
      contentWrapper.style.visibility = 'visible';
      contentWrapper.style.height = 'auto';
      contentWrapper.style.overflow = 'visible';
    });
  }

  function process() {
    const isProfilePage = /^https:\/\/letterboxd\.com\/[^\/]+\/?$/.test(window.location.href);

    if (!isProfilePage) {
      document.querySelectorAll('section.ratings-histogram-chart').forEach(section => {
        wrapSectionWithSpoiler(section, 'Hiding ratings.');
      });
    }

    wrapSectionWithSpoiler(document.querySelector('#popular-reviews'), 'Hiding popular reviews.');

    const sections = document.querySelectorAll('section.section');
    sections.forEach(section => {
      const heading = section.querySelector('h2');
      if (!heading) return;
      const headingText = heading.textContent.trim();
      if (['Recent reviews', 'Popular reviews', 'Reviews from friends'].includes(headingText)) {
        wrapSectionWithSpoiler(section, 'Hiding reviews.');
      }
    });

    if (isProfilePage) {
      const ratingSpans = document.querySelectorAll('p.poster-viewingdata span.rating[class*="rated-"]');
      ratingSpans.forEach(span => span.style.display = 'none');
    }

    const friendsSection = document.querySelector('#recent-from-friends');
    if (friendsSection && !friendsSection.dataset.ratingsHidden) {
      friendsSection.dataset.ratingsHidden = "true";
      friendsSection.querySelectorAll('span.rating').forEach(span => span.style.display = 'none');
    }

    document.querySelectorAll('section.activity-from-friends').forEach(section => {
      if (!section.dataset.ratingsHidden) {
        section.dataset.ratingsHidden = "true";
        section.querySelectorAll('span.rating').forEach(span => span.style.display = 'none');
      }
    });

    // Mover .tomato-ratings y .meta-ratings al final del section.col-10.col-main
    const mainSection = document.querySelector('section.section.col-10.col-main');
    if (mainSection) {
      ['tomato-ratings', 'meta-ratings'].forEach(cls => {
        const el = document.querySelector(`.${cls}`);
        if (el && !mainSection.contains(el)) {
          mainSection.appendChild(el);
        }
      });
    }
  }

  process();

  observer = new MutationObserver(process);
  observer.observe(document.body, { childList: true, subtree: true });
}

function enhanceRuntimeDisplay() {
  document.querySelectorAll('.text-footer-extra.duration-extra').forEach(el => {
    if (el.dataset.runtimeEnhanced) return;

    const match = el.textContent.match(/(\d+)\s*mins/);
    if (!match) return;

    const minutes = parseInt(match[1], 10);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const formatted = `${hours > 0 ? `${hours}h ` : ''}${mins}mins`;

    el.textContent = el.textContent.replace(/(\d+\s*mins)/, `$1 / ${formatted}`);
    el.dataset.runtimeEnhanced = "true";
  });
}

function addShuffleButton() {
  const url = window.location.href;
  const pattern = /^https:\/\/letterboxd\.com\/[^\/]+\/(list\/[^\/]+|watchlist)(\/)?(by\/shuffle\/?)?$/;
  if (!pattern.test(url)) return;

  const insertButton = () => {
    const actionsPanel = document.querySelector('section.actions-panel ul');
    if (!actionsPanel) return false;

    if (document.querySelector('a.letterboxd-enhancer-shuffle')) return true;

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = "#";
    a.textContent = 'Shuffle';
    a.classList.add('letterboxd-enhancer-shuffle');
    li.appendChild(a);
    actionsPanel.insertBefore(li, actionsPanel.firstChild);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      const baseUrl = url.replace(/\/by\/shuffle\/?$/, '').replace(/\/$/, '');
      window.location.href = `${baseUrl}/by/shuffle/`;
    });

    return true;
  };

  if (insertButton()) return;

  const observer = new MutationObserver(() => {
    if (insertButton()) observer.disconnect();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Leer opciones y aplicar
chrome.storage.local.get(['runtimeDisplay', 'hideReviews', 'shuffleButton'], (options) => {
  const runtimeDisplay = options.runtimeDisplay ?? true;
  const hideReviews = options.hideReviews ?? true;
  const shuffleButton = options.shuffleButton ?? true;

  if (hideReviews) wrapRatingsSectionWithSpoiler();
  if (runtimeDisplay) enhanceRuntimeDisplay();
  if (shuffleButton) addShuffleButton();
});
