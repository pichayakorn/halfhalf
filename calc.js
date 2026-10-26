// Pure split/money logic. All money is integer satang (1/100 baht).
// Loaded as a plain script in the browser and require()-able from tests.

const RATIO_GOV = 60;
const RATIO_USER = 40;

function toSatang(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function fromSatang(satang) {
  return (satang / 100).toFixed(2);
}

// Keep only digits and one dot, max 2 decimals, max 6 integer digits
function sanitizeAmount(text) {
  let v = text.replace(/[^\d.]/g, '');
  const dot = v.indexOf('.');
  if (dot !== -1) {
    v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  }
  const intPart = (dot === -1 ? v : v.slice(0, dot)).replace(/^0+(?=\d)/, '').slice(0, 6);
  return dot === -1 ? intPart : (intPart || '0') + v.slice(dot);
}

// Each split returns { price, gov, user, rawGov } in satang. `rawGov` is what the
// government would pay with no cap, used to tell whether the cap kicked in.
function splitFromPrice(price, remaining) {
  const rawGov = Math.round(price * RATIO_GOV / 100);
  const gov = Math.min(rawGov, remaining);
  return { price, gov, user: price - gov, rawGov };
}

function splitFromGov(gov, remaining) {
  gov = Math.min(gov, remaining);
  const price = Math.round(gov * 100 / RATIO_GOV);
  return { price, gov, user: price - gov, rawGov: Math.round(price * RATIO_GOV / 100) };
}

function splitFromUser(user, remaining) {
  const userAtCap = Math.round(remaining * RATIO_USER / RATIO_GOV);
  let price, gov;
  if (user > userAtCap) {
    gov = remaining;
    price = user + gov;
  } else {
    price = Math.round(user * 100 / RATIO_USER);
    gov = price - user;
  }
  return { price, gov, user, rawGov: Math.round(price * RATIO_GOV / 100) };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RATIO_GOV, RATIO_USER, toSatang, fromSatang, sanitizeAmount, splitFromPrice, splitFromGov, splitFromUser };
}
