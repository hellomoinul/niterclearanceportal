-- Normalize N/A remarks text: replace em-dash (U+2014) with ASCII dash to prevent
-- rendering issues (shows as ??? in some contexts).

UPDATE department_reviews
SET remarks = 'N/A - student declared'
WHERE remarks = 'N/A — student declared';
