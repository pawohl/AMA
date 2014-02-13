Wscript.Echo "begin."
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objSuperFolder = objFSO.GetFolder(WScript.Arguments(0))
Call ShowSubfolders (objSuperFolder, WScript.Arguments(0))

Wscript.Echo "end."

WScript.Quit 0

Sub ShowSubFolders(fFolder, pathRel)
    Set objFolder = objFSO.GetFolder(fFolder.Path)
    Set colFiles = objFolder.Files
    For Each objFile in colFiles
        Wscript.Echo "<file noinclude=""true"">" & pathRel & "/" & objFile.Name & "</file>"
    Next

    For Each Subfolder in fFolder.SubFolders
		subdirpath = pathRel & "/" & Subfolder.Name
        ShowSubFolders Subfolder, subdirpath
    Next
End Sub