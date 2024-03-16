DROP TABLE IF EXISTS "98";
CREATE TABLE "98" (
  id INTEGER,
  "Avgjørelse" VARCHAR(10)
);
SET datestyle = 'ISO,DMY';
COPY "98"(
id, "Avgjørelse"
) FROM STDIN;
1	ja
2	nei
3	vet ikke
\.
-- COMMIT;
