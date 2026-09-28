(function () {
  const $ = (id) => document.getElementById(id);
  const seg = $('seg'), res = $('res');
  let mode = 'enc';

  const mod = (n, m) => ((n % m) + m) % m;
  const A = 'A'.charCodeAt(0), a = 'a'.charCodeAt(0);

  const hints = {
    caesar: 'Formula: E = (x + k) mod 26 · D = (x − k) mod 26. Digits shift by k mod 10.',
    vigenere: 'Formula: E = (x + kᵢ) mod 26 · D = (x − kᵢ) mod 26, where kᵢ is the i-th letter of the keyword. Digits shift by kᵢ mod 10.'
  };

  // Shift one character by n (letters mod 26, digits mod 10). Returns null if not shiftable.
  function shiftChar(c, n) {
    if (/[A-Za-z]/.test(c)) {
      const base = c <= 'Z' ? A : a;
      const x = c.charCodeAt(0) - base;
      const y = mod(x + n, 26);
      return { out: String.fromCharCode(y + base), x, y, mod: 26 };
    }
    if (/[0-9]/.test(c)) {
      const x = +c, y = mod(x + n, 10);
      return { out: String(y), x, y, mod: 10 };
    }
    return null;
  }

  function caesar(text, k, decrypt) {
    const n = decrypt ? -k : k, steps = [];
    let out = '';
    for (const c of text) {
      const r = shiftChar(c, n);
      if (!r) { out += c; continue; }
      out += r.out;
      if (steps.length < 8)
        steps.push(`<b>${c}</b> (${r.x}) ${decrypt ? '−' : '+'} ${Math.abs(k)} → ${r.y} mod ${r.mod} → <b>${r.out}</b>`);
    }
    return { out, steps };
  }

  function vigenere(text, keyword, decrypt) {
    const key = keyword.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (!key) throw new Error('Keyword must contain at least one letter (A–Z).');
    const steps = [];
    let out = '', i = 0;
    for (const c of text) {
      const kc = key[i % key.length], kv = kc.charCodeAt(0) - A;
      const r = shiftChar(c, decrypt ? -kv : kv);
      if (!r) { out += c; continue; }
      out += r.out;
      if (steps.length < 8)
        steps.push(`<b>${c}</b> (${r.x}) ${decrypt ? '−' : '+'} ${kc} (${kv}) → ${r.y} mod ${r.mod} → <b>${r.out}</b>`);
      i++;
    }
    return { out, steps };
  }

  function updateUI() {
    const alg = $('alg').value, key = $('key');
    seg.dataset.m = mode;
    $('hint').textContent = hints[alg];
    if (alg === 'caesar') {
      $('keyLabel').textContent = 'Shift (k)';
      if (key.type !== 'number') { key.type = 'number'; key.value = 3; }
    } else {
      $('keyLabel').textContent = 'Keyword';
      if (key.type !== 'text') { key.type = 'text'; key.value = 'KEY'; }
    }
  }

  function run() {
    const s = $('inp').value, alg = $('alg').value, decrypt = mode === 'dec';
    res.classList.remove('err', 'pop');
    void res.offsetWidth;
    $('steps').innerHTML = '—';
    if (!s.trim()) { res.textContent = '—'; $('stats').innerHTML = ''; return; }
    try {
      const r = alg === 'caesar'
        ? caesar(s, parseInt($('key').value, 10) || 0, decrypt)
        : vigenere(s, $('key').value, decrypt);
      res.textContent = r.out;
      res.classList.add('pop');
      $('steps').innerHTML = r.steps.length ? r.steps.map((t) => `<div>${t}</div>`).join('') : 'No letters or digits to process.';
      const isNum = !isNaN(Number(s.trim()));
      $('stats').innerHTML = [
        decrypt ? 'Decrypt' : 'Encrypt',
        alg === 'caesar' ? 'Caesar' : 'Vigenère',
        'Input type: ' + (isNum ? 'number' : 'text'),
        'Input length: ' + s.length,
        'Output length: ' + r.out.length
      ].map((t) => `<span>${t}</span>`).join('');
    } catch (e) {
      res.textContent = '⚠ ' + e.message;
      res.classList.add('err', 'pop');
      $('stats').innerHTML = '';
    }
  }

  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { mode = b.dataset.m; updateUI(); }
  });
  $('alg').addEventListener('change', updateUI);
  $('go').addEventListener('click', run);
  $('inp').addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 'Enter') run(); });
  $('copy').addEventListener('click', function () {
    navigator.clipboard?.writeText(res.textContent).catch(() => {});
    this.textContent = 'Copied ✓';
    setTimeout(() => (this.textContent = 'Copy'), 1200);
  });

  // Alphabet reference: letters on top, indexes 0-25 underneath
  $('alpha').innerHTML = Array.from({ length: 26 }, (_, i) =>
    `<div class="cell" style="animation-delay:${i * 30}ms"><span class="l">${String.fromCharCode(A + i)}</span><span class="n">${i}</span></div>`
  ).join('');

  updateUI();
})();