DROP TABLE IF EXISTS "switchboard items";
CREATE TABLE "switchboard items" (
  switchboardid INTEGER,
  itemnumber SMALLINT,
  itemtext VARCHAR(255),
  command SMALLINT,
  argument VARCHAR(255)
);
SET datestyle = 'ISO,DMY';
COPY "switchboard items"(
switchboardid, itemnumber, itemtext, command, argument
) FROM STDIN;
1	0	Hovedsentralbord	\N	Standard
1	1	Se på data i databasen	3	test
1	2	Legge til data i databasen	2	test
1	3	Avslutt	6	
\.
-- COMMIT;
