DROP TABLE IF EXISTS "132";
CREATE TABLE "132" (
  id INTEGER,
  "Avgjørelse" VARCHAR(10)
);
SET datestyle = 'ISO,DMY';
COPY "132"(
id, "Avgjørelse"
) FROM STDIN;
1	ja
2	nei
3	vet ikke
\.
-- COMMIT;
