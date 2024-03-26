DROP TABLE IF EXISTS "104";
CREATE TABLE "104" (
  id INTEGER,
  "Observert med/gjennom(104)" VARCHAR(25)
);
SET datestyle = 'ISO,DMY';
COPY "104"(
id, "Observert med/gjennom(104)"
) FROM STDIN;
1	Blotte øyet
2	Vindusglass
3	Frontrute
4	Briller
5	Polaroid briller
6	Polaroid solbriller
7	Andre briller
8	Kikkert(hvor kraftig)
9	Teleskop(hvor kraftig)
10	Annet
\.
-- COMMIT;
