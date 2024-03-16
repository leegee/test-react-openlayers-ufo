# Norge Data

##  Synopsis

    ./create_db.sh

## Notes

From Erik via Fred, this directory contains an export of the MS Access database `Ufo_Norge_Hoveddatabase.mdb`, and scripts to convert it to PostGIS and, in part, to English.

The data does not contain latitude/longitude details, but most records contain place names and links to counties. 

Some effort was spent to programmatically correct obvious spelling mistakes, and to add more details that can be provided to a geocoding service. So far geocoding has found maybe half of the locations. The remaining names may have to be done by hand.

See the SQL for notes and a list of as yet unprocessed places.

The MDB dump also contains a lot of joins that are not documented in the dump files: perhaps they are in the associated PDF, I will ahve to check. Currently, I have to ignore those, which renders inaccessible a lot of valuable data. Help needed!

    norge=# select location_text from sightings where latitude is null and location_text is not null ORDER BY location_text ASC; 
    
                location_text
    --------------------------------------
    Helleland/Bjerkreim
    1640 Spareland, Moss, Viken
    2 km. nord for Bod°.
    2080 Hammerstad, Hammerstadkrysset
    2750 Gran, Hellevn, Minde
    3047 Drammen, Gulskagen
    3533 Tyristrand, Hagabru
    3560 Hemsedal, Henningvann
    3560 Hemsedal, Hinningvatn
    5259 Hjelestad
    6500 Kristaiansund N
    8664 Holandsvik, Røst, Nordland
    Alhusstrand
    Alvekleiva
    Angeltr°a
    Aresvik
    Bj°ringvann
    Borgenh°y
    Borgenh°y
    Borgenh°y, Holter
    Borgenh°y, Holter
    Borgenh°y, Holter
    Borgenh°y, Holter
    Borgenh°y, Holter
    Borgenh°y, Holter
    Borgenh°y, Holter
    Borgenh°y, Holter
    Davangen
    DypÕdalen seter
    Eggevammen, Steinkjer
    Eggevammen, Steinkjer
    Eggevammen, Steinkjer
    EidsvÕgnesset
    Eikebygda
    Fagernesbroen
    Fantofth°yden
    Fetsund, Lillestrøm, Viken
    Fj°rangen
    Fl°yrestauranten
    FonÕsfjellet
    Gims°yfjorden
    Gjeien gÕrd, Andebu?
    Grand Canaria Playa del I
    Granollers, Spain
    Grensevn.
    Grensevn.
    Grensevn. - Ïkervn.
    Gressbakken
    Gressviksletta
    Haltug
    Haraldsvei
    Hemne?
    HetleviksÕsen
    Hoemsetra, Eikesdal, Møre og Romsdal
    Hormindal
    Ivedalsvann
    Jµgervannet
    Jarer
    KÕgsund, Skjerv°y
    K°behavngata, Oslo 5
    kollÕsen, Ulset i ┼sane
    KronÕsen
    Lambertsetervn.
    Leikvikfjell
    Lilleakervn.
    L°nninghavn
    Lutvatn
    Mossevn. ved Gjersj°en
    Nebb ved Sk°yen
    Nemabu H°yfjellstue
    Nordgrenseter
    N°senvannet
    Onsog
    Portugalkysten
    Resdalsseter.
    Romsdalsfjorden
    ROTA ved Malviklandet
    R°verdalen
    Rudel°kka, Oslo
    Saksehaug
    Sand°ysund
    Sandviksbroen, Drammensvn
    Santa Ponza, Spain
    Selvbyggervn. Oslo 5
    Sendsj°en
    Setskogen
    Skjetnemarka
    Sk°yenmoen, Ilseng
    SkrÕfjord
    Sofiesgt.
    Solborgvannet
    S°tefjell
    Sousse
    Stemalen, T°nsberg
    Stenb.Haugen
    Sundalen
    Tisvattnet
    Tollbodgt. Kr.sand
    Valnes i Salten
    Veitvedt
    Vesleheim Ranheim
    Waatvik
    
    (102 rows)