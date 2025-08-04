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
      wrapSectionWithSpoiler(
        document.querySelector('section.ratings-histogram-chart'),
        'Hiding ratings.'
      );
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
  }

  // Procesar contenido inicialmente
  process();

  // Observar cambios que añadan nuevo contenido relevante
  observer = new MutationObserver(process);
  observer.observe(document.body, { childList: true, subtree: true });
}

// Otras funciones igual, solo llamadas explícitas sin observer adentro
function enhanceRuntimeDisplay() {
  document.querySelectorAll('p.text-link.text-footer').forEach(p => {
    if (p.dataset.runtimeEnhanced) return;
    const match = p.textContent.match(/(\d+)\s*mins/);
    if (!match) return;

    const minutes = parseInt(match[1], 10);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const formatted = ` / ${hours > 0 ? `${hours}h ` : ''}${mins}mins`;

    const textNode = Array.from(p.childNodes).find(node =>
      node.nodeType === Node.TEXT_NODE && node.textContent.includes('mins')
    );

    if (textNode) {
      textNode.textContent = textNode.textContent.replace(/(\d+\s*mins)/, `$1${formatted}`);
      p.dataset.runtimeEnhanced = "true";
    }
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

  // Intenta insertar inmediatamente
  if (insertButton()) return;

  // Observa si aún no está el DOM cargado
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
