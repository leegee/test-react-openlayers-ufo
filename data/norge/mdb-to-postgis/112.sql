DROP TABLE IF EXISTS "112";
CREATE TABLE "112" (
  id INTEGER,
  "Avgjørelse" VARCHAR(10)
);
SET datestyle = 'ISO,DMY';
COPY "112"(
id, "Avgjørelse"
) FROM STDIN;
1	ja
2	nei
3	vet ikke
\.
-- COMMIT;
