DROP TABLE IF EXISTS rapportstatus;
CREATE TABLE rapportstatus (
  rapstatnr INTEGER,
  rapportstatus VARCHAR(50)
);
SET datestyle = 'ISO,DMY';
COPY rapportstatus(
rapstatnr, rapportstatus
) FROM STDIN;
1	Ny
2	Under Arbeid
3	Ferdig behandlet
\.
-- COMMIT;
