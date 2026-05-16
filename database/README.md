# Database — MANEB Exam Results System (v1)

Owner: Database Dev  
Stack: PostgreSQL 15  
Database name: `maneb_results`

---

## Design — Zero Normal Form (Unnormalised)

v1 uses a single flat table with everything duplicated — no foreign keys,
no separate tables, no indexes. This is intentional. Every student's name,
school and exam number is repeated for every subject row. This causes
maximum redundancy and forces a full table scan on every search, which
is what makes the system slow under load.

This is the point of v1 — to demonstrate an unoptimised system breaking
under pressure when K6 fires thousands of requests at it.

---

## The One Table — exam_results

| Column | Type | Description |
|---|---|---|
| exam_number | VARCHAR(20) | Student exam number e.g. 2024JCE0042 |
| date_of_birth | DATE | Used with exam_number to verify identity |
| student_name | VARCHAR(100) | Full name — repeated 9 times per student |
| school | VARCHAR(100) | School name — repeated 9 times per student |
| exam_year | INT | Year of examination e.g. 2024 |
| subject | VARCHAR(100) | Subject name e.g. Mathematics |
| grade | CHAR(1) | Grade letter — A, B, C, D or F |
| remarks | VARCHAR(20) | Meaning — Distinction, Credit, Pass, Fail |

Each student has 9 rows — one per subject. With 50,008 students that
gives approximately 450,072 rows total, all in one table.

Example of what the data looks like:

```
exam_number  | dob        | student_name  | school         | year | subject     | grade | remarks
2024JCE0042  | 2008-03-15 | Chisomo Banda | Kamuzu Academy | 2024 | Mathematics | A     | Distinction
2024JCE0042  | 2008-03-15 | Chisomo Banda | Kamuzu Academy | 2024 | English     | B     | Credit
2024JCE0042  | 2008-03-15 | Chisomo Banda | Kamuzu Academy | 2024 | Chichewa    | A     | Distinction
...
```

---

## Subjects (9 total)

1. Mathematics
2. English Language
3. Chichewa
4. Biology
5. Physics
6. Chemistry
7. Social Studies
8. Religious Education
9. Life Skills

---

## Grade Scale

| Grade | Remarks |
|---|---|
| A | Distinction |
| B | Credit |
| C | Pass |
| D | Pass |
| F | Fail |

---

## Files

| File | Purpose | Run order |
|---|---|---|
| `schema.sql` | Creates the exam_results table | 1st — always |
| `seed.sql` | Inserts 8 real students (72 rows) | 2nd — always |
| `seed_bulk.sql` | Inserts 50,000 random students (450,000 rows) | 3rd — for K6 only |
| `queries.sql` | The main query the backend uses | Reference only |

---

## Local Setup

### Step 1 — Install PostgreSQL 15
```
https://www.postgresql.org/download/windows/
```
Remember the password you set. Default port is 5432 — leave it.

### Step 2 — Open pgAdmin
Search pgAdmin in Start menu. Enter your password when prompted.

### Step 3 — Create the database
Right-click Databases → Create → Database → name it `maneb_results` → Save

### Step 4 — Open Query Tool
Right-click `maneb_results` → Query Tool

### Step 5 — Run schema.sql
Paste contents of `schema.sql` and run. You should see `CREATE TABLE`.

### Step 6 — Run seed.sql
Paste contents of `seed.sql` and run. Inserts 72 rows for 8 real students.

### Step 7 — Run seed_bulk.sql (K6 testing only)
Paste contents of `seed_bulk.sql` and run. Takes about a minute.
Inserts 450,000 rows for 50,000 random students.

### Step 8 — Verify
```sql
SELECT COUNT(*) FROM exam_results;
-- Should be 72 (without bulk) or 450,072 (with bulk)
```

### Step 9 — Test the main query
```sql
SELECT * FROM exam_results
WHERE exam_number = '2024JCE0042'
AND date_of_birth = '2008-03-15';
```
Should return 9 rows for Chisomo Banda.

---

## Connection Details (for the Backend Dev)

```
Host:     localhost
Port:     5432
Database: maneb_results
Username: postgres
Password: (your password set during installation)
```

Node.js connection:
```js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'maneb_results',
  user: 'postgres',
  password: 'yourpassword'
});
```

---

## Main Query (for the Backend Dev)

No joins needed — everything is in one table:

```sql
SELECT
  student_name,
  school,
  exam_number,
  exam_year,
  subject,
  grade,
  remarks
FROM exam_results
WHERE exam_number = $1
AND date_of_birth = $2;
```

`$1` = exam number, `$2` = date of birth. Returns 9 rows — one per subject.

---

## API Response Shape (for the Backend Dev)

The backend should format the query results like this before sending to frontend:

```json
{
  "student": {
    "name": "Chisomo Banda",
    "school": "Kamuzu Academy",
    "examNumber": "2024JCE0042",
    "examYear": 2024
  },
  "results": [
    { "subject": "Mathematics",     "grade": "A", "remarks": "Distinction" },
    { "subject": "English Language","grade": "B", "remarks": "Credit" },
    { "subject": "Chichewa",        "grade": "A", "remarks": "Distinction" },
    { "subject": "Biology",         "grade": "C", "remarks": "Pass" },
    { "subject": "Physics",         "grade": "B", "remarks": "Credit" },
    { "subject": "Chemistry",       "grade": "C", "remarks": "Pass" },
    { "subject": "Social Studies",  "grade": "B", "remarks": "Credit" },
    { "subject": "Religious Education","grade": "A","remarks": "Distinction" },
    { "subject": "Life Skills",     "grade": "B", "remarks": "Credit" }
  ]
}
```

If no student is found, return:
```json
{ "error": "No results found for the provided exam number and date of birth." }
```

---

## Important Notes

- No indexes on any column — intentional for v1, do not add any
- Every search scans all 450,000 rows — this is what makes it slow
- Do not normalise this database — that is the job of v2
- The bulk data uses exam numbers like `2024JCE000001` to `2024JCE050000`
- The 8 real students use `2024JCE0042` to `2024JCE0678` — different format, no overlap
