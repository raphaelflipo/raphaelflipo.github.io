const button = document.getElementById('verification-services');
const summary = document.getElementById('resume-services');
const targets = [...document.querySelectorAll('[data-status-path]')];
const english = document.documentElement.lang === 'en';

async function check(target) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(target.dataset.statusPath, {
      method: 'HEAD', cache: 'no-store', signal: controller.signal
    });
    const elapsed = Math.round(performance.now() - start);
    target.dataset.result = response.ok ? 'ok' : 'failed';
    target.textContent = `HTTP ${response.status} · ${elapsed} ms`;
  } catch {
    target.dataset.result = 'failed';
    target.textContent = english ? 'No response from this browser' : 'Aucune réponse depuis ce navigateur';
  } finally {
    clearTimeout(timer);
  }
}

button.addEventListener('click', async () => {
  button.disabled = true;
  summary.textContent = english ? 'Checking the pages…' : 'Vérification des pages…';
  await Promise.all(targets.map(check));
  const checked = new Intl.DateTimeFormat(english ? 'en-GB' : 'fr-FR', {
    dateStyle: 'short', timeStyle: 'medium'
  }).format(new Date());
  summary.textContent = english ? `Checked on ${checked}` : `Vérifié le ${checked}`;
  button.disabled = false;
});
button.hidden = false;
