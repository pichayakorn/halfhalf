const test = require('node:test');
const assert = require('node:assert/strict');
const { toSatang, fromSatang, sanitizeAmount, splitFromPrice, splitFromGov, splitFromUser } = require('../calc.js');

test('toSatang avoids float drift', () => {
  assert.equal(toSatang('0.1') + toSatang('0.2'), 30);
  assert.equal(toSatang('19.99'), 1999);
  assert.equal(toSatang(''), 0);
  assert.equal(toSatang('abc'), 0);
});

test('fromSatang formats to 2dp', () => {
  assert.equal(fromSatang(1999), '19.99');
  assert.equal(fromSatang(5), '0.05');
});

test('sanitizeAmount', () => {
  assert.equal(sanitizeAmount('12abc.345.6'), '12.34');
  assert.equal(sanitizeAmount('007'), '7');
  assert.equal(sanitizeAmount('.5'), '0.5');
  assert.equal(sanitizeAmount('5.'), '5.');
  assert.equal(sanitizeAmount('1234567.891'), '123456.89');
  assert.equal(sanitizeAmount('-3'), '3');
});

test('splitFromPrice: 60/40 under the cap', () => {
  assert.deepEqual(splitFromPrice(10000, 20000), { price: 10000, gov: 6000, user: 4000, rawGov: 6000 });
});

test('splitFromPrice: shares always sum to price', () => {
  for (let price = 1; price < 5000; price++) {
    const s = splitFromPrice(price, 1e9);
    assert.equal(s.gov + s.user, price);
  }
});

test('splitFromPrice: cap reached, user pays the rest', () => {
  const s = splitFromPrice(50000, 20000);
  assert.equal(s.gov, 20000);
  assert.equal(s.user, 30000);
  assert.ok(s.rawGov > 20000);
});

test('splitFromPrice: no subsidy left', () => {
  const s = splitFromPrice(10000, 0);
  assert.equal(s.gov, 0);
  assert.equal(s.user, 10000);
});

test('splitFromGov: derives price and user share', () => {
  assert.deepEqual(splitFromGov(6000, 20000), { price: 10000, gov: 6000, user: 4000, rawGov: 6000 });
});

test('splitFromGov: clamps to the remaining subsidy', () => {
  const s = splitFromGov(99999, 20000);
  assert.equal(s.gov, 20000);
  assert.equal(s.gov + s.user, s.price);
});

test('splitFromUser: under the cap', () => {
  assert.deepEqual(splitFromUser(4000, 20000), { price: 10000, gov: 6000, user: 4000, rawGov: 6000 });
});

test('splitFromUser: above the cap the government pays only what remains', () => {
  const s = splitFromUser(30000, 20000);
  assert.equal(s.gov, 20000);
  assert.equal(s.price, 50000);
});

test('splitFromUser: shares always sum to price', () => {
  for (let user = 1; user < 5000; user++) {
    const s = splitFromUser(user, 20000);
    assert.equal(s.gov + s.user, s.price);
  }
});
