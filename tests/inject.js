() => {
  document.querySelectorAll('.ui-widget-overlay,.ui-dialog').forEach(e => e.remove());
  const d = document.createElement('div');
  d.id = 'tz';
  d.innerHTML = '<p id="t1" style="margin:20px">Premier texte de test pour la vocalisation.</p>'
    + '<div id="empty" style="height:120px"></div>'
    + '<p id="t2" style="margin:20px">Second texte different a lire.</p>'
    + '<p id="t3" style="margin:20px">Une phrase avec un <a id="lk" href="#ancre">lien interne</a> au milieu de la phrase.</p>'
    + '<h2 id="acc" aria-expanded="false" style="margin:20px">Titre accordeon</h2>'
    + '<button id="btn" style="margin:20px">Bouton test</button>';
  document.body.insertBefore(d, document.body.firstChild);
  window.scrollTo(0, 0);
  window.__accToggles = 0; window.__btnClicks = 0;
  document.getElementById('acc').addEventListener('click', e => { window.__accToggles++; const h = e.currentTarget; h.setAttribute('aria-expanded', h.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); });
  document.getElementById('btn').addEventListener('click', () => window.__btnClicks++);
}
