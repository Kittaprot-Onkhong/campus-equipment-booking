# Campus Equipment Booking API

## Description

A REST API for booking shared campus equipment.

The API prevents overlapping bookings for the same equipment.

## Technology

- TypeScript
- Hono
- Cloudflare Workers
- Cloudflare D1
- SQLite

## Base URL

http://127.0.0.1:8787/api

## Database

### Equipment

- id
- name
- location

### Bookings

- id
- equipment_id
- borrower_name
- start_at
- end_at
- purpose

Relationship:

equipment 1 --- * bookings

## Run Locally

Install dependencies:

npm install

Run local server:

npx wrangler dev --local --port 8787

## Database Setup

Apply schema:

npx wrangler d1 execute campus-equipment-db --local --file=./schema.sql

Seed equipment:

npx wrangler d1 execute campus-equipment-db --local --file=./seed.sql

## API Endpoints

### Equipment

GET /api/equipment

### Bookings

GET /api/bookings

GET /api/bookings/:id

POST /api/bookings

PATCH /api/bookings/:id

DELETE /api/bookings/:id

## Validation Rules

1. equipmentId must exist.
2. startAt must be before endAt.
3. The same equipment cannot have overlapping bookings.
4. Adjacent bookings are allowed.

Overlap rule:

newStart < existingEnd
AND
newEnd > existingStart

## HTTP Status Codes

200 - Successful GET/PATCH

201 - Booking created

204 - Booking deleted

400 - Invalid request

404 - Resource not found

409 - Booking conflict

## Error Format

{
  "error": "message"
}

## SQL Security

All request values are passed using prepared statements and parameter binding with .prepare() and .bind().

Request data is not concatenated directly into SQL strings.

## Testing

See TEST_EVIDENCE.md.