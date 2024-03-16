DROP TABLE IF EXISTS fylke;
CREATE TABLE fylke (
  id INTEGER,
  fylke VARCHAR(255),
  avd INTEGER
);
SET datestyle = 'ISO,DMY';
COPY fylke(
id, fylke, avd
) FROM STDIN;
1	Aust-Agder	3
2	Akershus	1
3	Buskerud	1
4	Finnmark	5
5	Hedmark	1
6	Hordaland	2
7	Møre og Romsdal	2
8	Nord-Trøndelag	4
9	Nordland	5
10	Oppland	6
11	Oslo	1
13	Rogaland	2
14	Sogn og Fjordane	2
17	Sør-Trøndelag	4
18	Telemark	1
19	Troms	5
23	Vest-Agder	3
24	Vestfold	1
25	Østfold	1
26	Jan Mayen	5
27	Svalbard	5
28	Ukjent	4
\.
-- COMMIT;
