Const TristateFalse = 0
Const ForReading    = 1
Const ForWriting    = 2

Dim objFSO, objFile, strString

Set objRE = New RegExp
Set objFSO = CreateObject( "Scripting.FileSystemObject" )

Set objFile = objFSO.OpenTextFile ( WScript.Arguments.Named.Item("f"), ForReading, False, TristateFalse )

strString = objFile.ReadAll()
objFile.Close
Set objFile = Nothing

strString = Replace(strString, "VALUE ""CompanyName"", ""\0""", "VALUE ""CompanyName"", ""Martin-Luther-Universität Halle-Wittenberg\0""")
strString = Replace(strString, "VALUE ""FileDescription"", ""\0""", "VALUE ""FileDescription"", ""Master-Version der Such- bzw. Filteranwendung für die Arzneimittelanalytik. Mit Hilfe von Rf-Werten aus der Dünnschichtchromatographie (DC) und Farbreaktionen auf Arzneimittel oder toxikologisch relevante Stoffe rückschließen.\0""")
strString = Replace(strString, "VALUE ""LegalCopyright"", ""\0""", "VALUE ""LegalCopyright"", ""Zusammenstellung: Felix Pahlow, Daten: Dr. Petra Frohberg. AGPL\0""")
strString = Replace(strString, "0x0409", "0x0407")

Set objFile = objFSO.OpenTextFile ( WScript.Arguments.Named.Item("f"), ForWriting, True, TristateFalse )
objFile.Write strString
objFile.Close
Set objFile = Nothing