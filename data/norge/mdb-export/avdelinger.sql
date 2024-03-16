DROP TABLE IF EXISTS avdelinger;
CREATE TABLE avdelinger (
  avdnr INTEGER,
  avdeling VARCHAR(50),
  email VARCHAR(40)
);
SET datestyle = 'ISO,DMY';
COPY avdelinger(
avdnr, avdeling, email
) FROM STDIN;
1	UFO-NORGE ØST	stein@ufo.no
2	UFO-NORGE VEST	ottar@ufo.no
3	UFO-NORGE SØR	anders@ufo.no
4	UFO-NORGE MIDT	arnulf@ufo.no
5	UFO-NORGE NORD	leif.solhaug@ufo.no
6	RAPPORTSENTRALEN	arnulf@ufo.no
\.
-- COMMIT;
