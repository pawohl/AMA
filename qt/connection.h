/****************************************************************************
**
** Copyright (C) 2013 Felix Pahlow.
** http://pc.pharmazie.uni-halle.de/biochempharm/mitarbeiter/frohberg/
**
** Diese Sofware wurde im Rahmen der Wahlpflichtarbeit
** im Studiengang Pharmazie erstellt.
**
**
** $QT_BEGIN_LICENSE:AGPL.v3$
** AMA.APP is intellectual property by Felix Pahlow.
**
** This program is free software: you can redistribute it and/or modify
** it under the terms of the GNU Affero General Public License as published
** by the Free Software Foundation, version 3 of the License.
**
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
** GNU Affero General Public License for more details.
**
** $QT_END_LICENSE$
**
** $QT_BEGIN_LICENSE:MIT$
** Copyright (c) 2013 Felix Pahlow
**
** Permission is hereby granted, free of charge, to any person
** obtaining a copy of this software and associated documentation
** files (the "Software"), to deal in the Software without
** restriction, including without limitation the rights to use,
** copy, modify, merge, publish, distribute, sublicense, and/or sell
** copies of the Software, and to permit persons to whom the
** Software is furnished to do so, subject to the following
** conditions:
**
** The above copyright notice and this permission notice shall be
** included in all copies or substantial portions of the Software.
**
** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
** OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
** NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
** HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
** WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
** FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
** OTHER DEALINGS IN THE SOFTWARE.
** $QT_END_LICENSE$
**
****************************************************************************/

#ifndef CONNECTION_H
#define CONNECTION_H

#include <QErrorMessage>
#include <QSqlDatabase>
#include <QSqlError>
#include <QSqlQuery>
#include <QtWidgets>
#include <QFile>

QSqlDatabase db;
QString dbPath = "AMA.sqlite";
QString appDirectory;

static bool connectToDB()
{
    appDirectory = QFileInfo( QCoreApplication::applicationFilePath() ).canonicalPath();

    db = QSqlDatabase::addDatabase("QSQLITE");

    dbPath = QFileInfo( appDirectory, dbPath ).canonicalFilePath();
    qDebug() << dbPath;
    db.setDatabaseName(dbPath);
    if (!db.open()) {
        QErrorMessage *qem = new QErrorMessage();
        qem->setWindowTitle(qApp->tr("Database not found or database drivers missing"));
        qem->showMessage(
            qApp->tr("Unable to establish a database connection.\n"
                     "This application needs SQLite support and the compounds database in place.\n"
                     "You can download the coumpounds database at <TODO: Download path - Dr. Petra Frohberg Uni Halle has a copy>"
                     "The database must be in the application's directory. "
                     "Die Datenbank muss sich im selben Verzeichnis wie die Anwendung befinden. "
                     "The name of the database must be AMA.sqlite. Der Name der Datenbank muss AMA.sqlite lauten.\n"
                     "For building the SQLite database drivers, Please read"
                     "the Qt SQL driver documentation.\n\n"), "ama_sql_db_not_found");

        return false;
    }
    return true;
}

static QString backUpDB() {
    db.commit();
    db.close();
    QFile f(db.databaseName());
    f.open(QIODevice::ReadOnly);
    // Note that the "/" as directory separator works for all systems supported by Qt
    QString backUpPath = appDirectory + "/" + QDateTime::currentDateTimeUtc().toString("'backup_'yyyy-MM-dd hh-mm-ss'.sqlite'");
    qDebug() << "Database: " << db.databaseName() << "\n\t New file:" << QDateTime::currentDateTimeUtc().toString("'backup_'yyyy-MM-dd hh-mm-ss'.sqlite'") << backUpPath;
    if (!f.copy(backUpPath)) backUpPath = "";
    db.open();
    return backUpPath;
}

#endif
