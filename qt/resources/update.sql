CREATE TABLE ghs
(
ghs_code varchar(5),
ghs_png BLOB,
ghs_svg BLOB,
ghs_label varchar(100)
);
-------ü-break-for-sqlite

CREATE UNIQUE INDEX GHSCODE_GHS_IDX ON ghs('ghs_code' ASC);
-------ü-break-for-sqlite

CREATE TABLE amaviews
(
v_type varchar(100),
v_icon varchar(100),
v_display varchar(10),
v_title varchar(255),
v_cols varchar(500)
);
-------ü-break-for-sqlite

CREATE UNIQUE INDEX COMPOUND_ID_FORMULAE_IDX ON FORMULAE('compound_id' ASC);
-------ü-break-for-sqlite

INSERT INTO amaviews
SELECT       'print' AS 'v_type', 'ui-icon-print' AS 'v_icon', 'Große Tabelle' AS 'v_display' , 'Daten werden in einer großer Tabelle angezeigt. Nützlich zum durchsuchen mit Strg+F' AS 'v_title', 'Nr|Substanz|Struktur|ama-tiaft|ama-fr|UV|Phase|Beobachtungen|EigenschaftenundPrüfung|Indikation' AS 'v_cols'
UNION SELECT 'grid'             , 'ui-icon-home'             , 'Standardansicht'              , 'Die wichtigsten Daten im Überblick'                                                              , 'Nr|Substanz|Struktur|ama-tiaft|ama-fr|UV|Phase|Beobachtungen|EigenschaftenundPrüfung|Indikation'
UNION SELECT 'grid'             , 'ui-icon-notice'           , 'Sicherheit und Informationen' , 'Informationen und Sicherheitshinweise'                                                           , 'Nr|Substanz|CAS|PubChem|hazard|pictorgram|Struktur|Beobachtungen|EigenschaftenundPrüfung|Indikation'
UNION SELECT 'grid'             , ''                         , 'Analyse'                      , 'Analysendaten kompakt'                                                                           , 'Nr|Substanz|ama-tiaft|ama-fr|UV|Phase|Beobachtungen|EigenschaftenundPrüfung';
-------ü-break-for-sqlite

ALTER TABLE META
ADD legend BLOB;
-------ü-break-for-sqlite

ALTER TABLE COMPOUNDS
ADD c_masteronly BLOB;
-------ü-break-for-sqlite

ALTER TABLE COMPOUNDS
ADD c_hazard varchar(200);
-------ü-break-for-sqlite

ALTER TABLE COMPOUNDS
ADD c_pictogram varchar(200);
-------ü-break-for-sqlite

UPDATE META
SET legend='<pre>Legende / Hinweise:	

Reagenzien:
DD	Dragendorff
ES	Echtschwarz
EB	Echtblau
IP	Iodplatinat
BG	Bromcresolgrün
(DPA	Diphenylamin, könnte in Beobachtungen noch genannt sein, wird aber kaum verwendet)

Reaktionen:
++  Farbreaktion eindeutig positiv und reproduzierbar
+   Farbreaktion nicht eindeutig positiv und nicht reproduzierbar,
    u.U. konzentrationsabhängig
-   Farbreaktion negativ 

UV-Spalte:
+	Stoff unter UV gut sichtbar
+ schw	
(+)	Stoff unter UV schwach sichtbar
-	Stoff unter UV unsichtbar (ggf. in Iodkammer detektieren)

hRf-Werte:
0: 	Substanz hat hRf*-Wert Null (läuft also nicht)
-: 	Substanz zeigt kein reproduzierbares Laufverhalten (s. TIAFT-Referenzliste)

Phasen:
S:  	Säuren
B:  	Basen
sB: 	schwache Basen
N:  	Neutralstoffe
E:  	Ethylacetat-extrahierbare Substanzen
ne: 	nicht extrahierbar

***********************************************************************************
***********************************************************************************
***********************************************************************************

FAQ:
* Wie wird das Ergebnis sortiert?
  -&gt; Zuerst werden die Ausschluss-Kriterien angewendet. Alle
  nicht-passenden Stoffe werden aussortiert und nehmen nicht mehr an den
  folgenden Schritten teil.
  -&gt; Für TIAFT werden die Abweichungen berechnet. Dabei werden sehr starke
  Abweichungen mehr gewichtet. (Abweichung^1,1)
  -&gt; Für die Detektionen, werden auch die Abweichungen berechnet. Wenn z.B.
  eine Substanz ein "++" in der Liste hat, aber die Reaktion
  nachvollziehbar negativ ausgefallen ist, wird von einem "großen Fehler"
  ausgegangen, ist in der Liste dagegen "(+)" angegeben, wird ein geringer
  oder gar kein Fehler angenommen.
  -&gt; Diese Berechnungen werden für jedes durch den Nutzer angegebene System
  durchgeführt, die Summe der Abweichungen wird für jeden Stoff aufaddiert.
  -&gt; Die Abweichungen aus TIAFT und Detektion werden "normalisiert", so
  dass sich ein fester Bereich ergibt, ein Score (z.B. von 0 bis 1). In
  der aktuellen Version wird dabei leider noch nicht berücksichtigt, wie
  viele Vergleiche mit der Tabelle angestellt wurden: Da beispielsweise
  einige Stoffe ein "-" nicht-reproduzierbares Laufverhalten in bestimmten
  Systemen aufweisen, variiert diese Zahl. Das habe ich jetzt dahingehend
  korrigiert, dass Stoffe mit vielen "-" marginal schlechter bewertet
  werden, als solche mit vielen Angaben.
  -&gt; Der TIAFT-Score und der Detektions-Score werden gegeneinander
  gewichtet: Je mehr Erkenntnisse für TIAFT angegeben wurden, desto mehr
  fließt der TIAFT-score in die Bewertung ein und umgekehrt. Dabei werden
  TIAFT-Ergebnisse standardmäßig leicht höher bewertet: 5.5 : 5
  (theoretischer Wert bei 0 Angaben durch den Benutzer). Diese
  Höher-Bewertung flacht aber, je mehr Angaben auf beiden Seiten gemacht werden,
  immer weiter ab.
  -&gt; Wer JavaScript versteht, möge einen Blick in die Datei "searchalgo.js"
  (in der Studentenversion) werfen. Die Member-Funktionen "search" und
  "filter" sind dabei von Interesse.
  
* Ich habe angegeben, dass 66% der weiteren Erkenntnisse (Detektionen) abwei-
  chen dürfen. Ich habe 1 Angabe für diese weiteren Erkenntnisse gemacht.
  -&gt; 66% * 1 = Maximale Abweichung von 0.66 --&gt; Somit ist diese Grenze
  bei einer Abweichung von 1 bereits überschritten. 
  Sorry that I have to tell this, mate!

* Wie lasse ich einen korrigierten hRf-Wert (hRf*) aus Laufhöhen berechnen?
  -&gt; Neue Suche -&gt; Doppelklick auf ein Eingabefeld
  (oder alternativ Leertaste oder Pfeil-nach-unten-Navigationstaste)
  Daraufhin öffnet sich ein Dialog, der aus Angaben in cm oder in mm -
  die Einheit will das Programm gar nicht wissen und muss bei der Eingabe 
  weggelassen werden - alle hRf-Werte und den hRf*-Wert der Probe berechnet.
  Der erstellte Graph kann herangezogen werden, um die Qualität der vorliegenden
  DC einzuschätzen, sowie um systematische und zufällige Fehler aufzudecken.
  
* Warum kann ich nicht einfach ein Foto mit meinem Smartphone schiessen und
  AMA-App berechnet mir dann alles!?
  -&gt; Gegen Zahlung von 5500 € schreibe ich Dir gern eine solche Software.
  -&gt; Voraussichtliche Entwicklungszeit: 6 Monate.
  -&gt; Lizenz: Eine freie. Wahrscheinlich die von openCV.

***********************************************************************************
***********************************************************************************
***********************************************************************************

Daten: Copyright 2013 Dr. Petra Frohberg, Alle Rechte vorbehalten
Die Daten befinden sich im Ordner ./data und ./formulae
und dürfen nicht ohne Genhemigung weiterverbreitet werden.

Dieses Programm ist freie Software und unter der AGPL Lizenz Version 3 verfügbar.
Alle Bestandteile, mit Ausnahme der Daten, dürfen unter dieser Lizenz weiterver-
wendet werden.
Programmierung: Felix Pahlow


Getestet mit:
* Internet Explorer 10 (Windows)
* Mozilla Firefox 23 (Linux [openSUSE], Windows)
* Google Chrome und Chromium (Windows XP, Linux [openSUSE])
* Safari 5.1.7 (Windows XP)
* Opera 12 (Windows 7)

Interner Aufbau der Suchliste:
+---------------------------------------------------------+ +-------+
| ***Master Anwendung*** (bei Frau Dr. Frohberg)          |         | one-click
|---------------------------------------------------------|         | Export
| Datenbank (momentan SQLite; auch Server ist möglich)    |         v
|           Qt Anwendung                   +-------------------------------------+
|           (impl. als Server denkbar)     | Webanwendung |                      |
+------------------------------------------|--------------+ Daten im JSON-Format |
                                           |-------------------------------------|
                                           | ***Studentenversion***              |
                                           +-------------------------------------+

Wenn Ihr also Änderungsvorschläge habt, sagt Frau Dr. Frohberg Bescheid,
damit auch künftige Studienjahrgänge davon profitieren. Große Teile der Liste
werden von Studenten gewartet. Wenn Ihr also eine bessere Liste wollt,
müsst ihr auch etwas tun. Das Master-Interface wurde komplett neu erstellt
und lässt sich dank integriertem Strukturformeleditor super einfach bedienen.

Die Studentenversion besteht ausschließlich aus statischen Web-Dateien
und eignet sich damit hervorragend, für das einfache Webhosting.

***********************************************************************************
***********************************************************************************
***********************************************************************************
</pre>
<h3 style="text-align: center;">GNU AFFERO GENERAL PUBLIC LICENSE</h3>
<p style="text-align: center;">Version 3, 19 November 2007</p>

<p>Copyright © 2007 Free Software Foundation,
Inc. &lt;<a href="http://fsf.org/">http://fsf.org/</a>&gt;
 <br>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.</p>

<h3><a name="preamble"></a>Preamble</h3>

<p>The GNU Affero General Public License is a free, copyleft license
for software and other kinds of works, specifically designed to ensure
cooperation with the community in the case of network server software.</p>

<p>The licenses for most software and other practical works are
designed to take away your freedom to share and change the works.  By
contrast, our General Public Licenses are intended to guarantee your
freedom to share and change all versions of a program--to make sure it
remains free software for all its users.</p>

<p>When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
them if you wish), that you receive source code or can get it if you
want it, that you can change the software or use pieces of it in new
free programs, and that you know you can do these things.</p>

<p>Developers that use our General Public Licenses protect your rights
with two steps: (1) assert copyright on the software, and (2) offer
you this License which gives you legal permission to copy, distribute
and/or modify the software.</p>

<p>A secondary benefit of defending all users'' freedom is that
improvements made in alternate versions of the program, if they
receive widespread use, become available for other developers to
incorporate.  Many developers of free software are heartened and
encouraged by the resulting cooperation.  However, in the case of
software used on network servers, this result may fail to come about.
The GNU General Public License permits making a modified version and
letting the public access it on a server without ever releasing its
source code to the public.</p>

<p>The GNU Affero General Public License is designed specifically to
ensure that, in such cases, the modified source code becomes available
to the community.  It requires the operator of a network server to
provide the source code of the modified version running there to the
users of that server.  Therefore, public use of a modified version, on
a publicly accessible server, gives the public access to the source
code of the modified version.</p>

<p>An older license, called the Affero General Public License and
published by Affero, was designed to accomplish similar goals.  This is
a different license, not a version of the Affero GPL, but Affero has
released a new version of the Affero GPL which permits relicensing under
this license.</p>

<p>The precise terms and conditions for copying, distribution and
modification follow.</p>

<h3><a name="terms"></a>TERMS AND CONDITIONS</h3>

<h4><a name="section0"></a>0. Definitions.</h4>

<p>"This License" refers to version 3 of the GNU Affero General Public
License.</p>

<p>"Copyright" also means copyright-like laws that apply to other kinds
of works, such as semiconductor masks.</p>

<p>"The Program" refers to any copyrightable work licensed under this
License.  Each licensee is addressed as "you".  "Licensees" and
"recipients" may be individuals or organizations.</p>

<p>To "modify" a work means to copy from or adapt all or part of the work
in a fashion requiring copyright permission, other than the making of an
exact copy.  The resulting work is called a "modified version" of the
earlier work or a work "based on" the earlier work.</p>

<p>A "covered work" means either the unmodified Program or a work based
on the Program.</p>

<p>To "propagate" a work means to do anything with it that, without
permission, would make you directly or secondarily liable for
infringement under applicable copyright law, except executing it on a
computer or modifying a private copy.  Propagation includes copying,
distribution (with or without modification), making available to the
public, and in some countries other activities as well.</p>

<p>To "convey" a work means any kind of propagation that enables other
parties to make or receive copies.  Mere interaction with a user through
a computer network, with no transfer of a copy, is not conveying.</p>

<p>An interactive user interface displays "Appropriate Legal Notices"
to the extent that it includes a convenient and prominently visible
feature that (1) displays an appropriate copyright notice, and (2)
tells the user that there is no warranty for the work (except to the
extent that warranties are provided), that licensees may convey the
work under this License, and how to view a copy of this License.  If
the interface presents a list of user commands or options, such as a
menu, a prominent item in the list meets this criterion.</p>

<h4><a name="section1"></a>1. Source Code.</h4>

<p>The "source code" for a work means the preferred form of the work
for making modifications to it.  "Object code" means any non-source
form of a work.</p>

<p>A "Standard Interface" means an interface that either is an official
standard defined by a recognized standards body, or, in the case of
interfaces specified for a particular programming language, one that
is widely used among developers working in that language.</p>

<p>The "System Libraries" of an executable work include anything, other
than the work as a whole, that (a) is included in the normal form of
packaging a Major Component, but which is not part of that Major
Component, and (b) serves only to enable use of the work with that
Major Component, or to implement a Standard Interface for which an
implementation is available to the public in source code form.  A
"Major Component", in this context, means a major essential component
(kernel, window system, and so on) of the specific operating system
(if any) on which the executable work runs, or a compiler used to
produce the work, or an object code interpreter used to run it.</p>

<p>The "Corresponding Source" for a work in object code form means all
the source code needed to generate, install, and (for an executable
work) run the object code and to modify the work, including scripts to
control those activities.  However, it does not include the work''s
System Libraries, or general-purpose tools or generally available free
programs which are used unmodified in performing those activities but
which are not part of the work.  For example, Corresponding Source
includes interface definition files associated with source files for
the work, and the source code for shared libraries and dynamically
linked subprograms that the work is specifically designed to require,
such as by intimate data communication or control flow between those
subprograms and other parts of the work.</p>

<p>The Corresponding Source need not include anything that users
can regenerate automatically from other parts of the Corresponding
Source.</p>

<p>The Corresponding Source for a work in source code form is that
same work.</p>

<h4><a name="section2"></a>2. Basic Permissions.</h4>

<p>All rights granted under this License are granted for the term of
copyright on the Program, and are irrevocable provided the stated
conditions are met.  This License explicitly affirms your unlimited
permission to run the unmodified Program.  The output from running a
covered work is covered by this License only if the output, given its
content, constitutes a covered work.  This License acknowledges your
rights of fair use or other equivalent, as provided by copyright law.</p>

<p>You may make, run and propagate covered works that you do not
convey, without conditions so long as your license otherwise remains
in force.  You may convey covered works to others for the sole purpose
of having them make modifications exclusively for you, or provide you
with facilities for running those works, provided that you comply with
the terms of this License in conveying all material for which you do
not control copyright.  Those thus making or running the covered works
for you must do so exclusively on your behalf, under your direction
and control, on terms that prohibit them from making any copies of
your copyrighted material outside their relationship with you.</p>

<p>Conveying under any other circumstances is permitted solely under
the conditions stated below.  Sublicensing is not allowed; section 10
makes it unnecessary.</p>

<h4><a name="section3"></a>3. Protecting Users'' Legal Rights From Anti-Circumvention Law.</h4>

<p>No covered work shall be deemed part of an effective technological
measure under any applicable law fulfilling obligations under article
11 of the WIPO copyright treaty adopted on 20 December 1996, or
similar laws prohibiting or restricting circumvention of such
measures.</p>

<p>When you convey a covered work, you waive any legal power to forbid
circumvention of technological measures to the extent such circumvention
is effected by exercising rights under this License with respect to
the covered work, and you disclaim any intention to limit operation or
modification of the work as a means of enforcing, against the work''s
users, your or third parties'' legal rights to forbid circumvention of
technological measures.</p>

<h4><a name="section4"></a>4. Conveying Verbatim Copies.</h4>

<p>You may convey verbatim copies of the Program''s source code as you
receive it, in any medium, provided that you conspicuously and
appropriately publish on each copy an appropriate copyright notice;
keep intact all notices stating that this License and any
non-permissive terms added in accord with section 7 apply to the code;
keep intact all notices of the absence of any warranty; and give all
recipients a copy of this License along with the Program.</p>

<p>You may charge any price or no price for each copy that you convey,
and you may offer support or warranty protection for a fee.</p>

<h4><a name="section5"></a>5. Conveying Modified Source Versions.</h4>

<p>You may convey a work based on the Program, or the modifications to
produce it from the Program, in the form of source code under the
terms of section 4, provided that you also meet all of these conditions:</p>

<ul>

<li>a) The work must carry prominent notices stating that you modified
    it, and giving a relevant date.</li>

<li>b) The work must carry prominent notices stating that it is
    released under this License and any conditions added under section
    7.  This requirement modifies the requirement in section 4 to
    "keep intact all notices".</li>

<li>c) You must license the entire work, as a whole, under this
    License to anyone who comes into possession of a copy.  This
    License will therefore apply, along with any applicable section 7
    additional terms, to the whole of the work, and all its parts,
    regardless of how they are packaged.  This License gives no
    permission to license the work in any other way, but it does not
    invalidate such permission if you have separately received it.</li>

<li>d) If the work has interactive user interfaces, each must display
    Appropriate Legal Notices; however, if the Program has interactive
    interfaces that do not display Appropriate Legal Notices, your
    work need not make them do so.</li>

</ul>

<p>A compilation of a covered work with other separate and independent
works, which are not by their nature extensions of the covered work,
and which are not combined with it such as to form a larger program,
in or on a volume of a storage or distribution medium, is called an
"aggregate" if the compilation and its resulting copyright are not
used to limit the access or legal rights of the compilation''s users
beyond what the individual works permit.  Inclusion of a covered work
in an aggregate does not cause this License to apply to the other
parts of the aggregate.</p>

<h4><a name="section6"></a>6. Conveying Non-Source Forms.</h4>

<p>You may convey a covered work in object code form under the terms
of sections 4 and 5, provided that you also convey the
machine-readable Corresponding Source under the terms of this License,
in one of these ways:</p>

<ul>

<li>a) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by the
    Corresponding Source fixed on a durable physical medium
    customarily used for software interchange.</li>

<li>b) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by a
    written offer, valid for at least three years and valid for as
    long as you offer spare parts or customer support for that product
    model, to give anyone who possesses the object code either (1) a
    copy of the Corresponding Source for all the software in the
    product that is covered by this License, on a durable physical
    medium customarily used for software interchange, for a price no
    more than your reasonable cost of physically performing this
    conveying of source, or (2) access to copy the
    Corresponding Source from a network server at no charge.</li>

<li>c) Convey individual copies of the object code with a copy of the
    written offer to provide the Corresponding Source.  This
    alternative is allowed only occasionally and noncommercially, and
    only if you received the object code with such an offer, in accord
    with subsection 6b.</li>

<li>d) Convey the object code by offering access from a designated
    place (gratis or for a charge), and offer equivalent access to the
    Corresponding Source in the same way through the same place at no
    further charge.  You need not require recipients to copy the
    Corresponding Source along with the object code.  If the place to
    copy the object code is a network server, the Corresponding Source
    may be on a different server (operated by you or a third party)
    that supports equivalent copying facilities, provided you maintain
    clear directions next to the object code saying where to find the
    Corresponding Source.  Regardless of what server hosts the
    Corresponding Source, you remain obligated to ensure that it is
    available for as long as needed to satisfy these requirements.</li>

<li>e) Convey the object code using peer-to-peer transmission, provided
    you inform other peers where the object code and Corresponding
    Source of the work are being offered to the general public at no
    charge under subsection 6d.</li>

</ul>

<p>A separable portion of the object code, whose source code is excluded
from the Corresponding Source as a System Library, need not be
included in conveying the object code work.</p>

<p>A "User Product" is either (1) a "consumer product", which means any
tangible personal property which is normally used for personal, family,
or household purposes, or (2) anything designed or sold for incorporation
into a dwelling.  In determining whether a product is a consumer product,
doubtful cases shall be resolved in favor of coverage.  For a particular
product received by a particular user, "normally used" refers to a
typical or common use of that class of product, regardless of the status
of the particular user or of the way in which the particular user
actually uses, or expects or is expected to use, the product.  A product
is a consumer product regardless of whether the product has substantial
commercial, industrial or non-consumer uses, unless such uses represent
the only significant mode of use of the product.</p>

<p>"Installation Information" for a User Product means any methods,
procedures, authorization keys, or other information required to install
and execute modified versions of a covered work in that User Product from
a modified version of its Corresponding Source.  The information must
suffice to ensure that the continued functioning of the modified object
code is in no case prevented or interfered with solely because
modification has been made.</p>

<p>If you convey an object code work under this section in, or with, or
specifically for use in, a User Product, and the conveying occurs as
part of a transaction in which the right of possession and use of the
User Product is transferred to the recipient in perpetuity or for a
fixed term (regardless of how the transaction is characterized), the
Corresponding Source conveyed under this section must be accompanied
by the Installation Information.  But this requirement does not apply
if neither you nor any third party retains the ability to install
modified object code on the User Product (for example, the work has
been installed in ROM).</p>

<p>The requirement to provide Installation Information does not include a
requirement to continue to provide support service, warranty, or updates
for a work that has been modified or installed by the recipient, or for
the User Product in which it has been modified or installed.  Access to a
network may be denied when the modification itself materially and
adversely affects the operation of the network or violates the rules and
protocols for communication across the network.</p>

<p>Corresponding Source conveyed, and Installation Information provided,
in accord with this section must be in a format that is publicly
documented (and with an implementation available to the public in
source code form), and must require no special password or key for
unpacking, reading or copying.</p>

<h4><a name="section7"></a>7. Additional Terms.</h4>

<p>"Additional permissions" are terms that supplement the terms of this
License by making exceptions from one or more of its conditions.
Additional permissions that are applicable to the entire Program shall
be treated as though they were included in this License, to the extent
that they are valid under applicable law.  If additional permissions
apply only to part of the Program, that part may be used separately
under those permissions, but the entire Program remains governed by
this License without regard to the additional permissions.</p>

<p>When you convey a copy of a covered work, you may at your option
remove any additional permissions from that copy, or from any part of
it.  (Additional permissions may be written to require their own
removal in certain cases when you modify the work.)  You may place
additional permissions on material, added by you to a covered work,
for which you have or can give appropriate copyright permission.</p>

<p>Notwithstanding any other provision of this License, for material you
add to a covered work, you may (if authorized by the copyright holders of
that material) supplement the terms of this License with terms:</p>

<ul>

<li>a) Disclaiming warranty or limiting liability differently from the
    terms of sections 15 and 16 of this License; or</li>

<li>b) Requiring preservation of specified reasonable legal notices or
    author attributions in that material or in the Appropriate Legal
    Notices displayed by works containing it; or</li>

<li>c) Prohibiting misrepresentation of the origin of that material, or
    requiring that modified versions of such material be marked in
    reasonable ways as different from the original version; or</li>

<li>d) Limiting the use for publicity purposes of names of licensors or
    authors of the material; or</li>

<li>e) Declining to grant rights under trademark law for use of some
    trade names, trademarks, or service marks; or</li>

<li>f) Requiring indemnification of licensors and authors of that
    material by anyone who conveys the material (or modified versions of
    it) with contractual assumptions of liability to the recipient, for
    any liability that these contractual assumptions directly impose on
    those licensors and authors.</li>

</ul>

<p>All other non-permissive additional terms are considered "further
restrictions" within the meaning of section 10.  If the Program as you
received it, or any part of it, contains a notice stating that it is
governed by this License along with a term that is a further restriction,
you may remove that term.  If a license document contains a further
restriction but permits relicensing or conveying under this License, you
may add to a covered work material governed by the terms of that license
document, provided that the further restriction does not survive such
relicensing or conveying.</p>

<p>If you add terms to a covered work in accord with this section, you
must place, in the relevant source files, a statement of the
additional terms that apply to those files, or a notice indicating
where to find the applicable terms.</p>

<p>Additional terms, permissive or non-permissive, may be stated in the
form of a separately written license, or stated as exceptions;
the above requirements apply either way.</p>

<h4><a name="section8"></a>8. Termination.</h4>

<p>You may not propagate or modify a covered work except as expressly
provided under this License.  Any attempt otherwise to propagate or
modify it is void, and will automatically terminate your rights under
this License (including any patent licenses granted under the third
paragraph of section 11).</p>

<p>However, if you cease all violation of this License, then your
license from a particular copyright holder is reinstated (a)
provisionally, unless and until the copyright holder explicitly and
finally terminates your license, and (b) permanently, if the copyright
holder fails to notify you of the violation by some reasonable means
prior to 60 days after the cessation.</p>

<p>Moreover, your license from a particular copyright holder is
reinstated permanently if the copyright holder notifies you of the
violation by some reasonable means, this is the first time you have
received notice of violation of this License (for any work) from that
copyright holder, and you cure the violation prior to 30 days after
your receipt of the notice.</p>

<p>Termination of your rights under this section does not terminate the
licenses of parties who have received copies or rights from you under
this License.  If your rights have been terminated and not permanently
reinstated, you do not qualify to receive new licenses for the same
material under section 10.</p>

<h4><a name="section9"></a>9. Acceptance Not Required for Having Copies.</h4>

<p>You are not required to accept this License in order to receive or
run a copy of the Program.  Ancillary propagation of a covered work
occurring solely as a consequence of using peer-to-peer transmission
to receive a copy likewise does not require acceptance.  However,
nothing other than this License grants you permission to propagate or
modify any covered work.  These actions infringe copyright if you do
not accept this License.  Therefore, by modifying or propagating a
covered work, you indicate your acceptance of this License to do so.</p>

<h4><a name="section10"></a>10. Automatic Licensing of Downstream Recipients.</h4>

<p>Each time you convey a covered work, the recipient automatically
receives a license from the original licensors, to run, modify and
propagate that work, subject to this License.  You are not responsible
for enforcing compliance by third parties with this License.</p>

<p>An "entity transaction" is a transaction transferring control of an
organization, or substantially all assets of one, or subdividing an
organization, or merging organizations.  If propagation of a covered
work results from an entity transaction, each party to that
transaction who receives a copy of the work also receives whatever
licenses to the work the party''s predecessor in interest had or could
give under the previous paragraph, plus a right to possession of the
Corresponding Source of the work from the predecessor in interest, if
the predecessor has it or can get it with reasonable efforts.</p>

<p>You may not impose any further restrictions on the exercise of the
rights granted or affirmed under this License.  For example, you may
not impose a license fee, royalty, or other charge for exercise of
rights granted under this License, and you may not initiate litigation
(including a cross-claim or counterclaim in a lawsuit) alleging that
any patent claim is infringed by making, using, selling, offering for
sale, or importing the Program or any portion of it.</p>

<h4><a name="section11"></a>11. Patents.</h4>

<p>A "contributor" is a copyright holder who authorizes use under this
License of the Program or a work on which the Program is based.  The
work thus licensed is called the contributor''s "contributor version".</p>

<p>A contributor''s "essential patent claims" are all patent claims
owned or controlled by the contributor, whether already acquired or
hereafter acquired, that would be infringed by some manner, permitted
by this License, of making, using, or selling its contributor version,
but do not include claims that would be infringed only as a
consequence of further modification of the contributor version.  For
purposes of this definition, "control" includes the right to grant
patent sublicenses in a manner consistent with the requirements of
this License.</p>

<p>Each contributor grants you a non-exclusive, worldwide, royalty-free
patent license under the contributor''s essential patent claims, to
make, use, sell, offer for sale, import and otherwise run, modify and
propagate the contents of its contributor version.</p>

<p>In the following three paragraphs, a "patent license" is any express
agreement or commitment, however denominated, not to enforce a patent
(such as an express permission to practice a patent or covenant not to
sue for patent infringement).  To "grant" such a patent license to a
party means to make such an agreement or commitment not to enforce a
patent against the party.</p>

<p>If you convey a covered work, knowingly relying on a patent license,
and the Corresponding Source of the work is not available for anyone
to copy, free of charge and under the terms of this License, through a
publicly available network server or other readily accessible means,
then you must either (1) cause the Corresponding Source to be so
available, or (2) arrange to deprive yourself of the benefit of the
patent license for this particular work, or (3) arrange, in a manner
consistent with the requirements of this License, to extend the patent
license to downstream recipients.  "Knowingly relying" means you have
actual knowledge that, but for the patent license, your conveying the
covered work in a country, or your recipient''s use of the covered work
in a country, would infringe one or more identifiable patents in that
country that you have reason to believe are valid.</p>

<p>If, pursuant to or in connection with a single transaction or
arrangement, you convey, or propagate by procuring conveyance of, a
covered work, and grant a patent license to some of the parties
receiving the covered work authorizing them to use, propagate, modify
or convey a specific copy of the covered work, then the patent license
you grant is automatically extended to all recipients of the covered
work and works based on it.</p>

<p>A patent license is "discriminatory" if it does not include within
the scope of its coverage, prohibits the exercise of, or is
conditioned on the non-exercise of one or more of the rights that are
specifically granted under this License.  You may not convey a covered
work if you are a party to an arrangement with a third party that is
in the business of distributing software, under which you make payment
to the third party based on the extent of your activity of conveying
the work, and under which the third party grants, to any of the
parties who would receive the covered work from you, a discriminatory
patent license (a) in connection with copies of the covered work
conveyed by you (or copies made from those copies), or (b) primarily
for and in connection with specific products or compilations that
contain the covered work, unless you entered into that arrangement,
or that patent license was granted, prior to 28 March 2007.</p>

<p>Nothing in this License shall be construed as excluding or limiting
any implied license or other defenses to infringement that may
otherwise be available to you under applicable patent law.</p>

<h4><a name="section12"></a>12. No Surrender of Others'' Freedom.</h4>

<p>If conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot convey a
covered work so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you may
not convey it at all.  For example, if you agree to terms that obligate you
to collect a royalty for further conveying from those to whom you convey
the Program, the only way you could satisfy both those terms and this
License would be to refrain entirely from conveying the Program.</p>

<h4><a name="section13"></a>13. Remote Network Interaction; Use with the GNU General Public License.</h4>

<p>Notwithstanding any other provision of this License, if you modify the
Program, your modified version must prominently offer all users
interacting with it remotely through a computer network (if your version
supports such interaction) an opportunity to receive the Corresponding
Source of your version by providing access to the Corresponding Source
from a network server at no charge, through some standard or customary
means of facilitating copying of software.  This Corresponding Source
shall include the Corresponding Source for any work covered by version 3
of the GNU General Public License that is incorporated pursuant to the
following paragraph.</p>

<p>Notwithstanding any other provision of this License, you have permission
to link or combine any covered work with a work licensed under version 3
of the GNU General Public License into a single combined work, and to
convey the resulting work.  The terms of this License will continue to
apply to the part which is the covered work, but the work with which it is
combined will remain governed by version 3 of the GNU General Public
License.</p>

<h4><a name="section14"></a>14. Revised Versions of this License.</h4>

<p>The Free Software Foundation may publish revised and/or new versions of
the GNU Affero General Public License from time to time.  Such new
versions will be similar in spirit to the present version, but may differ
in detail to address new problems or concerns.</p>

<p>Each version is given a distinguishing version number.  If the
Program specifies that a certain numbered version of the GNU Affero
General Public License "or any later version" applies to it, you have
the option of following the terms and conditions either of that
numbered version or of any later version published by the Free
Software Foundation.  If the Program does not specify a version number
of the GNU Affero General Public License, you may choose any version
ever published by the Free Software Foundation.</p>

<p>If the Program specifies that a proxy can decide which future
versions of the GNU Affero General Public License can be used, that
proxy''s public statement of acceptance of a version permanently
authorizes you to choose that version for the Program.</p>

<p>Later license versions may give you additional or different
permissions.  However, no additional obligations are imposed on any
author or copyright holder as a result of your choosing to follow a
later version.</p>

<h4><a name="section15"></a>15. Disclaimer of Warranty.</h4>

<p>THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY
APPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT
HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY
OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM
IS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
ALL NECESSARY SERVICING, REPAIR OR CORRECTION.</p>

<h4><a name="section16"></a>16. Limitation of Liability.</h4>

<p>IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS
THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY
GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE
USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF
DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD
PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),
EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF
SUCH DAMAGES.</p>

<h4><a name="section17"></a>17. Interpretation of Sections 15 and 16.</h4>

<p>If the disclaimer of warranty and limitation of liability provided
above cannot be given local legal effect according to their terms,
reviewing courts shall apply local law that most closely approximates
an absolute waiver of all civil liability in connection with the
Program, unless a warranty or assumption of liability accompanies a
copy of the Program in return for a fee.</p>

<p>END OF TERMS AND CONDITIONS</p>

<h3><a name="howto"></a>How to Apply These Terms to Your New Programs</h3>

<p>If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.</p>

<p>To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
state the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.</p>

<pre>    &lt;one line to give the program''s name and a brief idea of what it does.&gt;
    Copyright (C) &lt;year&gt;  &lt;name of author&gt;

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see &lt;http://www.gnu.org/licenses/&gt;.
</pre>

<p>Also add information on how to contact you by electronic and paper mail.</p>

<p>If your software can interact with users remotely through a computer
network, you should also make sure that it provides a way for users to
get its source.  For example, if your program is a web application, its
interface could display a "Source" link that leads users to an archive
of the code.  There are many ways you could offer source, and different
solutions will be better for different programs; see section 13 for the
specific requirements.</p>

<p>You should also get your employer (if you work as a programmer) or school,
if any, to sign a "copyright disclaimer" for the program, if necessary.
For more information on this, and how to apply and follow the GNU AGPL, see
&lt;<a href="http://www.gnu.org/licenses/">http://www.gnu.org/licenses/</a>&gt;.</p>';
-------ü-break-for-sqlite
                     
CREATE TABLE renderfields
(
sortkey int,
k varchar(255),
display varchar(255),
buttons boolean,
img varchar(255),
title varchar(1000),
cl varchar(255),
fs varchar(1000),
html boolean
);
-------ü-break-for-sqlite
CREATE UNIQUE INDEX SORTKEY_RENDERFIELDS_IDX ON renderfields(sortkey ASC);
-------ü-break-for-sqlite
INSERT INTO renderfields
SELECT       10 as 'sortkey', 'Nr' AS 'k', '#' AS 'display', null AS 'buttons', null AS 'img', null AS 'title', null AS 'cl', null AS 'fs', null AS 'html'
UNION SELECT 20,'Substanz','Name',1,null,null,null,null,null
UNION SELECT 30,'Struktur',null,null,'formulae/png/%1.png','Strukturformel','ama-sf',null,null
UNION SELECT 40,'t1','1',null,null,'Tiaft System 1','ama-tiaft',null,null
UNION SELECT 50,'t2','2',null,null,'Tiaft System 2','ama-tiaft',null,null
UNION SELECT 60,'t3','3',null,null,'Tiaft System 3','ama-tiaft',null,null
UNION SELECT 70,'t4','4',null,null,'Tiaft System 4','ama-tiaft',null,null
UNION SELECT 80,'t5','5',null,null,'Tiaft System 5','ama-tiaft',null,null
UNION SELECT 90,'t6','6',null,null,'Tiaft System 6','ama-tiaft',null,null
UNION SELECT 100,'t7','7',null,null,'Tiaft System 7','ama-tiaft',null,null
UNION SELECT 110,'t8','8',null,null,'Tiaft System 8','ama-tiaft',null,null
UNION SELECT 120,'t9','9',null,null,'Tiaft System 9','ama-tiaft',null,null
UNION SELECT 130,'Ehrlich','Eh',null,null,'Farbreaktion mit Ehrlichs Reagenz','ama-fr','Ehrlich',null
UNION SELECT 140,'FeCl3','Fe&shy;Cl<sub>3</sub>',null,null,'Farbreaktion mit Eisen(III)-chlorid','ama-fr','FeCl<sub>3</sub>',null
UNION SELECT 150,'DD',null,null,null,'Farbreaktion mit Dragendorffs Reagenz','ama-fr','Dragendorff',null
UNION SELECT 160,'Ninh','NH',null,null,'Farbreaktion mit Ninhydrin','ama-fr','Ninhydrin',null
UNION SELECT 170,'EB',null,null,null,'Farbreaktion mit Echtblau','ama-fr','Echtblau',null
UNION SELECT 180,'IP',null,null,null,'Farbreaktion mit Iodplatinat','ama-fr','Iodplatinat',null
UNION SELECT 190,'Kieff','Ki',null,null,'Farbreaktion mit Kieffers Reagenz','ama-fr','Kieffer',null
UNION SELECT 200,'Gibbs','Gib',null,null,'Farbreaktion mit Gibbs Reagenz','ama-fr','Gibbs',null
UNION SELECT 210,'BG',null,null,null,'Farbreaktion mit Bromcresolgrün','ama-fr','Bromcresolgrün',null
UNION SELECT 220,'UV',null,null,null,'UV Löschung (254 nm)',null,'UV Löschung bei (254 nm)',null
UNION SELECT 230,'Phase','Phs',null,null,'Phase im Stas-Otto-Trennungsgang: S-Säuren; B-Basen; sB-schwache Basen; N-Neutralstoffe; E-Ethylacetat-extrahierbare Substanzen; ne-nicht extrahierbar',null,null,null
UNION SELECT 240,'Beobachtungen',null,null,null,null,'ama-beo',null,1
UNION SELECT 250,'EigenschaftenundPrüfung','Eigenschaften u. Prüfung',null,null,null,'ama-eigensch',null,1
UNION SELECT 260,'Indikation',null,null,null,null,'ama-ind',null,null;
-------ü-break-for-sqlite

CREATE TABLE queryfields
(
sortkey int,
k varchar(255),
pattern CLOB,
display varchar(1000),
field varchar(255),
fieldinfo varchar(255),
help CLOB,
required boolean,
isID boolean,
isNumber boolean,
qgroup varchar(255),
isStructure boolean
);
-------ü-break-for-sqlite
CREATE UNIQUE INDEX SORTKEY_QUERYFIELDS_IDX ON queryfields('sortkey' ASC);
-------ü-break-for-sqlite
INSERT INTO queryfields
SELECT       10 as 'sortkey', 'Substanz' as 'k', null AS 'pattern', 'Name der Substanz' AS 'display', 'text' AS 'field', '|255' AS 'fieldinfo', 'h' AS 'help', 1 AS 'required', null AS 'isID', null AS 'isNumber', null AS 'qgroup', null AS 'isStructure'
UNION SELECT 30, 'Beobachtungen', null, 'Beobachtungen', 'htmledit', null, 'h', null, null, null, null, null
UNION SELECT 40, 'EigenschaftenundPrüfung', null, 'Eigenschaften und Prüfung', 'htmledit', null, 'h', null, null, null, null, null
UNION SELECT 50, 'Indikation', null, 'Indikation', 'textarea', null, 'h', null, null, null, null, null
UNION SELECT 60, 'ID', null, null, null, null, 'h', null, 1, null, null, null
UNION SELECT 70, 'Nr', null, null, null, null, 'h', null, null, 1, null, null
UNION SELECT 80, 't1', 'reTiaft', 'hRf* Tiaft 1', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 90, 't2', 'reTiaft', 'hRf* Tiaft 2', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 100, 't3', 'reTiaft', 'hRf* Tiaft 3', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 110, 't4', 'reTiaft', 'hRf* Tiaft 4', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 120, 't5', 'reTiaft', 'hRf* Tiaft 5', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 130, 't6', 'reTiaft', 'hRf* Tiaft 6', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 140, 't7', 'reTiaft', 'hRf* Tiaft 7', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 150, 't8', 'reTiaft', 'hRf* Tiaft 8', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 160, 't9', 'reTiaft', 'hRf* Tiaft 9', 'text', '5|3', 'h', null, null, null, 'tiaft', null
UNION SELECT 170, 'Ehrlich', 'reFR', 'Ehrlichs Reagenz', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 180, 'FeCl3', 'reFR', 'Eisen(III)-chlorid', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 190, 'DD', 'reFR', 'Dragendorffs Reagenz', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 200, 'Ninh', 'reFR', 'Ninhydrin', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 210, 'EB', 'reFR', 'Echtblau', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 220, 'IP', 'reFR', 'Iodplatinat', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 230, 'Kieff', 'reFR', 'Kieffers Reagenz', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 240, 'Gibbs', 'reFR', 'Gibbs Reagenz', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 250, 'BG', 'reFR', 'Bromcresolgrün', 'text', '5|20', 'h', null, null, null, 'fr', null
UNION SELECT 260, 'UV', 'reFR', 'UV Löschung bei (254 nm)', 'text', '5|20', 'h', null, null, null, 'wb', null
UNION SELECT 270, 'Phase', '^(?:S|B|sB|N|Am|E|ne|alle){1,}$', 'Phase im Stas-Otto-Trennungsgang', 'text', '5|20', 'h', null, null, null, 'wb', null
UNION SELECT 280, 'PubChem', null, 'PubChem identifier', 'text', '|100', 'h', null, null, null, 'wb', null
UNION SELECT 290, 'CAS', '\d{2,}-\d\d-\d', 'CAS', 'text', '|100', 'CAS Registry Number is a Registered Trademark of the American Chemical Society', null, null, null, 'wb', null
UNION SELECT 300, 'MasterOnly', null, 'Notizen (Nur Master-Version)', 'htmledit', null, 'h', null, null, null, 'wb', null
UNION SELECT 310, 'Struktur', '^\w{3,100}$', 'Name der Strukturformeldatei', 'formulaedit', '50|100', '3-100 Zeichen, keine Sonderzeichen', null, null, null, null, 1;
-------ü-break-for-sqlite


CREATE TABLE querygroupinfo
(
k varchar(255),
display varchar(1000),
cls varchar(500)
);
-------ü-break-for-sqlite
CREATE UNIQUE INDEX KEY_QUERYGROUPINFO_IDX ON querygroupinfo('k' ASC);
-------ü-break-for-sqlite
INSERT INTO querygroupinfo
SELECT       'tiaft' as 'k', 'TIAFT-Werte [0-100, - oder Leerstring]' AS 'display', 'ama-tiaft-inputs' AS 'cls'
UNION SELECT 'fr', 'Farbreaktionen mit … [++, +, (+), (-), -]', 'ama-fr-inputs'
UNION SELECT 'wb', 'Weitere Informationen', 'ama-further-inputs';
-------ü-break-for-sqlite


CREATE TABLE hrfcorr
(
'hc_system' varchar(50),
'hc_substance' varchar(255),
'hc_hrfc' int
);
-------ü-break-for-sqlite
INSERT INTO hrfcorr
SELECT       '1' as 'hc_system', 'Paracetamol' AS 'hc_substance', 15 AS 'hc_hrfc'
UNION SELECT '1',                'Phenacetin',                    38
UNION SELECT '1',                'Benzocain',                     56
UNION SELECT '1',                'Phenylbutazon',                 80
UNION SELECT '2',                'Sulfathiazol',                  20
UNION SELECT '2',                'Phenacetin',                    37
UNION SELECT '2',                'Salicylamid',                   55
UNION SELECT '2',                'Phenylbutazon',                 68
UNION SELECT '3',                'Acetazolamid',                  18
UNION SELECT '3',                'Sorbinsäure',                   36
UNION SELECT '3',                'Propylhydroxybenzoat',          56
UNION SELECT '3',                'Phenylbutazon',                 76
UNION SELECT '4',                'Sulfadimidin',                  13
UNION SELECT '4',                'Hydrochlorothiazid',            34
UNION SELECT '4',                'Hexobarbital',                  53
UNION SELECT '4',                'Propyphenazon',                 74
UNION SELECT '5',                'Sulpirid',                      17
UNION SELECT '5',                'Procain',                       36
UNION SELECT '5',                'Coffein',                       59
UNION SELECT '5',                'Hexobarbital',                  85
UNION SELECT '6',                'Neostigminbromid',              13
UNION SELECT '6',                'Propanthelinbromid',            31
UNION SELECT '6',                'Tolazolin',                     55
UNION SELECT '7',                'Atropin',                       18
UNION SELECT '7',                'Antazolin',                     31
UNION SELECT '7',                'Coffein',                       52
UNION SELECT '7',                'Bromhexin',                     75
UNION SELECT '8',                'Propanolol',                     6
UNION SELECT '8',                'Noscapin',                      21
UNION SELECT '8',                'Diphenylhydramin',              44
UNION SELECT '8',                'Bromhexin',                     69
UNION SELECT '9',                'Chinin',                        11
UNION SELECT '9',                'Diphenylhydramin',              33
UNION SELECT '9',                'Coffein',                       58
UNION SELECT '9',                'Bromhexin',                     82;