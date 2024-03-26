DROP TABLE IF EXISTS "96";
CREATE TABLE "96" (
  id INTEGER,
  "Avgjørelse" VARCHAR(10)
);
SET datestyle = 'ISO,DMY';
COPY "96"(
id, "Avgjørelse"
) FROM STDIN;
1	ja
2	nei
3	vet ikke
\.
-- COMMIT;
