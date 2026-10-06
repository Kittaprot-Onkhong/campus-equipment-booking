\# Test Evidence



\## Base API URL



http://127.0.0.1:8787/api



\## Test 1: GET Equipment



Request:

GET /equipment



Expected:

200 OK



Observed:

200 OK



Result:

PASS



\---



\## Test 2: Create Booking



Request:

POST /bookings



Equipment:

eq-1



Time:

2026-10-20 09:00 - 11:00 UTC



Expected:

201 Created



Observed:

201 Created



Result:

PASS



\---



\## Test 3: Get Booking



Request:

GET /bookings/{bookingId}



Expected:

200 OK



Observed:

200 OK



Result:

PASS



\---



\## Test 4: Invalid Equipment



Request:

POST /bookings



Equipment:

eq-999



Expected:

400 Bad Request



Observed:

400 Bad Request



Response:

{"error":"equipmentId does not exist"}



Result:

PASS



\---



\## Test 5: Overlapping Booking



Request:

POST /bookings



Existing:

eq-1

09:00 - 11:00



New:

eq-1

10:00 - 12:00



Expected:

409 Conflict



Observed:

409 Conflict



Response:

{"error":"This equipment is already booked during the requested time"}



Result:

PASS



\---



\## Test 6: Invalid Time



Request:

POST /bookings



Start:

14:00



End:

13:00



Expected:

400 Bad Request



Observed:

400 Bad Request



Response:

{"error":"startAt must be before endAt"}



Result:

PASS



\---



\## Test 7: Update Booking



Request:

PATCH /bookings/{bookingId}



Expected:

200 OK



Observed:

200 OK



Result:

PASS



\---



\## Test 8: Delete Booking



Request:

DELETE /bookings/{bookingId}



Expected:

204 No Content



Observed:

204 No Content



Result:

PASS

