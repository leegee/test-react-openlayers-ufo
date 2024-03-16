DROP TABLE IF EXISTS ukedag;
CREATE TABLE ukedag (
  ukedag VARCHAR(15)
);
SET datestyle = 'ISO,DMY';
COPY ukedag(
ukedag
) FROM STDIN;
Fredag
Lørdag
Mandag
Onsdag
Søndag
Tirsdag
Torsdag
\.
-- COMMIT;
