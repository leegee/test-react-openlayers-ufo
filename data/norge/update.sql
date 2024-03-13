DROP TABLE IF EXISTS sightings;
CREATE TABLE sightings (
    datetime_original VARCHAR(20),  
    datetime TIMESTAMP,
    datetime_invalid BOOLEAN
);

INSERT INTO sightings (datetime_original, datetime, datetime_invalid)
SELECT 
    CONCAT("obs Õr", '-', "Obs mÕned", '-', observasjonsdato) AS datetime_original,
    CASE 
        WHEN "obs Õr" IS NOT NULL AND "Obs mÕned" IS NOT NULL AND observasjonsdato IS NOT NULL THEN
            TO_DATE(
                CONCAT(
                    COALESCE("obs Õr", ''),
                    '-',
                    CASE WHEN "Obs mÕned"::integer > 12 THEN '01' ELSE COALESCE(NULLIF("Obs mÕned", '?'), '01') END,
                    '-',
                    COALESCE(NULLIF(observasjonsdato, '?'), '01')
                ),
                'YYYY-MM-DD'
            )
        ELSE NULL
    END AS datetime,
    CASE 
        WHEN "obs Õr" IS NOT NULL AND "Obs mÕned" IS NOT NULL AND observasjonsdato IS NOT NULL AND "Obs mÕned"::integer > 12 THEN
            true
        ELSE
            false
    END AS datetime_invalid
FROM hovedtabell;
