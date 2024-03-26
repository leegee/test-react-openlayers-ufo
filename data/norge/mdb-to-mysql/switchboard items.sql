DROP TABLE `switchboard items`;
CREATE TABLE `switchboard items` (
  switchboardid INTEGER,
  itemnumber SMALLINT,
  itemtext VARCHAR(255),
  command SMALLINT,
  argument VARCHAR(255)
);
INSERT INTO `switchboard items`(switchboardid, itemnumber, itemtext, command, argument) VALUES (1, 0, 'Hovedsentralbord', null, 'Standard');
INSERT INTO `switchboard items`(switchboardid, itemnumber, itemtext, command, argument) VALUES (1, 1, 'Se på data i databasen', 3, 'test');
INSERT INTO `switchboard items`(switchboardid, itemnumber, itemtext, command, argument) VALUES (1, 2, 'Legge til data i databasen', 2, 'test');
INSERT INTO `switchboard items`(switchboardid, itemnumber, itemtext, command, argument) VALUES (1, 3, 'Avslutt', 6, '');
COMMIT;
