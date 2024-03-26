DROP TABLE `rapportstatus`;
CREATE TABLE `rapportstatus` (
  rapstatnr INTEGER,
  rapportstatus VARCHAR(50)
);
INSERT INTO `rapportstatus`(rapstatnr, rapportstatus) VALUES (1, 'Ny');
INSERT INTO `rapportstatus`(rapstatnr, rapportstatus) VALUES (2, 'Under Arbeid');
INSERT INTO `rapportstatus`(rapstatnr, rapportstatus) VALUES (3, 'Ferdig behandlet');
COMMIT;
