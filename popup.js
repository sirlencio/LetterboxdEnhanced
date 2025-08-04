// Carga opciones guardadas y actualiza checkboxes
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['runtimeDisplay', 'hideReviews', 'shuffleButton'], (res) => {
    document.getElementById('cb-runtime').checked = res.runtimeDisplay ?? true;
    document.getElementById('cb-hideReviews').checked = res.hideReviews ?? true;
    document.getElementById('cb-shuffle').checked = res.shuffleButton ?? true;
  });

  // Guardar opciones al cambiar checkbox
  ['cb-runtime', 'cb-hideReviews', 'cb-shuffle'].forEach(id => {
    const cb = document.getElementById(id);
    cb.addEventListener('change', () => {
      const options = {
        runtimeDisplay: document.getElementById('cb-runtime').checked,
        hideReviews: document.getElementById('cb-hideReviews').checked,
        shuffleButton: document.getElementById('cb-shuffle').checked,
      };
      chrome.storage.local.set(options);
    });
  });
});

document.getElementById('btn-reload').addEventListener('click', () => {
  chrome.tabs.reload();
});
