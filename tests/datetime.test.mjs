// Run with: npm test  (pure Node, no browser). Verifies IST formatting and date-only handling.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDate, formatDateTime, formatTime, getCurrentISTDate, getCurrentISTTime, toISTDateString, istDayDiff, istMonthKey, formatMonthKey } from '../src/utils/datetime.js'

test('formatDate / formatTime / formatDateTime use IST (UTC+05:30)', () => {
  assert.equal(formatDate('2026-11-04T11:00:00.000Z'), '04 Nov 2026')
  assert.equal(formatTime('2026-11-04T11:00:00.000Z'), '04:30 PM IST')
  assert.equal(formatDateTime('2026-11-04T11:00:00.000Z'), '04 Nov 2026, 04:30 PM IST')
  assert.equal(formatTime('2026-11-04T00:00:00Z'), '05:30 AM IST')
  assert.equal(formatTime('2026-11-04T18:30:00Z'), '12:00 AM IST')
})

test('UTC/IST midnight boundary moves the calendar day for timestamps', () => {
  assert.equal(formatDate('2026-11-04T18:29:59Z'), '04 Nov 2026')
  assert.equal(formatDate('2026-11-04T18:30:00Z'), '05 Nov 2026')
  assert.equal(toISTDateString('2026-12-31T20:00:00Z'), '2027-01-01')
  assert.equal(formatDateTime('2026-11-04T23:59:00Z'), '05 Nov 2026, 05:29 AM IST')
})

test('date-only values are calendar dates: never shifted, no time shown', () => {
  for (const d of ['2026-11-04', '2026-01-01', '2026-12-31', '2026-03-01']) {
    const out = formatDate(d)
    assert.equal(out, new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d + 'T12:00:00Z')).replace(',', ''))
  }
  assert.equal(formatDate('2026-11-04'), '04 Nov 2026')
  assert.equal(formatDateTime('2026-11-04'), '04 Nov 2026')
  assert.equal(formatTime('2026-11-04'), '—')
  assert.equal(toISTDateString('2026-11-04'), '2026-11-04')
})

test('result does not depend on the machine timezone', () => {
  const orig = process.env.TZ
  for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Auckland']) {
    process.env.TZ = tz
    assert.equal(formatDateTime('2026-11-04T11:00:00Z'), '04 Nov 2026, 04:30 PM IST')
    assert.equal(formatDate('2026-11-04'), '04 Nov 2026')
  }
  process.env.TZ = orig
})

test('getCurrentISTDate / getCurrentISTTime are live and consistent', () => {
  assert.match(getCurrentISTDate(), /^\d{4}-\d{2}-\d{2}$/)
  assert.match(getCurrentISTTime(), /^\d{2}:\d{2} (AM|PM) IST$/)
  const viaIntl = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  assert.equal(getCurrentISTDate(), viaIntl)
})

test('day diff and month buckets use IST calendar dates', () => {
  assert.equal(istDayDiff('2026-11-04T18:30:00Z', '2026-11-05'), 0) // 5 Nov IST vs 5 Nov
  assert.equal(istDayDiff('2026-11-04T18:29:00Z', '2026-11-05'), 1)
  assert.equal(istMonthKey('2026-10-31T20:00:00Z'), '2026-11') // already 1 Nov in India
  assert.equal(istMonthKey('2026-11-30'), '2026-11')
  assert.equal(formatMonthKey('2026-11'), 'Nov 26')
})

test('invalid input is handled gracefully', () => {
  assert.equal(formatDate(null), '—')
  assert.equal(formatDateTime('garbage'), '—')
})
