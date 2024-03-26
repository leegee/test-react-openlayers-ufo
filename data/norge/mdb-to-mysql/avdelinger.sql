DROP TABLE `avdelinger`;
CREATE TABLE `avdelinger` (
  avdnr INTEGER,
  avdeling VARCHAR(50),
  email VARCHAR(40)
);
INSERT INTO `avdelinger`(avdnr, avdeling, email) VALUES (1, 'UFO-NORGE ØST', 'stein@ufo.no');
INSERT INTO `avdelinger`(avdnr, avdeling, email) VALUES (2, 'UFO-NORGE VEST', 'ottar@ufo.no');
INSERT INTO `avdelinger`(avdnr, avdeling, email) VALUES (3, 'UFO-NORGE SØR', 'anders@ufo.no');
INSERT INTO `avdelinger`(avdnr, avdeling, email) VALUES (4, 'UFO-NORGE MIDT', 'arnulf@ufo.no');
INSERT INTO `avdelinger`(avdnr, avdeling, email) VALUES (5, 'UFO-NORGE NORD', 'leif.solhaug@ufo.no');
INSERT INTO `avdelinger`(avdnr, avdeling, email) VALUES (6, 'RAPPORTSENTRALEN', 'arnulf@ufo.no');
COMMIT;
