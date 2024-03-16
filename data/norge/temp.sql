SET client_encoding TO 'UTF8';

UPDATE sightings AS s
SET datetime_original = CONCAT(
        COALESCE(LPAD(h."obs år", 4, '0'), '0001'),
        '-', 
        COALESCE(LPAD(h."Obs måned", 2, '0'), '01'),
        '-', 
        COALESCE(LPAD(h."observasjonsdato", 2, '0'), '01')
    )
FROM hovedtabell AS h
WHERE s.id = h."Datarapp nr";
