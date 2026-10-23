// Run with: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeState, dateToDay, dayToDate, listEclipses, findEclipse, findSynodic,
  newMoonBefore, dayForSynodicInLunation, synodicAt, phaseKeyFromAngle, wrap180,
} from '../js/simulation.js';

const day = iso => dateToDay(new Date(iso));

// Greatest eclipse times (UT) from published eclipse tables.
const KNOWN = [
  ['2024-03-25T07:13Z', 'lunar', 'penumbral'],
  ['2024-04-08T18:17Z', 'solar', 'total'],
  ['2024-09-18T02:44Z', 'lunar', 'partial'],
  ['2024-10-02T18:45Z', 'solar', 'annular'],
  ['2025-03-14T06:59Z', 'lunar', 'total'],
  ['2025-03-29T10:47Z', 'solar', 'partial'],
  ['2025-09-07T18:11Z', 'lunar', 'total'],
  ['2025-09-21T19:42Z', 'solar', 'partial'],
  ['2026-02-17T12:12Z', 'solar', 'annular'],
  ['2026-03-03T11:33Z', 'lunar', 'total'],
  ['2026-08-12T17:46Z', 'solar', 'total'],
  ['2026-08-28T04:13Z', 'lunar', 'partial'],
  ['2027-02-06T16:00Z', 'solar', 'annular'],
  ['2027-02-20T23:13Z', 'lunar', 'penumbral'],
  ['2027-07-18T16:03Z', 'lunar', 'penumbral'],
  ['2027-08-02T10:07Z', 'solar', 'total'],
  ['2027-08-17T07:14Z', 'lunar', 'penumbral'],
  ['2028-01-12T04:13Z', 'lunar', 'partial'],
  ['2028-01-26T15:08Z', 'solar', 'annular'],
  ['2028-07-06T18:20Z', 'lunar', 'partial'],
  ['2028-07-22T02:56Z', 'solar', 'total'],
  ['2028-12-31T16:52Z', 'lunar', 'total'],
];

test('reproduces every eclipse of 2024–2028 with the right type', () => {
  const found = listEclipses(day('2024-01-01T00:00Z'), day('2029-01-01T00:00Z'));
  assert.equal(found.length, KNOWN.length);
  found.forEach((ec, i) => {
    const [iso, kind, type] = KNOWN[i];
    assert.equal(ec.kind, kind, iso);
    assert.equal(ec.type, type, iso);
    assert.ok(Math.abs(ec.day - day(iso)) < 30 / 1440, `${iso}: off by ${((ec.day - day(iso)) * 1440).toFixed(0)} min`);
  });
});

test('with the tilt off, every new and full moon is an eclipse', () => {
  const start = day('2026-01-01T00:00Z');
  const found = listEclipses(start, start + 365, { tilt: false });
  assert.ok(found.length >= 24, `only ${found.length} eclipses`);
});

test('findEclipse moves strictly forward and backward', () => {
  const t0 = day('2026-08-12T17:46Z');
  const next = findEclipse(t0, 1, 'solar');
  const prev = findEclipse(t0, -1, 'solar');
  assert.ok(Math.abs(next.day - day('2027-02-06T16:00Z')) < 0.05);
  assert.ok(Math.abs(prev.day - day('2026-02-17T12:12Z')) < 0.05);
});

test('phases: full moon of 2026-10-26 and quarter shapes', () => {
  const s = computeState(day('2026-10-26T04:12Z'));
  assert.equal(s.phaseKey, 'full');
  assert.ok(s.illumFrac > 0.99);
  assert.equal(phaseKeyFromAngle(90), 'firstQuarter');
  assert.equal(phaseKeyFromAngle(359), 'new');
  assert.equal(phaseKeyFromAngle(280), 'lastQuarter');
  assert.equal(phaseKeyFromAngle(300), 'waningCrescent');
});

test('lunation helpers are consistent', () => {
  const t = day('2026-10-23T12:00Z');
  const nm = newMoonBefore(t);
  assert.ok(nm <= t && t - nm < 29.6);
  assert.ok(Math.abs(wrap180(synodicAt(nm))) < 1e-3);
  assert.ok(Math.abs(newMoonBefore(nm) - nm) < 1e-3, 'a new moon is its own lunation start');
  const fq = dayForSynodicInLunation(nm, 90);
  assert.ok(Math.abs(synodicAt(fq) - 90) < 1e-3);
  assert.ok(fq > nm && fq < nm + 10);
  const nf = findSynodic(t, 180, 1);
  assert.ok(nf > t && Math.abs(synodicAt(nf) - 180) < 1e-3);
});

test('moon age and date conversions', () => {
  const t = day('2026-10-10T15:50Z');   // new moon
  assert.ok(computeState(t).moonAge < 0.05 || computeState(t).moonAge > 29.4);
  assert.equal(dayToDate(day('2026-01-02T03:04:05Z')).toISOString(), '2026-01-02T03:04:05.000Z');
});
