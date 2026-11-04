import db from '../config/database.js'
import { conflict, forbidden, notFound } from '../utils/apiResponse.js'
import { nowIso, paymentOut } from '../utils/mappers.js'

export function listPayments(user) {
  const order = 'ORDER BY payment_date DESC, id DESC'
  let rows
  if (user.role === 'admin') rows = db.prepare(`SELECT * FROM payments ${order}`).all()
  else rows = db.prepare(`SELECT * FROM payments WHERE ${user.role === 'client' ? 'client_id' : 'freelancer_id'} = ? ${order}`).all(user.id)
  const totals = { paid: 0, pending: 0, refunded: 0 }
  rows.forEach((r) => { totals[r.payment_status] += r.amount })
  return { payments: rows.map(paymentOut), totals }
}

function load(id) {
  const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(id)
  if (!p) throw notFound('Payment not found.')
  return p
}

export function pay(user, id) {
  const p = load(id)
  if (user.role !== 'admin' && p.client_id !== user.id) throw forbidden('Only the paying client can complete this payment.')
  if (p.payment_status === 'paid') throw conflict('This payment has already been paid.')
  if (p.payment_status !== 'pending') throw conflict('Only pending payments can be paid.')
  // Guarded update keeps this safe if two requests race.
  const res = db.prepare(`UPDATE payments SET payment_status = 'paid', payment_date = ? WHERE id = ? AND payment_status = 'pending'`).run(nowIso(), id)
  if (!res.changes) throw conflict('This payment has already been paid.')
  return paymentOut(load(id))
}

export function refund(user, id) {
  const p = load(id)
  if (user.role !== 'admin') throw forbidden('Only administrators can issue refunds.')
  if (p.payment_status !== 'paid') throw conflict('Only paid payments can be refunded.')
  db.prepare(`UPDATE payments SET payment_status = 'refunded', payment_date = ? WHERE id = ? AND payment_status = 'paid'`).run(nowIso(), id)
  return paymentOut(load(id))
}
