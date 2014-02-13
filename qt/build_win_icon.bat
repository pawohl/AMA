@ECHO OFF
REM   This batch file adds the contents of ama.rc to the Qt-created resource file in the build-directory
find /c "IDI_ICON1" "%2"
IF errorlevel 1 GOTO notfound
GOTO :eof
:notfound
ECHO IDI_ICON1 ICON DISCARDABLE "%1/resources/images/%3">>"%2"
cscript "%1/build_win_icon.vbs" /f:"%2"
ECHO RC patched