@ECHO OFF
ECHO WINBUILD: Incrementing build number.
SET /p var= <"%1\build_number.txt"
SET /a var= %var%+1 
SET /p ver= <"%1\build_major_version.txt"
ECHO %var% >"%1\build_number.txt"
ECHO // This file is created and updated by build_inc.bat on each build-step >"%1\build_vers.h"
ECHO #define BUILD_NUMBER "%ver%.%var%.Qt%2" >>"%1\build_vers.h"
ECHO # This file is created and updated by build_inc.bat on each build-step >"%1\build_vers.inc"
ECHO BUILD_NUMBER = "%ver%.%var%" >>"%1\build_vers.inc"
ECHO %ver%.%var%