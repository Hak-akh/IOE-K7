const fs = require('fs');

function stripOptionPrefix(str) {
  if (!str) return '';
  return str.replace(/^[A-Da-d]\s*[\.\:\-\)]\s*/, '').trim();
}

function normalizeText(str) {
  if (!str) return '';
  return stripOptionPrefix(str)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAnswerCorrect(userAns, q) {
  if (!userAns || !q || !q.answer) return false;

  const normUser = normalizeText(userAns);
  const normCorrect = normalizeText(q.answer);

  if (normUser === normCorrect) return true;

  if (q.options && q.options.length > 0) {
    const letters = ['A', 'B', 'C', 'D'];
    const correctIdx = q.options.findIndex(opt => normalizeText(opt) === normCorrect);
    if (correctIdx !== -1) {
      if (userAns.trim().toUpperCase() === letters[correctIdx]) return true;
      if (normalizeText(q.options[correctIdx]) === normUser) return true;
    }

    const userOption = q.options.find(opt => opt === userAns || normalizeText(opt) === normUser);
    if (userOption && normalizeText(userOption) === normCorrect) return true;
  }

  return false;
}

let testedCount = 0;
let passCount = 0;
for (let i = 0; i <= 50; i++) {
  const s = 'bo' + String(i).padStart(2, '0');
  if (!fs.existsSync(`public/${s}.json`)) continue;
  const data = JSON.parse(fs.readFileSync(`public/${s}.json`));
  for (const q of data.questions) {
    if (q.options && q.options.length > 0) {
      testedCount++;
      const correctOption = q.options.find(opt => normalizeText(opt) === normalizeText(q.answer));
      if (!correctOption) {
        console.error('No correct option found for:', s, q.number, q.options, q.answer);
      } else {
        const passed1 = isAnswerCorrect(correctOption, q);
        const passed2 = isAnswerCorrect(stripOptionPrefix(correctOption), q);
        const letters = ['A', 'B', 'C', 'D'];
        const optIdx = q.options.indexOf(correctOption);
        const passed3 = isAnswerCorrect(letters[optIdx], q);

        if (passed1 && passed2 && passed3) {
          passCount++;
        } else {
          console.error('Fail:', s, q.number, { passed1, passed2, passed3 });
        }
      }
    }
  }
}

console.log(`Tested ${testedCount} option questions, Passed: ${passCount}`);
