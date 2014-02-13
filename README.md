# Such- und Filteranwendung f�r die Arzneimittelanalytik (AMA)
*Mit Hilfe von Rf-Werten aus der D�nnschichtchromatographie (DC) und Farbreaktionen auf Arzneimittel oder toxikologisch relevante Stoffe r�ckschlie�en*

## Implementierung
### Datenbankverwaltung (Master)
Die Arzneistoffliste wird mit Hilfe einer in [Qt](http://qt-project.org) eingebetteten Web-Anwendung verwaltet. [SQLite](http://de.wikipedia.org/wiki/SQLite) ist als Datenbank-Backend vorkonfiguriert. Momentan gibt es noch kein vollst�ndiges SQL-Script das die Datenbank automatisch erstellt und konfiguriert. Hilfe wird dankbar angenommen. Deshalb ist die SQLite-Datenbank als solches mit im Repo.

### Clients
*Es gibt zwei Clients, welche jeweils von verschiedenen Leuten geschrieben wurden und f�r jeweils bestimmte Zwecke Vorteile bieten*

#### AMA-App (Web-Anwendung)
Die Master-Version unterst�tzt One-Click-Export. Dabei wird ein Ordner angelegt, der s�mtliche Web-Dateien (HTML, JS, CSS, �) inklusive Daten im JSON(P)-Format enth�lt. Alle exportierte Dateien sind statisch - es wird kein PHP o.�. ben�tigt - und sind in jedem modernen Browser ausf�hrbar.

#### AMA-Tool (Lazarus Anwendung)
Eine native, �bersichtliche und schnelle Anwendung (unter Windows eine Portable Executable - PE, *.exe), welche mit [Lazarus](https://de.wikipedia.org/wiki/Lazarus_%28Entwicklungsumgebung%29), einer IDE f�r Free Pascal, geschrieben wurde. Sie ist in der Lage die von der Master-Version erstellten JSON(P)-Daten-Dateien zu lesen.

## Daten
Wegen m�glicher Beschr�nkungen durch das Urheberrecht ist nur eine Auswahl von Datens�tzen beigef�gt worden. Wir bem�hen uns gerade um eine Genehmigung der Urheberrechtsinhaber.

## Erstellen
Am besten mit dem Qt Creator (die *.pro Datei �ffnen), alternativ `qmake ama.pro` und der Lazarus IDE (die *.lpr Datei �ffnen).

## Lizenz
F�r das Gesamtpaket:
GNU AFFERO GENERAL PUBLIC LICENSE version 3

Einige Module unterliegen weniger restriktiven Lizenzen.

# Search and filter application for drug analysis
*Search with Rf-values from Thin-Layer-Chromatography (TLC) and results from analytical (color) reactions for chemical drugs or toxicologically relevant substances*

## Implementation
### Database manager (master)
The drug list is maintained using a web-application embedded into a [Qt](http://qt-project.org) widget.
[SQLite](http://en.wikipedia.org/wiki/SQLite) is pre-configurated as the database backend. There is currently no SQL-Script for database-creation because it was partially built using an UI tool, consequently the SQLite database is included into the repo as file.

### Clients
*There are two clients written by 2 different people both having advantages for some purpose*

#### AMA-App (web application)
The web application can be created with one-click-export from the Qt master version. All the files required for the web application (HTML, JS, CSS, �), including the data files in JSON(P) format are thrown together into a folder. All these files are static and do not require pre-processing by a server-side script, thus can be executed locally in every modern browser.

#### AMA-Tool (Lazarus application)
A native, well-arranged and fast application (a Portable Executable under Windows - *.exe) that is written with [Lazarus](https://en.wikipedia.org/wiki/Lazarus_%28IDE%29), an IDE for Free Pascal. It is capable reading the JSON(P) files written by the master application.

## Data
Currently the data set is limited due to copyright restrictions. We are attempting to get permission from the copyright holders.

## Build
Qt Creator (open the *.pro file), or alternatively `qmake ama.pro` and using Lazarus IDE (open the *.lpr file).

## License
The whole pocket:
GNU AFFERO GENERAL PUBLIC LICENSE version 3

Some modules are available under less restrictive licenses.