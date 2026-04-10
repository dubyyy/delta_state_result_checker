# Reset Exam Numbers Test

## Overview

This test verifies the `reset-exam-numbers` endpoint functionality, specifically:

1. **Alphabetical sorting**: Students are sorted case-insensitively by lastname, then firstname
2. **Sequential numbering**: Exam numbers are assigned sequentially (0001, 0002, 0003, ...)
3. **Unique constraint handling**: The two-phase SQL approach prevents unique constraint violations during reordering

## How to Run

### Prerequisites

1. Make sure your Next.js dev server is running:
   ```bash
   npm run dev
   ```

2. Ensure your database is connected and has at least one school with students

### Run the Test

```bash
npm run test:reset-exam
```

## What the Test Does

1. **Finds or creates a test school** with students
2. **Records the initial state** of student exam numbers
3. **Calls the reset-exam-numbers API endpoint**
4. **Verifies the results**:
   - Sequential numbering (e.g., `80010001`, `80010002`, `80010003`)
   - Alphabetical sorting by lastname then firstname
   - No duplicate student numbers
   - All students updated successfully

## Expected Output

```
🧪 Testing reset-exam-numbers functionality...

🎯 Testing with school: Test School
   LGA Code: 8, School Code: 1

📊 Found 5 students

📋 Before reset:
   1. Adams, Charlie → 80010005
   2. Adams, David → 80010002
   3. Adams, Zara → 80010001
   4. Brown, Alice → 80010003
   5. Brown, Bob → 80010004

🔄 Calling reset-exam-numbers endpoint...

✅ API call succeeded
   Message: Successfully reset exam numbers for 5 student(s) in Test School
   Count: 5

📋 After reset:
   1. Adams, Charlie → 80010001
   2. Adams, David → 80010002
   3. Adams, Zara → 80010003
   4. Brown, Alice → 80010004
   5. Brown, Bob → 80010005

🔍 Verifying results...

✅ All verifications passed!
   ✓ Sequential numbering (80010001, 0002, ...)
   ✓ Alphabetical sorting (lastname, firstname)
   ✓ No duplicate numbers
   ✓ Two-phase SQL handled unique constraints

🎉 Test completed successfully!
```

## Testing with Production Data

To test with your 7,000+ students in production:

1. **Backup your database first**
2. Run the test script (it will use an existing school)
3. Or manually call the endpoint via the UI at `/zuwa2/reset-exam-numbers`

## Troubleshooting

### Error: "No school with students found"

The test will automatically create a test school with sample data.

### Error: "API call failed"

- Ensure the dev server is running on `http://localhost:3000`
- Check the server logs for detailed error messages
- Verify database connection

### Error: "SchoolData not found"

The school needs an entry in the `SchoolData` table with the sequential codes. The test creates this automatically for test schools.

## Technical Details

### Two-Phase SQL Approach

The endpoint uses a two-phase raw SQL update to avoid unique constraint violations:

**Phase 1**: Set all `studentNumber` values to temporary placeholders
```sql
UPDATE "StudentRegistration" 
SET "studentNumber" = CASE 
  WHEN id = 'abc123' THEN 'TEMP_abc123'
  WHEN id = 'def456' THEN 'TEMP_def456'
  ...
END
WHERE id IN ('abc123', 'def456', ...)
```

**Phase 2**: Set final sequential values
```sql
UPDATE "StudentRegistration" 
SET "studentNumber" = CASE 
  WHEN id = 'abc123' THEN '80010001'
  WHEN id = 'def456' THEN '80010002'
  ...
END
WHERE id IN ('abc123', 'def456', ...)
```

This prevents collisions when student A needs number 0002 but student B currently holds it.
