import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

type BookingInput = {
  equipmentId?: string
  borrowerName?: string
  startAt?: string
  endAt?: string
  purpose?: string
}

const app = new Hono<{ Bindings: Bindings }>()

function errorResponse(c: any, status: number, message: string) {
  return c.json({ error: message }, status)
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false
  }

  return !Number.isNaN(Date.parse(value))
}

function validateBookingData(data: BookingInput) {
  if (
    typeof data.equipmentId !== 'string' ||
    data.equipmentId.trim() === ''
  ) {
    return 'equipmentId is required'
  }

  if (
    typeof data.borrowerName !== 'string' ||
    data.borrowerName.trim() === ''
  ) {
    return 'borrowerName is required'
  }

  if (!isValidDate(data.startAt)) {
    return 'startAt must be a valid date/time'
  }

  if (!isValidDate(data.endAt)) {
    return 'endAt must be a valid date/time'
  }

  if (Date.parse(data.startAt!) >= Date.parse(data.endAt!)) {
    return 'startAt must be before endAt'
  }

  if (
    typeof data.purpose !== 'string' ||
    data.purpose.trim() === ''
  ) {
    return 'purpose is required'
  }

  return null
}

// --------------------------------------------------
// EQUIPMENT
// --------------------------------------------------

app.get('/api/equipment', async (c) => {
  const result = await c.env.DB
    .prepare('SELECT id, name, location FROM equipment ORDER BY id')
    .all()

  return c.json(result.results, 200)
})

// --------------------------------------------------
// BOOKINGS - GET ALL
// --------------------------------------------------

app.get('/api/bookings', async (c) => {
  const result = await c.env.DB
    .prepare(`
      SELECT
        id,
        equipment_id AS equipmentId,
        borrower_name AS borrowerName,
        start_at AS startAt,
        end_at AS endAt,
        purpose
      FROM bookings
      ORDER BY start_at
    `)
    .all()

  return c.json(result.results, 200)
})

// --------------------------------------------------
// BOOKINGS - GET ONE
// --------------------------------------------------

app.get('/api/bookings/:id', async (c) => {
  const id = c.req.param('id')

  const result = await c.env.DB
    .prepare(`
      SELECT
        id,
        equipment_id AS equipmentId,
        borrower_name AS borrowerName,
        start_at AS startAt,
        end_at AS endAt,
        purpose
      FROM bookings
      WHERE id = ?
    `)
    .bind(id)
    .first()

  if (!result) {
    return errorResponse(c, 404, 'Booking not found')
  }

  return c.json(result, 200)
})

// --------------------------------------------------
// BOOKINGS - CREATE
// --------------------------------------------------

app.post('/api/bookings', async (c) => {
  let data: BookingInput

  try {
    data = await c.req.json()
  } catch {
    return errorResponse(c, 400, 'Request body must be valid JSON')
  }

  const validationError = validateBookingData(data)

  if (validationError) {
    return errorResponse(c, 400, validationError)
  }

  // Check equipment exists
  const equipment = await c.env.DB
    .prepare('SELECT id FROM equipment WHERE id = ?')
    .bind(data.equipmentId!)
    .first()

  if (!equipment) {
    return errorResponse(c, 400, 'equipmentId does not exist')
  }

  // Check overlapping booking
  const conflict = await c.env.DB
    .prepare(`
      SELECT id
      FROM bookings
      WHERE equipment_id = ?
        AND julianday(start_at) < julianday(?)
        AND julianday(end_at) > julianday(?)
      LIMIT 1
    `)
    .bind(
      data.equipmentId!,
      data.endAt!,
      data.startAt!
    )
    .first()

  if (conflict) {
    return errorResponse(
      c,
      409,
      'This equipment is already booked during the requested time'
    )
  }

  const id = `booking-${Date.now()}`

  await c.env.DB
    .prepare(`
      INSERT INTO bookings
        (id, equipment_id, borrower_name, start_at, end_at, purpose)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      data.equipmentId!,
      data.borrowerName!,
      data.startAt!,
      data.endAt!,
      data.purpose!
    )
    .run()

  const created = await c.env.DB
    .prepare(`
      SELECT
        id,
        equipment_id AS equipmentId,
        borrower_name AS borrowerName,
        start_at AS startAt,
        end_at AS endAt,
        purpose
      FROM bookings
      WHERE id = ?
    `)
    .bind(id)
    .first()

  return c.json(created, 201)
})

// --------------------------------------------------
// BOOKINGS - UPDATE
// --------------------------------------------------

app.patch('/api/bookings/:id', async (c) => {
  const id = c.req.param('id')

  const existing = await c.env.DB
    .prepare(`
      SELECT
        id,
        equipment_id AS equipmentId,
        borrower_name AS borrowerName,
        start_at AS startAt,
        end_at AS endAt,
        purpose
      FROM bookings
      WHERE id = ?
    `)
    .bind(id)
    .first<BookingInput>()

  if (!existing) {
    return errorResponse(c, 404, 'Booking not found')
  }

  let data: BookingInput

  try {
    data = await c.req.json()
  } catch {
    return errorResponse(c, 400, 'Request body must be valid JSON')
  }

  const updated: BookingInput = {
    equipmentId: data.equipmentId ?? existing.equipmentId,
    borrowerName: data.borrowerName ?? existing.borrowerName,
    startAt: data.startAt ?? existing.startAt,
    endAt: data.endAt ?? existing.endAt,
    purpose: data.purpose ?? existing.purpose
  }

  const validationError = validateBookingData(updated)

  if (validationError) {
    return errorResponse(c, 400, validationError)
  }

  // Check equipment exists
  const equipment = await c.env.DB
    .prepare('SELECT id FROM equipment WHERE id = ?')
    .bind(updated.equipmentId!)
    .first()

  if (!equipment) {
    return errorResponse(c, 400, 'equipmentId does not exist')
  }

  // Check overlap, excluding the booking being updated
  const conflict = await c.env.DB
    .prepare(`
      SELECT id
      FROM bookings
      WHERE equipment_id = ?
        AND id != ?
        AND julianday(start_at) < julianday(?)
        AND julianday(end_at) > julianday(?)
      LIMIT 1
    `)
    .bind(
      updated.equipmentId!,
      id,
      updated.endAt!,
      updated.startAt!
    )
    .first()

  if (conflict) {
    return errorResponse(
      c,
      409,
      'This equipment is already booked during the requested time'
    )
  }

  await c.env.DB
    .prepare(`
      UPDATE bookings
      SET
        equipment_id = ?,
        borrower_name = ?,
        start_at = ?,
        end_at = ?,
        purpose = ?
      WHERE id = ?
    `)
    .bind(
      updated.equipmentId!,
      updated.borrowerName!,
      updated.startAt!,
      updated.endAt!,
      updated.purpose!,
      id
    )
    .run()

  const result = await c.env.DB
    .prepare(`
      SELECT
        id,
        equipment_id AS equipmentId,
        borrower_name AS borrowerName,
        start_at AS startAt,
        end_at AS endAt,
        purpose
      FROM bookings
      WHERE id = ?
    `)
    .bind(id)
    .first()

  return c.json(result, 200)
})

// --------------------------------------------------
// BOOKINGS - DELETE
// --------------------------------------------------

app.delete('/api/bookings/:id', async (c) => {
  const id = c.req.param('id')

  const existing = await c.env.DB
    .prepare('SELECT id FROM bookings WHERE id = ?')
    .bind(id)
    .first()

  if (!existing) {
    return errorResponse(c, 404, 'Booking not found')
  }

  await c.env.DB
    .prepare('DELETE FROM bookings WHERE id = ?')
    .bind(id)
    .run()

  return c.body(null, 204)
})

// --------------------------------------------------
// 404
// --------------------------------------------------

app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404)
})

export default app