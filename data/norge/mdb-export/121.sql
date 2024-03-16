DROP TABLE IF EXISTS "121";
CREATE TABLE "121" (
  id INTEGER,
  "Himmelen var ved observasjonen(121)" VARCHAR(25)
);
SET datestyle = 'ISO,DMY';
COPY "121"(
id, "Himmelen var ved observasjonen(121)"
) FROM STDIN;
1	Klar
2	Lettskyet
3	Tåket
4	Vet ikke
5	Annet
\.
-- COMMIT;
