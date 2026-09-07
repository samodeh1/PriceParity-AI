import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePPPPrice } from '../src/pricingEngine.js';

test('HIGH countries receive a 70 percent discount', () => {
  const result = calculatePPPPrice(100, 'NG');
  assert.equal(result.discountTier, 'HIGH');
  assert.equal(result.discountPercentage, 70);
  assert.equal(result.suggestedPrice, 30);
});

test('MID countries receive a 50 percent discount', () => {
  const result = calculatePPPPrice(100, 'BR');
  assert.equal(result.discountTier, 'MID');
  assert.equal(result.discountPercentage, 50);
  assert.equal(result.suggestedPrice, 50);
});

test('LOW countries receive a 20 percent discount', () => {
  const result = calculatePPPPrice(100, 'JP');
  assert.equal(result.discountTier, 'LOW');
  assert.equal(result.discountPercentage, 20);
  assert.equal(result.suggestedPrice, 80);
});

test('NONE countries receive no discount', () => {
  const result = calculatePPPPrice(100, 'US');
  assert.equal(result.discountTier, 'NONE');
  assert.equal(result.discountPercentage, 0);
  assert.equal(result.suggestedPrice, 100);
});

test('unknown countries receive no discount', () => {
  const result = calculatePPPPrice(100, 'XX');
  assert.equal(result.discountTier, 'NONE');
  assert.equal(result.discountPercentage, 0);
  assert.equal(result.suggestedPrice, 100);
});
