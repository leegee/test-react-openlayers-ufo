\set ON_ERROR_STOP on
SET client_encoding TO 'UTF8';

DROP TABLE IF EXISTS sightings;

CREATE TABLE sightings AS SELECT * FROM hovedtabell;

ALTER TABLE sightings 
 ADD COLUMN datetime_original VARCHAR(20),  
 ADD COLUMN datetime TIMESTAMP
;

ALTER TABLE sightings ADD COLUMN country VARCHAR(2);
UPDATE sightings SET country='no';

-- Create a auto-incrementing primary key from 'datarapp nr':
ALTER TABLE sightings DROP CONSTRAINT IF EXISTS sightings_pkey;
ALTER TABLE sightings RENAME COLUMN "Datarapp nr" TO id;
ALTER TABLE sightings ALTER COLUMN id TYPE SERIAL;
ALTER TABLE sightings ADD PRIMARY KEY (id);
CREATE SEQUENCE sightings_id_seq OWNED BY sightings.id;
ALTER TABLE sightings ALTER COLUMN id SET DEFAULT nextval('sightings_id_seq');

ALTER TABLE sightings RENAME COLUMN "Beskrivelse(21)" TO report_text;
ALTER TABLE sightings RENAME COLUMN observasjonssted TO location_text;

ALTER TABLE sightings ADD COLUMN source VARCHAR(25) CHECK (source IN ('mufon-kaggle', 'norge-ufo'));
UPDATE sightings SET source = 'norge-ufo';

ALTER TABLE sightings ADD COLUMN state VARCHAR(255);
UPDATE sightings
SET state = fylke.fylke
FROM fylke
WHERE sightings.fylke = fylke.id;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_report_text_trgm ON sightings USING gin (report_text gin_trgm_ops);
CREATE INDEX idx_location_text_trgm ON sightings USING gin (location_text gin_trgm_ops);

-- CREATE INDEX full_text_index_report_text ON sightings USING GIN (to_tsvector('english', report_text));
-- CREATE INDEX full_text_index_report_text_norwegian ON sightings USING GIN (to_tsvector('norwegian', report_text));

-- Observation date to datetime:

UPDATE sightings SET 

-- todo: also set a flag for inaccurate date
UPDATE sightings SET "Obs måned" = '01' WHERE "Obs måned" IS NULL OR "Obs måned" = '1';
UPDATE sightings SET "observasjonsdato" = '01' WHERE "observasjonsdato" IS NULL OR "observasjonsdato" = '13';
UPDATE sightings SET "obs år" = REPLACE("obs år", '?', '0');

UPDATE sightings
SET
 datetime_original = "obs år" || '-' || "Obs måned" || '-' || "observasjonsdato",
 datetime = CASE 
  WHEN "obs år" IS NOT NULL AND "Obs måned" IS NOT NULL AND observasjonsdato IS NOT NULL THEN
TO_DATE(
 CONCAT(
  COALESCE("obs år", '0000'),
  '-',
  CASE WHEN "Obs måned"::integer > 12 THEN '01' ELSE COALESCE(NULLIF("Obs måned", '?'), '01') END,
  '-',
  COALESCE(NULLIF(observasjonsdato, '?'), '01')
 ),
 'YYYY-MM-DD'
)
  ELSE NULL
 END,
 datetime_invalid = CASE 
  WHEN datetime IS NULL THEN
true
  ELSE
false
  END;


UPDATE sightings
SET datetime = 
 CASE 
  WHEN datetime = '0001-01-01 00:00:00' THEN NULL
  WHEN datetime = '0960-06-30 00:00:00' THEN '1960-06-30 00:00:00'
  ELSE datetime
 END;

UPDATE sightings SET start_time = '12:00' WHERE start_time = 'Middag';
UPDATE sightings SET start_time = REPLACE(REPLACE(start_time, 'ca. ', ''), 'ca ', '') WHERE start_time LIKE 'ca.%' OR start_time LIKE 'ca %';
UPDATE sightings SET start_time = '18.15' WHERE start_time = '118.15';
UPDATE sightings SET start_time = '21.00' WHERE start_time = '21-22.00';
UPDATE sightings SET start_time = '02.50' WHERE start_time = '02.50-55';
UPDATE sightings SET start_time = REPLACE(start_time, '.', ':');

UPDATE sightings SET datetime = datetime::date + (start_time::time);


-- UPDATE sightings SET datetime = datetime + start_time::time WHERE start_time IS NOT NULL AND datetime IS NOT NULL;

-- County of sighting: Key (fylke)=(20) is not present in table "fylke". Vest-Agder, Troms, and others are absent.
-- So, skip for now.
-- ALTER TABLE fylke ADD CONSTRAINT pk_fylke PRIMARY KEY (id);
-- ALTER TABLE sightings ADD CONSTRAINT fk_fylke FOREIGN KEY (Fylke) REFERENCES fylke(id);

-- ALTER TABLE sightings DROP COLUMN "Annet (4,1)"; -- it is empty
-- ALTER TABLE sightings RENAME COLUMN annet61 TO weather_other;


ALTER TABLE Rapportstatus RENAME TO report_status;
ALTER TABLE report_status RENAME COLUMN rapportstatus TO report_status;
ALTER TABLE report_status RENAME COLUMN rapstatnr TO id;
ALTER TABLE sightings RENAME COLUMN rapportstatus TO report_status;


-- Joined tables: add some English, make real joins
-- 104 "Fenomenet ble observert med/gjennom(104)" --> "observed_via" 
ALTER TABLE sightings ADD COLUMN "observed_via_id" VARCHAR(50);
UPDATE sightings SET observed_via = "Fenomenet ble observert med/gjennom(104)";
ALTER TABLE sightings ALTER COLUMN observed_via_id TYPE INTEGER USING observed_via_id::INTEGER;
ALTER TABLE "104" RENAME TO observed_via;
ALTER TABLE observed_via ADD CONSTRAINT observed_via_id_unique UNIQUE (id);
ALTER TABLE observed_via ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
INSERT INTO observed_via (id, "Observert med/gjennom(104)") VALUES (0, 'Not specified');
ALTER TABLE observed_via RENAME COLUMN "Observert med/gjennom(104)" TO observed_via;
ALTER TABLE sightings ADD CONSTRAINT fk_observed_via_id FOREIGN KEY ("observed_via_id") REFERENCES "observed_via" (id);
-- SELECT sightings.observed_via_id, observed_via.* FROM sightings JOIN observed_via ON sightings.observed_via_id = observed_via.id;


-- 112 "Fysiske pÕvirkninger(112)" --> physical_effects -> yes_no_dontknow.id
-- todo: associated free-text col
ALTER TABLE sightings RENAME COLUMN "Fysiske pÕvirkninger(112)" TO physical_effects;
ALTER TABLE sightings ALTER COLUMN physical_effects TYPE INTEGER USING physical_effects::INTEGER;
UPDATE sightings SET physical_effects=0 WHERE  physical_effects IS NULL;

ALTER TABLE "112" RENAME TO yes_no_dontknow;
ALTER TABLE yes_no_dontknow ADD CONSTRAINT yes_no_dontknow_id_unique UNIQUE (id);
ALTER TABLE yes_no_dontknow ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE yes_no_dontknow RENAME COLUMN "Avgj°relse" TO "yes_no_dontknow";
ALTER TABLE yes_no_dontknow ALTER COLUMN yes_no_dontknow TYPE VARCHAR(20);
INSERT INTO yes_no_dontknow (id, "yes_no_dontknow") VALUES (0, 'Not specified');
ALTER TABLE sightings ADD CONSTRAINT fk_physical_effects FOREIGN KEY ("physical_effects") REFERENCES "yes_no_dontknow" (id);
-- SELECT sightings.physical_effects, yes_no_dontknow.* FROM sightings JOIN yes_no_dontknow ON sightings.physical_effects = yes_no_dontknow.id;

-- Table 132 is the same as 112, a ja/nei/ikke vet dictionary
ALTER TABLE sightings RENAME COLUMN "Hvis ja, nÕr(132)" TO "prior_sightings_date";
-- utf8 ALTER TABLE sightings RENAME COLUMN "Hvis ja, når(132)" TO "prior_sightings_date";
ALTER TABLE sightings RENAME COLUMN "Hvis ja, hvem rapporterte de til(132)" TO "prior_sightings_reported_to";

-- Table 96, 97, 98 are also the same as 112, a ja/nei/ikke vet dictionary
ALTER TABLE sightings RENAME COLUMN "Kursendring(96)" TO course_changed;
ALTER TABLE sightings ALTER COLUMN course_changed TYPE INTEGER;

-- ALTER TABLE sightings RENAME COLUMN "Høydeendring(97)" TO altitude_changed;
ALTER TABLE sightings RENAME COLUMN "H°ydeendring(97)" TO altitude_changed;
ALTER TABLE sightings ALTER COLUMN altitude_changed TYPE INTEGER;

ALTER TABLE sightings RENAME COLUMN "Hastighetsendring(98)" TO speed_changed;
ALTER TABLE sightings ALTER COLUMN speed_changed TYPE INTEGER;

ALTER TABLE sightings RENAME COLUMN "AnslÕtt hastighet(98)" TO speed_estimate;

ALTER TABLE sightings RENAME COLUMN "Har de tidligere observert/rapportert UFO(132)" TO prior_sightings;
ALTER TABLE sightings ADD CONSTRAINT fk_prior_sightings_id FOREIGN KEY ("prior_sightings") REFERENCES "yes_no_dontknow" (id);


-- 121 "Himmelen var ved observasjonen(121)" --> sky_condition
ALTER TABLE sightings ADD COLUMN sky_condition_id VARCHAR(20);
UPDATE sightings SET sky_condition_id = "Himmelen var ved observasjonen(121)";
ALTER TABLE sightings ALTER COLUMN sky_condition_id TYPE INTEGER USING sky_condition_id::INTEGER;
ALTER TABLE "121" RENAME TO sky_condition;
ALTER TABLE sky_condition ADD CONSTRAINT sky_condition_unique UNIQUE (id);
ALTER TABLE sky_condition ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE sky_condition RENAME COLUMN "Himmelen var ved observasjonen(121)" TO "sky_condition";
ALTER TABLE sky_condition ALTER COLUMN sky_condition TYPE VARCHAR(20);
INSERT INTO sky_condition (id, "sky_condition") VALUES (0, 'Not specified');
ALTER TABLE sightings ADD CONSTRAINT fk_sky_condition_id FOREIGN KEY (sky_condition_id) REFERENCES "sky_condition" (id);
ALTER TABLE sightings DROP COLUMN "Himmelen var ved observasjonen(121)";
-- SELECT sightings.sky_condition_id, sky_condition.* FROM sightings JOIN sky_condition ON sightings.sky_condition_id = sky_condition.id;

-- 127 "Solen befant seg(12,7)" --> sun_position
ALTER TABLE sightings ADD COLUMN sun_position_id VARCHAR(20);
UPDATE sightings SET sun_position_id = "Solen befant seg(12,7)";
ALTER TABLE sightings ALTER COLUMN sun_position_id TYPE INTEGER USING sun_position_id::INTEGER;
ALTER TABLE "127" RENAME TO sun_position;
ALTER TABLE sun_position ADD COLUMN id INTEGER;
ALTER TABLE sun_position ADD CONSTRAINT sun_position_unique UNIQUE (id);
ALTER TABLE sun_position ALTER COLUMN id TYPE INTEGER USING id::INTEGER;
ALTER TABLE sun_position RENAME COLUMN "Solen befant seg(127)" TO "sun_position";
ALTER TABLE sun_position ALTER COLUMN sun_position TYPE VARCHAR(20);
INSERT INTO sun_position (id, sun_position) VALUES (0, 'Not specified');
UPDATE sun_position SET id=1 WHERE sun_position='Annet';
UPDATE sun_position SET id=2 WHERE sun_position='Bak';
UPDATE sun_position SET id=3 WHERE sun_position='Foran';
UPDATE sun_position SET id=4 WHERE sun_position='Ikke oppe';
UPDATE sun_position SET id=5 WHERE sun_position='Ikke synlig';
UPDATE sun_position SET id=6 WHERE sun_position='Rett over';
UPDATE sun_position SET id=7 WHERE sun_position='Til h°yre';
UPDATE sun_position SET id=8 WHERE sun_position='Til venstre';
UPDATE sun_position SET id=9 WHERE sun_position='Vet ikke';
ALTER TABLE sightings ADD CONSTRAINT fk_sun_position_id FOREIGN KEY (sun_position_id) REFERENCES "sun_position" (id);
-- SELECT sightings.sun_position_id, sun_position.* FROM sightings JOIN sun_position ON sightings.sun_position_id = sun_position.id;

-- SELECT sightings.Fylke, fylke.* FROM sightings JOIN fylke ON sightings.Fylke = fylke.id;


ALTER TABLE sightings RENAME COLUMN "saksbehandler" to case_handler;

-- empty columns for duration fo sighting, presumably hours, minutes, seconds
ALTER TABLE sightings DROP COLUMN "Hvor lenge iakttok(3,5,1)";
ALTER TABLE sightings DROP COLUMN "Hvor lenge iakttok(3,5,2)";
ALTER TABLE sightings DROP COLUMN "Hvor lenge iakttok(3,5,3)";

ALTER TABLE sightings RENAME COLUMN "annet62" TO "colour";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(63)" TO "if_so_which_colour_63";
ALTER TABLE sightings RENAME COLUMN "Hvis ja, hvilke fargeforandringer(64)" TO "which_colour_changed";
ALTER TABLE sightings RENAME COLUMN "Annet(65)" TO "light_desc_other";
ALTER TABLE sightings RENAME COLUMN "Annet(66)" TO "lightbeam_desc_other";
ALTER TABLE sightings RENAME COLUMN "Annet(71)" TO "sound_other";
ALTER TABLE sightings RENAME COLUMN "Hvis ja, hvilke lydforandringer(72)" TO "sound_change_desc";
ALTER TABLE sightings RENAME COLUMN "Annet(81)" TO "size_other";
ALTER TABLE sightings RENAME COLUMN "Antall cm pÕ linjalen(82)" TO "size_cm";
ALTER TABLE sightings RENAME COLUMN "Avgrenset form(8,3)" TO "bounds";
ALTER TABLE sightings RENAME COLUMN "bounds" TO "shape";
ALTER TABLE sightings RENAME COLUMN "Fenomenets st°rrelse i meter(84)" TO "size_m";
ALTER TABLE sightings RENAME COLUMN "Nedsatt syn(8,5)" TO "imparied_vision";
ALTER TABLE sightings RENAME COLUMN "Fargeblind(8,6)" TO "colour_blind";
ALTER TABLE sightings RENAME COLUMN "Fenomenet beveget seg(93)" TO "movement";
ALTER TABLE sightings RENAME COLUMN "Avstand til fenomen i meter(99)" TO "distance_m";
ALTER TABLE sightings RENAME COLUMN "Hvordan forsvant fenomenet(102)" TO "disappearance_desc";
ALTER TABLE sightings RENAME COLUMN "Passerte fenomenet foran/bak noe(103)" TO "passed_by_something";
ALTER TABLE sightings RENAME COLUMN "Passerte fenomenet foran/bak noe(10,3)" TO "passed_by_something_10_3";
ALTER TABLE sightings RENAME COLUMN "Kikkert_X_(10,4,8)" TO "binoculars_magnification";
ALTER TABLE sightings RENAME COLUMN "Teleskop_X_(10,4,9)" TO "telescope_magnification";
ALTER TABLE sightings RENAME COLUMN "Merket de psykiske pÕvirkninger under observasjonen(113)" TO "psychological_effects_during";
ALTER TABLE sightings RENAME COLUMN "Merket de psykiske pÕvirkninger etter observasjonen(113)" TO "psychological_effects_after";
ALTER TABLE sightings RENAME COLUMN "Hvis ja, beskriv dem(113)" TO "psychological_effects_desc";
ALTER TABLE sightings RENAME COLUMN "Temperatur ca i gr C(125)" TO "centigrade";
ALTER TABLE sightings RENAME COLUMN "Ukedag(31)" TO "weekday";
ALTER TABLE sightings RENAME COLUMN "Obs  startet kl (32)" TO "start_time";
ALTER TABLE sightings RENAME COLUMN "Hvor lenge iakttok?(35)" TO "duration";
ALTER TABLE sightings RENAME COLUMN "Hovedobservat°rens alder" TO "observer_age";
ALTER TABLE sightings RENAME COLUMN "Antall observat°rer" TO "other_observers";

ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,1)" TO "illumination_661";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,2)" TO "illumination_662";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,3)" TO "illumination_663";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,4)" TO "illumination_664";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,5)" TO "illumination_665";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,6)" TO "illumination_666";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,7)" TO "illumination_667";
ALTER TABLE sightings RENAME COLUMN "LysstrÕlingen var(6,6,8)" TO "illumination_668";

ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,1)" TO "colour_621";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,2)" TO "colour_622";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,3)" TO "colour_623";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,4)" TO "colour_624";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,5)" TO "colour_625";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,6)" TO "colour_626";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,7)" TO "colour_627";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,8)" TO "colour_628";
ALTER TABLE sightings RENAME COLUMN "Farge pÕ fenomenet(6,2,9)" TO "colour_629";

ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,1)" TO "if_so_which_colour_6321";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,2)" TO "if_so_which_colour_6322";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,3)" TO "if_so_which_colour_6323";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,4)" TO "if_so_which_colour_6324";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,5)" TO "if_so_which_colour_6325";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,6)" TO "if_so_which_colour_6326";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,7)" TO "if_so_which_colour_6327";
ALTER TABLE sightings RENAME COLUMN "I sÕ fall hvilken farge(6,3,2,8)" TO "if_so_which_colour_6328";

ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,1)" TO "initial_altitude_941";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,2)" TO "initial_altitude_942";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,3)" TO "initial_altitude_943";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,4)" TO "initial_altitude_944";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,5)" TO "initial_altitude_945";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,6)" TO "initial_altitude_946";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved oppdagelsen(9,4,7)" TO "initial_altitude_947";

ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,1)" TO "final_altitude_951";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,2)" TO "final_altitude_952";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,3)" TO "final_altitude_953";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,4)" TO "final_altitude_954";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,5)" TO "final_altitude_955";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,6)" TO "final_altitude_956";
ALTER TABLE sightings RENAME COLUMN "H°yde pÕ himmelen ved slutt pÕ observasjon(9,5,7)" TO "final_altitude_957";

ALTER TABLE sightings DROP COLUMN "├Ñr";
ALTER TABLE sightings DROP COLUMN "Obs m├Ñned";

ALTER TABLE sightings RENAME COLUMN "observasjonsdato" TO "day_of_month";
ALTER TABLE sightings RENAME COLUMN "Obs mÕned" TO "month";
ALTER TABLE sightings RENAME COLUMN "obs Õr" TO "year";

ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(104)" TO "observed_with_through_104";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,1)" TO "observed_with_through_10_4_1";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,2)" TO "observed_with_through_10_4_2";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,3)" TO "observed_with_through_10_4_3";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,4)" TO "observed_with_through_10_4_4";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,5)" TO "observed_with_through_10_4_5";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,6)" TO "observed_with_through_10_4_6";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,7)" TO "observed_with_through_10_4_7";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,8)" TO "observed_with_through_10_4_8";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,9)" TO "observed_with_through_10_4_9";
ALTER TABLE sightings RENAME COLUMN "Fenomenet ble observert med/gjennom(10,4,10)" TO "observed_with_through_10_4_10";

ALTER TABLE sightings RENAME COLUMN "Ble fenomenet fotografert(111)" TO "photographed";


ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,1)" TO "weather_12_2_1";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,2)" TO "weather_12_2_2";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,3)" TO "weather_12_2_3";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,4)" TO "weather_12_2_4";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,5)" TO "weather_12_2_5";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,6)" TO "weather_12_2_6";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,7)" TO "weather_12_2_7";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,8)" TO "weather_12_2_8";
ALTER TABLE sightings RENAME COLUMN "Vµret(12,2,9)" TO "weather_12_2_9";
ALTER TABLE sightings RENAME COLUMN "Annet(122)" TO "weather";

ALTER TABLE sightings RENAME COLUMN "Hvor stort var fenomenet(8,1,1)" TO "size_8_1_1";
ALTER TABLE sightings RENAME COLUMN "Hvor stort var fenomenet(8,1,2)" TO "size_8_1_2";
ALTER TABLE sightings RENAME COLUMN "Hvor stort var fenomenet(8,1,3)" TO "size_8_1_3";
ALTER TABLE sightings RENAME COLUMN "Hvor stort var fenomenet(8,1,4)" TO "size_8_1_4";
ALTER TABLE sightings RENAME COLUMN "Hvor stort var fenomenet(8,1,5)" TO "size_8_1_5";
ALTER TABLE sightings RENAME COLUMN "Hvor stort var fenomenet(8,1,6)" TO "size_8_1_6";
ALTER TABLE sightings RENAME COLUMN "Annet(81)" TO "size";

ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,1)" TO "sound_7_1_1";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,2)" TO "sound_7_1_2";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,3)" TO "sound_7_1_3";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,4)" TO "sound_7_1_4";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,5)" TO "sound_7_1_5";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,6)" TO "sound_7_1_6";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,7)" TO "sound_7_1_7";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,8)" TO "sound_7_1_8";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,9)" TO "sound_7_1_9";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,10)" TO "sound_7_1_10";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,11)" TO "sound_7_1_11";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,12)" TO "sound_7_1_12";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,13)" TO "sound_7_1_13";
ALTER TABLE sightings RENAME COLUMN "Fenomenets lyd(7,1,14)" TO "sound_7_1_14";

ALTER TABLE sightings RENAME COLUMN "Hvis ja, hvilke fargeforandringer(64)" TO "colour_change";
ALTER TABLE sightings RENAME COLUMN "Fargeforandringer(6,4,1)" TO "colour_change_6_4_1";
ALTER TABLE sightings RENAME COLUMN "Fargeforandringer(6,4,2)" TO "colour_change_6_4_2";
ALTER TABLE sightings RENAME COLUMN "Fargeforandringer(6,4,3)" TO "colour_change_6_4_3";

ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,1)" TO "where_found_4_1_1";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,2)" TO "where_found_4_1_2";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,3)" TO "where_found_4_1_3";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,4)" TO "where_found_4_1_4";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,5)" TO "where_found_4_1_5";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,6)" TO "where_found_4_1_6";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,7)" TO "where_found_4_1_7";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,8)" TO "where_found_4_1_8";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,9)" TO "where_found_4_1_9";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,10)" TO "where_found_4_1_10";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,11)" TO "where_found_4_1_11";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,12)" TO "where_found_4_1_12";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,13)" TO "where_found_4_1_13";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,14)" TO "where_found_4_1_14";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,15)" TO "where_found_4_1_15";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,16)" TO "where_found_4_1_16";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,17)" TO "where_found_4_1_17";
ALTER TABLE sightings RENAME COLUMN "Hvor befant de dem(4,1,18)" TO "where_found_4_1_18";

ALTER TABLE sightings RENAME COLUMN "Var fenomenet(6,1,1)" to "var_fenomenet_6_1_1";
ALTER TABLE sightings RENAME COLUMN "Var fenomenet(6,1,2)" to "var_fenomenet_6_1_2";
ALTER TABLE sightings RENAME COLUMN "Var fenomenet(6,1,3)" to "var_fenomenet_6_1_3";
ALTER TABLE sightings RENAME COLUMN "Var fenomenet(6,1,4)" to "var_fenomenet_6_1_4";

ALTER TABLE sightings RENAME COLUMN "Hadde fenomenet(6,3,1,1)" TO "had_6_3_1_1";
ALTER TABLE sightings RENAME COLUMN "Hadde fenomenet(6,3,1,2)" TO "had_6_3_1_2";
ALTER TABLE sightings RENAME COLUMN "Hadde fenomenet(6,3,1,3)" TO "had_6_3_1_3";


ALTER TABLE sightings RENAME COLUMN "Hvor kraftig(6,5,1)" TO "how_powerful_6_5_1";
ALTER TABLE sightings RENAME COLUMN "Hvor kraftig(6,5,2)" TO "how_powerful_6_5_2";
ALTER TABLE sightings RENAME COLUMN "Hvor kraftig(6,5,3)" TO "how_powerful_6_5_3";
ALTER TABLE sightings RENAME COLUMN "Hvor kraftig(6,5,4)" TO "how_powerful_6_5_4";
ALTER TABLE sightings RENAME COLUMN "Hvor kraftig(6,5,5)" TO "how_powerful_6_5_5";
ALTER TABLE sightings RENAME COLUMN "Hvor kraftig(6,5,6)" TO "how_powerful_6_5_6";

ALTER TABLE sightings RENAME COLUMN "Forandringer i lyden(7,2,1)" TO "sound_change_7_2_1";
ALTER TABLE sightings RENAME COLUMN "Forandringer i lyden(7,2,2)" TO "sound_change_7_2_2";
ALTER TABLE sightings RENAME COLUMN "Forandringer i lyden(7,2,3)" TO "sound_change_7_2_3";

ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,1)" TO "initial_celestial_direction_9_1_1";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,2)" TO "initial_celestial_direction_9_1_2";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,3)" TO "initial_celestial_direction_9_1_3";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,4)" TO "initial_celestial_direction_9_1_4";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,5)" TO "initial_celestial_direction_9_1_5";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,6)" TO "initial_celestial_direction_9_1_6";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,7)" TO "initial_celestial_direction_9_1_7";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,8)" TO "initial_celestial_direction_9_1_8";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved oppdagelse(9,1,9)" TO "initial_celestial_direction_9_1_9";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,1)" TO "final_celestial_direction_9_2_1";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,2)" TO "final_celestial_direction_9_2_2";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,3)" TO "final_celestial_direction_9_2_3";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,4)" TO "final_celestial_direction_9_2_4";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,5)" TO "final_celestial_direction_9_2_5";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,6)" TO "final_celestial_direction_9_2_6";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,7)" TO "final_celestial_direction_9_2_7";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,8)" TO "final_celestial_direction_9_2_8";
ALTER TABLE sightings RENAME COLUMN "Himmelretning ved slutt pÕ observasjon(9,2,9)" TO "final_celestial_direction_9_2_9";

ALTER TABLE sightings RENAME COLUMN "Fenomenet beveget seg(9,3,1)" TO "movement_9_3_1";
ALTER TABLE sightings RENAME COLUMN "Fenomenet beveget seg(9,3,2)" TO "movement_9_3_2";
ALTER TABLE sightings RENAME COLUMN "Fenomenet beveget seg(9,3,3)" TO "movement_9_3_3";
ALTER TABLE sightings RENAME COLUMN "Fenomenet beveget seg(9,3,4)" TO "movement_9_3_4";

ALTER TABLE sightings RENAME COLUMN "Hvor mange fenomener(51)" TO "number_of_objects";

ALTER TABLE sightings RENAME COLUMN "Konfidensielt(143)" TO "confidential";

ALTER TABLE sightings RENAME COLUMN "Vindstyrken(12,3,1)" TO "wind_force_12_3_1";
ALTER TABLE sightings RENAME COLUMN "Vindstyrken(12,3,2)" TO "wind_force_12_3_2";
ALTER TABLE sightings RENAME COLUMN "Vindstyrken(12,3,3)" TO "wind_force_12_3_3";
ALTER TABLE sightings RENAME COLUMN "Vindstyrken(12,3,4)" TO "wind_force_12_3_4";
ALTER TABLE sightings RENAME COLUMN "Vindstyrken(12,3,5)" TO "wind_force_12_3_5";
ALTER TABLE sightings RENAME COLUMN "Vindstyrken(12,3,6)" TO "wind_force_12_3_6";
ALTER TABLE sightings RENAME COLUMN "Annet(123)" TO "wind_other";

ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,1)" TO "wind_direction_12_4_1";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,2)" TO "wind_direction_12_4_2";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,3)" TO "wind_direction_12_4_3";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,4)" TO "wind_direction_12_4_4";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,5)" TO "wind_direction_12_4_5";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,6)" TO "wind_direction_12_4_6";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,7)" TO "wind_direction_12_4_7";
ALTER TABLE sightings RENAME COLUMN "Vindretning(12,4,8)" TO "wind_direction_12_4_8";

ALTER TABLE sightings RENAME COLUMN "Det var(12,6)" TO "det_var_12_6";
ALTER TABLE sightings RENAME COLUMN "Annet(12,6)" TO "annet_12_6";
ALTER TABLE sightings RENAME COLUMN "Annet(93)" TO "movement_other";

ALTER TABLE sightings RENAME COLUMN "Hvordan forsvant fenomenet(10,2,1)" TO "disappearance_10_2_1";
ALTER TABLE sightings RENAME COLUMN "Hvordan forsvant fenomenet(10,2,2)" TO "disappearance_10_2_2";

ALTER TABLE sightings RENAME COLUMN "Hvis ja, av hvem(111)" TO "av_hvem_111";
ALTER TABLE sightings RENAME COLUMN "Hvis ja, hvilke(112)" TO "hvilke_112";

ALTER TABLE sightings RENAME COLUMN "Annet(121)" TO "sky_condition_other";
ALTER TABLE sightings RENAME COLUMN "Har de tidligere vµrt utsatt for fenomener(133)" TO "prior_witness";

ALTER TABLE sightings RENAME COLUMN "Antall observat°rer" TO "number_of_observers";
ALTER TABLE sightings RENAME COLUMN "Solen befant seg(127)" TO "sunlight";
ALTER TABLE sightings RENAME COLUMN "Solen befant seg(12,7)" TO "sunlight_12_7";

ALTER TABLE sightings RENAME COLUMN "Annet(12,7)" TO "sunlight_12_7_other";
ALTER TABLE sightings RENAME COLUMN "MÕnen befant seg(12,8)" TO "moonlight";
ALTER TABLE sightings RENAME COLUMN "Annet(12,8)" TO "moonlight_other";
ALTER TABLE sightings RENAME COLUMN "Hva tror de selv at de sÕ(131)" TO "observers_thoughts";
ALTER TABLE sightings RENAME COLUMN "MÕnefasen(12,8B)" TO "moon_phase";


-- UPDATE fylke
-- SET fylke = 
--     CASE 
--         WHEN fylke = 'M°re og Romsdal' THEN 'Møre og Romsdal'
--         WHEN fylke = 'Nord-Tr°ndelag' THEN 'Nord-Trøndelag'
--         WHEN fylke = 'S°r-Tr°ndelag' THEN 'Sør-Trøndelag'
--         WHEN fylke = 'Ïstfold' THEN 'Østfold'
--         ELSE fylke
--     END;

SELECT fylke.fylke
FROM sightings
JOIN fylke ON sightings.fylke = fylke.id;





UPDATE sightings
SET colour = 
    CASE 
        WHEN colour = 'Burg.Brun Met.' THEN 'Burgundy Brown Met.'
        WHEN colour = 'r°dorange' THEN 'red-orange'
        WHEN colour = 'BlÕ' THEN 'Blue'
        WHEN colour = 'grÕtt' THEN 'greenish'
        WHEN colour = 'R°d og gul' THEN 'Red and yellow'
        WHEN colour = 'R°d/r°dbrun' THEN 'Red/red-brown'
        WHEN colour = 'Signalr°d' THEN 'Signal red'
        WHEN colour = 'Gult og r°dt' THEN 'Yellow and red'
        WHEN colour = 'sj°gr°nn' THEN 'sea green'
        WHEN colour = 'GrÕ' THEN 'Grey'
        WHEN colour = 's°lv/hvit' THEN 'silver/white'
        WHEN colour = 'R°dskjµr' THEN 'Reddish-purple'
        WHEN colour = 'grÕsort' THEN 'blackish-green'
        WHEN colour = 'Silhuett' THEN 'Silhouette'
        WHEN colour = 'stjernefarge' THEN 'star color'
        WHEN colour = 'Gr°nnlig' THEN 'Greenish'
        WHEN colour = 'R°dt og gult' THEN 'Red and yellow'
        WHEN colour = 'mÕnefarge' THEN 'Moon color'
        WHEN colour = 'svartaktig' THEN 'blackish'
        WHEN colour = 'Sort og hvit' THEN 'Black and white'
        WHEN colour = 'AliminiumgrÕ' THEN 'Aluminum grey'
        WHEN colour = 'gr°nn og blank' THEN 'green and shiny'
        WHEN colour = 'm°rkt' THEN 'dark'
        WHEN colour = 'grÕbrun' THEN 'brownish-grey'
        WHEN colour = 'klar blank' THEN 'clear shiny'
        WHEN colour = 'Glofarget' THEN 'Amber-colored'
        WHEN colour = 'Gr°nn r°d blÕ' THEN 'Green red blue'
        WHEN colour = 'Lysgult' THEN 'Light yellow'
        WHEN colour = 'R°d Burgunder.' THEN 'Burgundy red'
        WHEN colour = 'Gul' THEN 'Yellow'
        WHEN colour = 'rosa' THEN 'pink'
        WHEN colour = 'hvit og r°d' THEN 'white and red'
        WHEN colour = 'r°d, metallisk' THEN 'red, metallic'
        WHEN colour = 'Gr°nn/r°d/fiole' THEN 'Green/red/violet'
        WHEN colour = 'Gul/blÕ/klar' THEN 'Yellow/blue/clear'
        WHEN colour = 'Bronse' THEN 'Bronze'
        WHEN colour = 'Kobber' THEN 'Copper'
        WHEN colour = 'n°rk' THEN 'dark'
        WHEN colour = 'Lysgr°nn' THEN 'Light green'
        WHEN colour = 'Som mÕnen' THEN 'Like the moon'
        WHEN colour = 'Ubestemmelig' THEN 'Indeterminate'
        WHEN colour = 'gul/brun' THEN 'yellow/brown'
        WHEN colour = 'lilla' THEN 'purple'
        WHEN colour = 'Gr°nn/r°d/gul' THEN 'Green/red/yellow'
        WHEN colour = 'BlÕtt/fiolett +' THEN 'Blue/violet +'
        WHEN colour = 'Sterkt hvitt' THEN 'Bright white'
        WHEN colour = 'M°rk grÕ' THEN 'Dark grey'
        WHEN colour = 'Hvit/orange' THEN 'White/orange'
        WHEN colour = 'gulaktig' THEN 'yellowish'
        WHEN colour = 'Hvit / R°d' THEN 'White/red'
        WHEN colour = 'lys gul' THEN 'light yellow'
        WHEN colour = 'S°lvgrÕ' THEN 'Silver-grey'
        WHEN colour = 'billys' THEN 'headlight'
        WHEN colour = 'r°dgul' THEN 'red-yellow'
        WHEN colour = 'Varierende' THEN 'Variable'
        WHEN colour = 'gul og r°d' THEN 'yellow and red'
        WHEN colour = 'gult' THEN 'yellow'
        WHEN colour = 'BlÕlilla' THEN 'Blue-purple'
        WHEN colour = 'Dyp m°rk brun' THEN 'Deep dark brown'
        WHEN colour = 'Stjerne' THEN 'Star'
        WHEN colour = 'IsblÕ' THEN 'Ice blue'
        WHEN colour = 'blank' THEN 'shiny'
        WHEN colour = 'Lysende' THEN 'Luminous'
        WHEN colour = 'aluminium' THEN 'aluminum'
        WHEN colour = 'Gylden' THEN 'Golden'
        WHEN colour = 'Skiftende' THEN 'Shifting'
        WHEN colour = 'blÕgult' THEN 'blue-yellow'
        WHEN colour = 'blÕ/r°d' THEN 'blue/red'
        WHEN colour = 'R°dorange' THEN 'Red-orange'
        WHEN colour = 'hvit/blÕhvit' THEN 'white/blue-white'
        WHEN colour = 'Blanding' THEN 'Mixture'
        WHEN colour = 'som stjerne' THEN 'like a star'
        WHEN colour = 'Lys' THEN 'Light'
        WHEN colour = 'GrÕblÕ' THEN 'Grey-blue'
        WHEN colour = 'm°rk' THEN 'dark'
        WHEN colour = 'grÕ' THEN 'grey'
        WHEN colour = 'Gul r°d gr°nn' THEN 'Yellow red green'
        WHEN colour = 'Som varme' THEN 'Like warmth'
        WHEN colour = 'M°rk blÕ' THEN 'Dark blue'
        WHEN colour = 'S°lvblÕ' THEN 'Silver-blue'
        WHEN colour = 'Rosagul' THEN 'Rose yellow'
        WHEN colour = 'blÕr°d' THEN 'blue-red'
        WHEN colour = 'Hvit turkis ros' THEN 'White turquoise pink'
        WHEN colour = 'gr°nngul' THEN 'yellow-green'
        WHEN colour = 'Lys gr°nn' THEN 'Light green'
        WHEN colour = 'R°d/gr°nn/gul' THEN 'Red/green/yellow'
        WHEN colour = 'Gult' THEN 'Yellow'
        WHEN colour = 'R°dlig' THEN 'Reddish'
        WHEN colour = 'Tinn' THEN 'Tin'
        WHEN colour = 'GrÕlig' THEN 'Greyish'
        WHEN colour = 'R°dt/gult' THEN 'Red/yellow'
        WHEN colour = 'StÕlgrÕ' THEN 'Steel grey'
        WHEN colour = 'lyser°d' THEN 'light red'
        WHEN colour = 'S°lvblank' THEN 'Silver shiny'
        WHEN colour = 'r°d/gr°nn' THEN 'red/green'
        WHEN colour = 'Se rapport' THEN 'See report'
        WHEN colour = 'R°dgr°nnblÕhvit' THEN 'Red-green-blue-white'
        WHEN colour = 'Sort' THEN 'Black'
        WHEN colour = 'Hvit/r°d/blÕ' THEN 'White/red/blue'
        WHEN colour = 'Som Venus' THEN 'Like Venus'
        WHEN colour = 'Som stjerne' THEN 'Like a star'
        WHEN colour = 'Svart' THEN 'Black'
        WHEN colour = 'Gul orange r°d' THEN 'Yellow orange red'
        WHEN colour = 'Blank' THEN 'Shiny'
        WHEN colour = 'R°d og blÕ' THEN 'Red and blue'
        WHEN colour = 'se beskr.' THEN 'see description'
        WHEN colour = 'kremgu' THEN 'cream'
        WHEN colour = 'Militµrgr°nn' THEN 'Military green'
        WHEN colour = 'GrÕtt' THEN 'Grey'
        WHEN colour = 'GrÕhvit' THEN 'Grey-white'
        WHEN colour = 'klar' THEN 'clear'
        WHEN colour = 'BlÕ/gul' THEN 'Blue/yellow'
        WHEN colour = 'R°d-gul' THEN 'Red-yellow'
        WHEN colour = 'Gul/r°d/gr°nn' THEN 'Yellow/red/green'
        WHEN colour = 'Brennede kull' THEN 'Burning coal'
        WHEN colour = 'Skinnende hvit' THEN 'Shiny white'
        WHEN colour = 'Gul/hvit/orange' THEN 'Yellow/white/orange'
        WHEN colour = 'm°rk brun' THEN 'dark brown'
        WHEN colour = 'R°dgl°dende' THEN 'Red-glowing'
        WHEN colour = 'M°rk' THEN 'Dark'
        WHEN colour = 'Rosa' THEN 'Pink'
        WHEN colour = 'Som ild' THEN 'Like fire'
        WHEN colour = 'BlÕgr°nn' THEN 'Blue-green'
        WHEN colour = 'Gjennomsiktig' THEN 'Transparent'
        WHEN colour = 'BlÕlig' THEN 'Blueish'
        WHEN colour = 'blÕhvit' THEN 'blue-white'
        WHEN colour = 'Matt hvit' THEN 'Matte white'
        WHEN colour = 'Gulaktig' THEN 'Yellowish'
        WHEN colour = 'sort' THEN 'black'
        WHEN colour = 'Hvit og r°d' THEN 'White and red'
        WHEN colour = 'BlÕr°dt' THEN 'Blue-red'
        WHEN colour = 'R°d/blÕ/blank' THEN 'Red/blue/shiny'
        WHEN colour = 'BlÕhvitt etc.' THEN 'Blue-white etc.'
        WHEN colour = 'Lik en stjerne' THEN 'Like a star'
        WHEN colour = 'Gr°nn' THEN 'Green'
        WHEN colour = 'Som en stjerne' THEN 'Like a star'
        WHEN colour = 'Hvitorange' THEN 'White-orange'
        WHEN colour = 'grÕlig' THEN 'greyish'
        WHEN colour = 'M°rk r°d' THEN 'Dark red'
        WHEN colour = 'Klart lysende' THEN 'Clearly luminous'
        ELSE colour
    END;


ALTER TABLE sightings ADD COLUMN rgb VARCHAR(10);
UPDATE sightings
SET rgb = 
    CASE 
        WHEN colour = 'Burgundy Brown Met.' THEN '#800020'
        WHEN colour = 'red-orange' THEN '#FF4500'
        WHEN colour = 'Blue' THEN '#0000FF'
        WHEN colour = 'greenish' THEN '#008000'
        WHEN colour = 'Red and yellow' THEN '#FF0000'
        WHEN colour = 'Red/red-brown' THEN '#8B4513'
        WHEN colour = 'Signal red' THEN '#FF0000'
        WHEN colour = 'Yellow and red' THEN '#FFFF00'
        WHEN colour = 'sea green' THEN '#2E8B57'
        WHEN colour = 'Grey' THEN '#808080'
        WHEN colour = 'silver/white' THEN '#C0C0C0'
        WHEN colour = 'Reddish-purple' THEN '#800080'
        WHEN colour = 'blackish-green' THEN '#006400'
        WHEN colour = 'Silhouette' THEN '#000000'
        WHEN colour = 'star color' THEN '#FFDF00'
        WHEN colour = 'Greenish' THEN '#00FF00'
        WHEN colour = 'Moon color' THEN '#C0C0C0'
        WHEN colour = 'blackish' THEN '#231F20'
        WHEN colour = 'Black and white' THEN '#000000'
        WHEN colour = 'Aluminum grey' THEN '#A9A9A9'
        WHEN colour = 'green and shiny' THEN '#00FF00'
        WHEN colour = 'dark' THEN '#000000'
        WHEN colour = 'brownish-grey' THEN '#8B7370'
        WHEN colour = 'clear shiny' THEN '#FFFFFF'
        WHEN colour = 'Amber-colored' THEN '#FFBF00'
        WHEN colour = 'Green red blue' THEN '#00FFFF'
        WHEN colour = 'Light yellow' THEN '#FFFFE0'
        WHEN colour = 'Burgundy red' THEN '#800020'
        WHEN colour = 'Yellow' THEN '#FFFF00'
        WHEN colour = 'pink' THEN '#FFC0CB'
        WHEN colour = 'white and red' THEN '#FFFFFF'
        WHEN colour = 'red, metallic' THEN '#FF0000'
        WHEN colour = 'Green/red/violet' THEN '#008000'
        WHEN colour = 'Yellow/blue/clear' THEN '#00BFFF'
        WHEN colour = 'Bronze' THEN '#B08D57'
        WHEN colour = 'Copper' THEN '#B87333'
        WHEN colour = 'dark' THEN '#000000'
        WHEN colour = 'Light green' THEN '#90EE90'
        WHEN colour = 'Like the moon' THEN '#C0C0C0'
        WHEN colour = 'Indeterminate' THEN '#808080'
        WHEN colour = 'yellow/brown' THEN '#DAA520'
        WHEN colour = 'purple' THEN '#800080'
        WHEN colour = 'Green/red/yellow' THEN '#008000'
        WHEN colour = 'Blue/violet +' THEN '#8A2BE2'
        WHEN colour = 'Bright white' THEN '#FFFFFF'
        WHEN colour = 'Dark grey' THEN '#A9A9A9'
        WHEN colour = 'White/orange' THEN '#FFFFFF'
        WHEN colour = 'yellowish' THEN '#FFFF00'
        WHEN colour = 'White/red' THEN '#FFFFFF'
        WHEN colour = 'light yellow' THEN '#FFFFE0'
        WHEN colour = 'Silver-grey' THEN '#C0C0C0'
        WHEN colour = 'headlight' THEN '#FFFFFF'
        WHEN colour = 'red-yellow' THEN '#FF4500'
        WHEN colour = 'Variable' THEN '#808080'
        WHEN colour = 'yellow and red' THEN '#FFFF00'
        WHEN colour = 'yellow' THEN '#FFFF00'
        WHEN colour = 'Blue-purple' THEN '#8A2BE2'
        WHEN colour = 'Deep dark brown' THEN '#654321'
        WHEN colour = 'Star' THEN '#FFFFFF'
        WHEN colour = 'Ice blue' THEN '#00BFFF'
        WHEN colour = 'shiny' THEN '#FFFFFF'
        WHEN colour = 'Luminous' THEN '#FFFF00'
        WHEN colour = 'aluminum' THEN '#A9A9A9'
        WHEN colour = 'Golden' THEN '#FFD700'
        WHEN colour = 'Shifting' THEN '#808080'
        WHEN colour = 'blue-yellow' THEN '#0000FF'
        WHEN colour = 'blue/red' THEN '#0000FF'
        WHEN colour = 'Red-orange' THEN '#FF4500'
        WHEN colour = 'white/blue-white' THEN '#FFFFFF'
        WHEN colour = 'Mixture' THEN '#808080'
        WHEN colour = 'like a star' THEN '#FFFF00'
        WHEN colour = 'Light' THEN '#FFFFFF'
        WHEN colour = 'Grey-blue' THEN '#696969'
        WHEN colour = 'dark' THEN '#000000'
        WHEN colour = 'grey' THEN '#808080'
        WHEN colour = 'Yellow red green' THEN '#FFFF00'
        WHEN colour = 'Like warmth' THEN '#FF4500'
        WHEN colour = 'Dark blue' THEN '#00008B'
        WHEN colour = 'Silver-blue' THEN '#B0C4DE'
        WHEN colour = 'Rose yellow' THEN '#FFF000'
        WHEN colour = 'blue-red' THEN '#0000FF'
        WHEN colour = 'White turquoise pink' THEN '#FFFFFF'
        WHEN colour = 'yellow-green' THEN '#9ACD32'
        WHEN colour = 'Light green' THEN '#90EE90'
        WHEN colour = 'Red/green/yellow' THEN '#FF0000'
        WHEN colour = 'Yellow' THEN '#FFFF00'
        WHEN colour = 'Reddish' THEN '#FF4500'
        WHEN colour = 'Tin' THEN '#708090'
        WHEN colour = 'Greyish' THEN '#808080'
        WHEN colour = 'Red/yellow' THEN '#FF0000'
        WHEN colour = 'Steel grey' THEN '#808080'
        WHEN colour = 'light red' THEN '#FFB6C1'
        WHEN colour = 'Silver shiny' THEN '#C0C0C0'
        WHEN colour = 'red/green' THEN '#FF0000'
        WHEN colour = 'See report' THEN '#808080'
        WHEN colour = 'Red-green-blue-white' THEN '#FFFFFF'
        WHEN colour = 'Black' THEN '#000000'
        WHEN colour = 'White/red/blue' THEN '#FFFFFF'
        WHEN colour = 'Like Venus' THEN '#FF4500'
        WHEN colour = 'Like a star' THEN '#FFFF00'
        WHEN colour = 'Black' THEN '#000000'
        WHEN colour = 'Yellow orange red' THEN '#FF4500'
        WHEN colour = 'Shiny' THEN '#FFFFFF'
        WHEN colour = 'Red and blue' THEN '#FF0000'
        WHEN colour = 'see description' THEN '#808080'
        WHEN colour = 'cream' THEN '#FFFDD0'
        WHEN colour = 'Military green' THEN '#556B2F'
        WHEN colour = 'Grey' THEN '#808080'
        WHEN colour = 'Grey-white' THEN '#D3D3D3'
        WHEN colour = 'clear' THEN '#FFFFFF'
        WHEN colour = 'Blue/yellow' THEN '#0000FF'
        WHEN colour = 'Red-yellow' THEN '#FF4500'
        WHEN colour = 'Yellow/red/green' THEN '#FFFF00'
        WHEN colour = 'Burning coal' THEN '#808080'
        WHEN colour = 'Shiny white' THEN '#FFFFFF'
        WHEN colour = 'Yellow/white/orange' THEN '#FFFF00'
        WHEN colour = 'dark brown' THEN '#8B4513'
        WHEN colour = 'Red-glowing' THEN '#FF0000'
        WHEN colour = 'Dark' THEN '#000000'
        WHEN colour = 'Pink' THEN '#FFC0CB'
        WHEN colour = 'Like fire' THEN '#FF4500'
        WHEN colour = 'Blue-green' THEN '#008080'
        WHEN colour = 'Transparent' THEN '#FFFFFF'
        WHEN colour = 'Blueish' THEN '#0000FF'
        WHEN colour = 'blue-white' THEN '#ADD8E6'
        WHEN colour = 'Matte white' THEN '#FFFFFF'
        WHEN colour = 'Yellowish' THEN '#FFFF00'
        WHEN colour = 'black' THEN '#000000'
        WHEN colour = 'White and red' THEN '#FFFFFF'
        WHEN colour = 'Blue-red' THEN '#0000FF'
        WHEN colour = 'Red/blue/shiny' THEN '#FF0000'
        WHEN colour = 'Blue-white etc.' THEN '#ADD8E6'
        WHEN colour = 'Like a star' THEN '#FFFF00'
        WHEN colour = 'Green' THEN '#008000'
        WHEN colour = 'Like a star' THEN '#FFFF00'
        WHEN colour = 'White-orange' THEN '#FFFFFF'
        WHEN colour = 'greyish' THEN '#808080'
        WHEN colour = 'Dark red' THEN '#8B0000'
        WHEN colour = 'Clearly luminous' THEN '#FFFF00'
        ELSE 'Unknown'
    END;


UPDATE sightings SET duration = NULL WHERE duration = 'sek.';

ALTER TABLE sightings ADD COLUMN duration_seconds INTEGER;

UPDATE sightings
SET duration_seconds = (CAST(split_part(duration, ' ', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+ min$';

UPDATE sightings
SET duration_seconds = (CAST(split_part(duration, ' ', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+ min\.$';

UPDATE sightings
SET duration_seconds = ((CAST(split_part(duration, '-', 1) AS INTEGER) + CAST(split_part(split_part(duration, '-', 2), 'sek', 1) AS INTEGER)) / 2)
WHERE duration ~ '^[0-9]+-[0-9]+sek$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' m. ', 1) AS INTEGER) * 60) + 
    CAST(split_part(split_part(duration, ' m. ', 2), ' s.', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+ m\. [0-9]+ s\.$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' t. ', 1) AS INTEGER)  * 60 * 60) + 
    (CAST(split_part(split_part(duration, ' t. ', 2), ' m.', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+ t\. [0-9]+ m\.$';

UPDATE sightings
SET duration_seconds = (CAST(split_part(duration, ' timer.', 1) AS INTEGER) * 60 * 60)
WHERE duration ~ '^[0-9]+ timer\.$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, '/', 1) AS FLOAT) / CAST(split_part(split_part(duration, '/', 2), ' sek.', 1) AS FLOAT))
WHERE duration ~ '^[0-9]+/[0-9]+ sek\.$';

UPDATE sightings
SET duration_seconds = (CAST(split_part(duration, ' ', 1) AS INTEGER))
WHERE duration ~ '^[0-9]+ sek\.$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, 't. ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, 't. ', 2), 'min.', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+t\. [0-9]+min\.$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' t ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, ' t ', 2), ' min', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+ t [0-9]+ min$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' sek-', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+ sek-$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' ', 1) AS INTEGER) * 60) +
    (CAST(split_part(split_part(duration, ' ', 2), '/', 1) AS FLOAT) / CAST(split_part(split_part(duration, ' ', 2), '/', 2) AS FLOAT) * 60)
WHERE duration ~ '^[0-9]+ [0-9]+/[0-9]+ min\.$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' ', 1) AS INTEGER)) +
    (CAST(split_part(split_part(duration, ' ', 2), '/', 1) AS FLOAT) / CAST(split_part(split_part(duration, ' ', 2), '/', 2) AS FLOAT))
WHERE duration ~ '^[0-9]+ [0-9]+/[0-9]+ sek\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' ', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+ sek$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' min ', 1) AS INTEGER) * 60) +
    CAST(split_part(split_part(duration, ' min ', 2), ' s', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+ min [0-9]+ s$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, 'min ', 1) AS INTEGER) * 60) +
    CAST(split_part(split_part(duration, 'min ', 2), ' se', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+min [0-9]+ se$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, '-', 1) AS INTEGER) + CAST(split_part(split_part(duration, '-', 2), 'min', 1) AS INTEGER)) * 60
WHERE duration ~ '^[0-9]+-[0-9]+min$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' minutter', 1) AS INTEGER) * 60
WHERE duration ~ '^[0-9]+ minutter$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, 't ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, 't ', 2), 'min.', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+t [0-9]+min\.$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, 't ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, 't ', 2), 'm.', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+t [0-9]+m\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, 'sek.', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+sek\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' timer', 1) AS INTEGER) * 60 * 60
WHERE duration ~ '^[0-9]+ timer$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' t.', 1) AS INTEGER) * 60 * 60)
WHERE duration ~ '^[0-9]+ t\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, 'min', 1) AS INTEGER) * 60
WHERE duration ~ '^[0-9]+min$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, 't ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, 't ', 2), 'min', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+t [0-9]+min\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' timer', 1) AS INTEGER) * 60 * 60
WHERE duration ~ '^[0-9]+ timer$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' ', 1) AS INTEGER)
WHERE duration ~ '^[0-9]+ sek$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, 'min', 1) AS INTEGER) * 60
WHERE duration ~ '^[0-9]+min$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, 't. ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, 't. ', 2), 'min.', 1) AS INTEGER) * 60)
WHERE duration ~ '^[0-9]+t\. [0-9]+min\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' timer', 1) AS INTEGER) * 60 * 60
WHERE duration ~ '^[0-9]+ timer$';

UPDATE sightings
SET duration_seconds = CAST(REPLACE(duration, '/', '.') AS FLOAT) * 60
WHERE duration ~ '^[0-9]+/[0-9]+ min\.$';

UPDATE sightings
SET duration_seconds = CAST(split_part(duration, ' time', 1) AS INTEGER) * 60 * 60
WHERE duration ~ '^[0-9]+ time$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, ' ', 2), '/', 1) AS FLOAT) / CAST(split_part(split_part(duration, ' ', 2), '/', 2) AS FLOAT) * 60 * 60)
WHERE duration ~ '^[0-9]+ [0-9]/[0-9] time$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, ' ', 2), '/', 1) AS FLOAT) / CAST(split_part(split_part(duration, ' ', 2), '/', 2) AS FLOAT) * 60 * 60)
WHERE duration ~ '^[0-9]+ [0-9]/[0-9] time$';

UPDATE sightings
SET duration_seconds = 
    (CAST(split_part(duration, ' ', 1) AS INTEGER) * 60 * 60) + 
    (CAST(split_part(split_part(duration, ' ', 2), '/', 1) AS FLOAT) / CAST(split_part(split_part(duration, ' ', 2), '/', 2) AS FLOAT) * 60 * 60)
WHERE duration ~ '^[0-9]+ [0-9]/[0-9] time$';

UPDATE sightings set duration_seconds=2.5 WHERE duration = '2,5 sek.';
UPDATE sightings set duration_seconds=150 WHERE duration = '2,5 min.';
UPDATE sightings set duration_seconds=0.5 WHERE duration = '0,5 sek.';
UPDATE sightings set duration_seconds=1362 WHERE duration = '22.42';
UPDATE sightings set duration_seconds=30 WHERE duration = '1/2 min.';
UPDATE sightings set duration_seconds=225 WHERE duration = '03.45';
 
-- select distinct duration from sightings where duration_seconds is null;

