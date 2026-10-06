\# AI Usage Log



\## Purpose



AI was used as a development assistant during the practical lab test.



\## Important AI Assistance



\### 1. API Design



Prompt/topic:

Asked AI to help design the equipment and booking API based on the exam requirements.



Used:

API endpoint structure, validation rules, HTTP status codes, and overlap logic.



Personally verified:

I reviewed the API contract and implemented/tested the endpoints.



\---



\### 2. Database Design



Prompt/topic:

Asked AI to help design the SQLite/D1 schema.



Used:

Equipment and bookings tables with a one-to-many relationship.



Personally verified:

I created and executed schema.sql and seed.sql locally.



\---



\### 3. Debugging



Prompt/topic:

Asked AI for help debugging PowerShell JSON request errors.



Used:

PowerShell ConvertTo-Json and Invoke-RestMethod for testing.



Personally verified:

I ran the commands locally and confirmed that POST /api/bookings returned a successful booking.



\---



\### 4. Testing



Prompt/topic:

Asked AI to suggest test cases for CRUD, validation, and booking conflicts.



Used:

Test cases for successful creation, invalid equipment, invalid time, overlapping bookings, PATCH, and DELETE.



Personally verified:

I executed the tests against my local API and checked the actual responses.

