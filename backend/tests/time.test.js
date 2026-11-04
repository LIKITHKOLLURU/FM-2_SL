import { test } from 'node:test'
import assert from 'node:assert/strict'
import { istDate, istDatePlusDays, isDateOnly } from '../utils/time.js'

test('IST calendar date across the UTC/IST midnight boundary (IST = UTC+05:30)', () => {
  assert.equal(istDate('2026-11-04T18:29:59.999Z'), '2026-11-04') // 23:59:59 IST
  assert.equal(istDate('2026-11-04T18:30:00.000Z'), '2026-11-05') // 00:00 IST next day
  assert.equal(istDate('2026-11-04T00:00:00.000Z'), '2026-11-04') // 05:30 IST
  assert.equal(istDate('2026-12-31T20:00:00Z'), '2027-01-01') // year rollover
})

test('date-only values are calendar dates and never shift', () => {
  assert.equal(isDateOnly('2026-11-04'), true)
  assert.equal(isDateOnly('2026-11-04T00:00:00Z'), false)
  assert.equal(istDate('2026-11-04'), '2026-11-04')
})

test('istDatePlusDays adds calendar days from the IST date, not the UTC date', () => {
  const lateUtc = new Date('2026-11-04T20:00:00Z') // already 5 Nov in India
  assert.equal(istDatePlusDays(0, lateUtc), '2026-11-05')
  assert.equal(istDatePlusDays(10, lateUtc), '2026-11-15')
  assert.equal(istDatePlusDays(30, new Date('2026-02-10T03:00:00Z')), '2026-03-12')
})
