DROP TABLE IF EXISTS "97";
CREATE TABLE "97" (
  id INTEGER,
  "Avgjørelse" VARCHAR(10)
);
SET datestyle = 'ISO,DMY';
COPY "97"(
id, "Avgjørelse"
) FROM STDIN;
1	ja
2	nei
3	vet ikke
\.
-- COMMIT;
