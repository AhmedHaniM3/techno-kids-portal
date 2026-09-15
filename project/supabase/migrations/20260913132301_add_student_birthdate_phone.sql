/*
# Add birth_date and phone to students table

## Changes
- Adds `birth_date` (date, nullable) to students for tracking birth dates
- Adds `phone` (text, nullable) to students for emergency contact phone
- Seeds existing students with birth_date values based on their age

## Security
- No RLS changes (existing policies already allow full CRUD)
*/

ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone text;

-- Seed birth dates for existing students based on their ages
UPDATE students SET birth_date = '2017-03-15' WHERE name = 'Omar Abdel-Rahman';
UPDATE students SET birth_date = '2019-07-22' WHERE name = 'Laila Abdel-Rahman';
UPDATE students SET birth_date = '2016-01-10' WHERE name = 'Adam El-Din';
UPDATE students SET birth_date = '2018-05-18' WHERE name = 'Salma El-Din';
UPDATE students SET birth_date = '2015-09-03' WHERE name = 'Ziad Farouk';
UPDATE students SET birth_date = '2020-11-30' WHERE name = 'Maya Farouk';
