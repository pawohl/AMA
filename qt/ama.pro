HEADERS = \
	connection.h \
	mainwindow.h \
        amaqtbridge.h \
        sqlhelpers.h \
        amaserver.h
   
RESOURCES = resources/ama.qrc
SOURCES = \
	main.cpp \
	mainwindow.cpp \
        amaqtbridge.cpp \
        sqlhelpers.cpp \
        amaserver.cpp

QT *= sql svg opengl network webkit webkitwidgets widgets
QT -= quick

CONFIG(debug, release|debug):DEFINES *= _DEBUG
DEFINES *= QT_USE_QSTRINGBUILDER

win32 {
    updatebuild {
        build_icon.commands = $${_PRO_FILE_PWD_}/build_win_icon.bat "$${_PRO_FILE_PWD_}" "$${OUT_PWD}/update_resource.rc" "update.ico"
        build_icon.output = "$${OUT_PWD}/update_resource.rc"
    } else {
        build_nr.commands = $${_PRO_FILE_PWD_}/build_inc_vers.bat "$${_PRO_FILE_PWD_}" "$$[QT_VERSION]"
        build_nr.depends = FORCE

        build_icon.commands = $${_PRO_FILE_PWD_}/build_win_icon.bat "$${_PRO_FILE_PWD_}" "$${OUT_PWD}/ama_resource.rc" "favicon.ico"
        build_icon.output = "$${OUT_PWD}/ama_resource.rc"

        QMAKE_EXTRA_TARGETS += build_nr
        PRE_TARGETDEPS += build_nr
        TARGET = ama
    }
    QMAKE_EXTRA_TARGETS += build_icon
    PRE_TARGETDEPS += build_icon
    include(build_vers.inc)
    VERSION = $$BUILD_NUMBER
}
updatebuild {
    TARGET = update
    DEFINES *= _UPDATEBUILD
    DESTDIR = update
    OBJECTS_DIR = update
    MOC_DIR = update
    RCC_DIR = update
    UI_DIR = update
}

HEADERS += build_vers.h
