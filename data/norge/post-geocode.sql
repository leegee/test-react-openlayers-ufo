SET client_encoding TO 'UTF8';

UPDATE sightings SET point = ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326), 3857);

DROP INDEX IF EXISTS spatial_index_point;
CREATE INDEX spatial_index_point ON sightings USING gist (point);

-- Updates to bad locations
UPDATE sightings
SET location_text = REPLACE(location_text, '1640 Moss v/Spareland', '1640 Spareland, Moss, Viken')
WHERE location_text = '1640 Moss v/Spareland';

UPDATE sightings
SET location_text = REPLACE(location_text, 'Spareland vMoss', '1640 Spareland, Moss, Viken')
WHERE location_text = 'Spareland vMoss';

UPDATE sightings
SET location_text = REPLACE(location_text, '2 km. nord for Bodø.', 'Bodø, Nordland')
WHERE location_text LIKE '2 km. nord for Bod%';

UPDATE sightings
SET location_text = REPLACE(location_text, '6500 Kristaiansund N.', '6500 Kristaiansund N')
WHERE location_text = '6500 Kristaiansund N.';

-- UPDATE sightings
-- SET location_text = REPLACE(location_text, 'Lyngeidet', 'Lyngseidet')
-- WHERE location_text LIKE '%Lyngeidet%';

UPDATE sightings
SET location_text = REPLACE(location_text, 'Alhusstrand', 'Ålhussand')
WHERE location_text = 'Alhusstrand';

UPDATE sightings
SET location_text = REPLACE(location_text, 'Bakke i Oklungen', 'Oklungen')
WHERE location_text = 'Bakke i Oklungen';

UPDATE sightings
SET location_text = 'Brumunddal'
WHERE location_text = 'Brummunddal' OR location_text = 'Brumundal';

UPDATE sightings
SET location_text = 'Eidsvågsneset'
WHERE location_text = 'Eidsvågnesset';

UPDATE sightings
SET location_text = REPLACE(location_text, 'Fetsundbrua', 'Fetsund, Lillestrøm, Viken')
WHERE location_text = 'Fetsundbrua';

UPDATE sightings
SET location_text = REPLACE(location_text, 'Fjørangen', 'Fjøsanger')
WHERE location_text = 'Fjørangen';

UPDATE sightings
SET location_text = 'Gimsøyfjorden, Lofoten, Nordland'
WHERE location_text = 'Gimsøyfjorden';

UPDATE sightings
SET location_text = REPLACE(location_text, 'Spania', 'Spain')
WHERE location_text = 'Spania';

UPDATE sightings
SET location_text = '3047 Drammen, Gulskagen'
WHERE location_text = 'Gulskagen';

UPDATE sightings
SET location_text = '3533 Tyristrand, Hagabru'
WHERE location_text = 'Hagabru';

UPDATE sightings
SET location_text = '2080 Hammerstad, Hammerstadkrysset'
WHERE location_text = 'Hammerstadkrysset';

UPDATE sightings
SET location_text = '2750 Gran, Hellevn, Minde'
WHERE location_text = 'Hellevn, Minde';

UPDATE sightings
SET location_text = '3560 Hemsedal, Henningvann'
WHERE location_text = 'Henningvann';

UPDATE sightings
SET location_text = '3560 Hemsedal, Hinningvatn'
WHERE location_text = 'Hinningvatn';

UPDATE sightings
SET location_text = '5259 Hjelestad'
WHERE location_text = 'Hjelestadskiftet';

UPDATE sightings 
SET location_text = 'Hoemsetra, Eikesdal, Møre og Romsdal' 
WHERE location_text = 'Hoemsetra, Eikesdal';

UPDATE sightings 
SET location_text = '8664 Holandsvik, Røst, Nordland' 
WHERE location_text = 'Holandsvik';

-- "Grand Canaria Playa del I"
-- "Grensevn. - Økervn."  - maybe "Grenseveien" and "Økernveien" but where?
-- "Grensevn." - maybe Grenseveien but where?
-- "Gressbakken"
-- "Gressviksletta" - Gressvik sletta?
-- "Haltug"
-- "Hammerstadkrysset"
-- "Haraldsvei" -- which one?
-- "Hellevn, Minde"
-- "Henningvann"
-- "Hetleviksåsen" 
-- "Hinningvatn"
-- "Hjelestadskiftet"
-- "Hoemsetra, Eikesdal"

-- "Holandsvik"
-- "Hormindal"
-- "Ivedalsvann"
-- "Jægervannet"
-- "Jarer"
-- "Kågsund, Skjervøy"
-- "Købehavngata, Oslo 5"
-- "kollåsen, Ulset i Åsane"
-- "Kronåsen"
-- "Lambertsetervn."
-- "Leikvikfjell"
-- "Lilleakervn."
-- "Lønninghavn"
-- "Lutvatn"
-- "Mossevn. ved Gjersjøen"
-- "Nebb ved Skøyen"
-- "Nemabu Høyfjellstue"
-- "Nordgrenseter"
-- "Nøsenvannet"
-- "Onsog"
-- "Portugalkysten"
-- "Resdalsseter."
-- "Romsdalsfjorden"
-- "ROTA ved Malviklandet"
-- "Røverdalen"
-- "Rudeløkka, Oslo"
-- "Saksehaug"
-- "Sandøysund"
-- "Sandviksbroen, Drammensvn"
-- "Selvbyggervn. Oslo 5"
-- "Sendsjøen"
-- "Setskogen"
-- "Skjetnemarka"
-- "Skøyenmoen, Ilseng"
-- "Skråfjord"
-- "Sofiesgt."
-- "Solborgvannet"
-- "Søtefjell"
-- "Sousse"
-- "Stemalen, Tønsberg"
-- "Stenb.Haugen"
-- "Sundalen"
-- "Tisvattnet"
-- "Tollbodgt. Kr.sand"
-- "Valnes i Salten"
-- "Veitvedt"
-- "Vesleheim Ranheim"
-- "Waatvik"

-- Places not geocoded that I can't fix:
-- Alvekleiva
-- Angeltrøa
-- Aresvik
-- Bjøringvann - which one
-- Borgenhøy, Holter 
-- Borgenhøy
-- Davangen - maybe Davangsvågen?
-- Dypådalen seter
-- Eggevammen, Steinkjer (Trøndelag) exists but not in the geocode db
-- Eikebygda
-- Fagernesbroen = Fagernes?
-- Fantofthøyden
-- Fløyrestauranten - the Fløy restaurant where?
-- Fonåsfjellet - which one?



