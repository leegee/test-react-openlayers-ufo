DROP TABLE `fylke`;
CREATE TABLE `fylke` (
  id INTEGER,
  fylke VARCHAR(255),
  avd INTEGER
);
INSERT INTO `fylke`(id, fylke, avd) VALUES (1, 'Aust-Agder', 3);
INSERT INTO `fylke`(id, fylke, avd) VALUES (2, 'Akershus', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (3, 'Buskerud', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (4, 'Finnmark', 5);
INSERT INTO `fylke`(id, fylke, avd) VALUES (5, 'Hedmark', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (6, 'Hordaland', 2);
INSERT INTO `fylke`(id, fylke, avd) VALUES (7, 'Møre og Romsdal', 2);
INSERT INTO `fylke`(id, fylke, avd) VALUES (8, 'Nord-Trøndelag', 4);
INSERT INTO `fylke`(id, fylke, avd) VALUES (9, 'Nordland', 5);
INSERT INTO `fylke`(id, fylke, avd) VALUES (10, 'Oppland', 6);
INSERT INTO `fylke`(id, fylke, avd) VALUES (11, 'Oslo', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (13, 'Rogaland', 2);
INSERT INTO `fylke`(id, fylke, avd) VALUES (14, 'Sogn og Fjordane', 2);
INSERT INTO `fylke`(id, fylke, avd) VALUES (17, 'Sør-Trøndelag', 4);
INSERT INTO `fylke`(id, fylke, avd) VALUES (18, 'Telemark', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (19, 'Troms', 5);
INSERT INTO `fylke`(id, fylke, avd) VALUES (23, 'Vest-Agder', 3);
INSERT INTO `fylke`(id, fylke, avd) VALUES (24, 'Vestfold', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (25, 'Østfold', 1);
INSERT INTO `fylke`(id, fylke, avd) VALUES (26, 'Jan Mayen', 5);
INSERT INTO `fylke`(id, fylke, avd) VALUES (27, 'Svalbard', 5);
INSERT INTO `fylke`(id, fylke, avd) VALUES (28, 'Ukjent', 4);
COMMIT;
