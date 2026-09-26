const fs = require('fs');
const path = require('path');

function reconstructSentence(q, a, type, options) {
  if (!q) return a || '';
  if (type === 'word-order') return a || '';

  // Clean prompt prefixes like "Listen and tick:" or "Choose the correct answer:"
  const isPromptOnly = /^(listen and|listen to|choose the|odd one out|find the|which word)/i.test(q.trim());
  if (isPromptOnly) {
    if (a && a.length > 2 && !/^[A-D]$/i.test(a.trim())) {
      return a.trim();
    }
  }

  // Remove option tail if glued
  let cleanQ = q.replace(/\s+[A-D]\.\s+.*?\b[B-D]\.\s+.*$/i, '').trim();

  // If question has blanks like "be _ _ _" or "_ _ _ _ nt"
  if (cleanQ.includes('_')) {
    // If the blank has letter parts attached, e.g. "_ _ _ _ nt" or "be _ _ fore"
    const replaced = cleanQ.replace(/(_\s*)+/g, a || '');
    return replaced;
  }

  // If question has dots like "…" or "..."
  if (cleanQ.includes('…') || cleanQ.includes('...')) {
    const replaced = cleanQ.replace(/(\.{3,}|…)/g, a || '');
    return replaced;
  }

  // If question doesn't have an obvious placeholder but has an answer, e.g. "Odd one out"
  if (isPromptOnly && a) {
    return a;
  }

  return cleanQ;
}

async function main() {
  const list = JSON.parse(fs.readFileSync('/tmp/unique_questions.json', 'utf8'));
  console.log(`Processing ${list.length} unique questions...`);

  const cacheFile = '/tmp/translations_cache.json';
  let cache = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch (e) {}
  }

  const itemsToTranslate = [];
  for (const item of list) {
    const full = reconstructSentence(item.q, item.a, item.type, item.opts);
    if (!cache[full] && full && full.length > 1) {
      if (!itemsToTranslate.includes(full)) {
        itemsToTranslate.push(full);
      }
    }
  }

  console.log(`Need to translate ${itemsToTranslate.length} sentences. (Already cached: ${Object.keys(cache).length})`);

  let completed = 0;
  const CONCURRENCY = 6;
  let index = 0;

  async function worker() {
    while (index < itemsToTranslate.length) {
      const myIdx = index++;
      const text = itemsToTranslate[myIdx];
      try {
        const email = 'bon2beaking7@gmail.com';
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi&de=${encodeURIComponent(email)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const translated = data.responseData?.translatedText;
          if (translated && !translated.includes('MYMEMORY WARNING') && !translated.includes('QUERY LENGTH LIMIT')) {
            cache[text] = translated;
          }
        }
      } catch (err) {}

      completed++;
      if (completed % 25 === 0 || completed === itemsToTranslate.length) {
        fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
        console.log(`Progress: ${completed}/${itemsToTranslate.length} done. Cache count: ${Object.keys(cache).length}`);
      }
      await new Promise(r => setTimeout(r, 60));
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`All translations finished! Cached items: ${Object.keys(cache).length}`);

  // Now write directly into src/data/translations.json
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const targetFile = path.join(dataDir, 'translations.json');
  fs.writeFileSync(targetFile, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`Saved translations dictionary to ${targetFile}`);

  // Update all bo00.json ... bo14.json and public/bo00.json ... public/bo14.json
  let totalUpdated = 0;
  for (let i = 0; i <= 14; i++) {
    const fName = `bo${String(i).padStart(2, '0')}.json`;
    if (fs.existsSync(fName)) {
      const data = JSON.parse(fs.readFileSync(fName, 'utf8'));
      data.questions.forEach(q => {
        const full = reconstructSentence(q.question, q.answer, q.type, q.options);
        const trans = cache[full] || cache[q.answer] || cache[q.question];
        if (trans) {
          q.vietnameseTranslation = trans;
          if (!q.learning) q.learning = {};
          q.learning.vietnameseTranslation = trans;
          q.learning.translation = trans;
          totalUpdated++;
        }
      });
      fs.writeFileSync(fName, JSON.stringify(data, null, 2), 'utf8');

      // Also update in public/
      const pubPath = path.join('public', fName);
      if (fs.existsSync(pubPath)) {
        fs.writeFileSync(pubPath, JSON.stringify(data, null, 2), 'utf8');
      }
    }
  }
  console.log(`Updated ${totalUpdated} questions across all 15 sets with Vietnamese translation!`);
}

main().catch(console.error);
