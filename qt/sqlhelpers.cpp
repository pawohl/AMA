/****************************************************************************
**
** Copyright (C) 2013 Felix Pahlow.
** http://pc.pharmazie.uni-halle.de/biochempharm/mitarbeiter/frohberg/
**
** Diese Sofware wurde im Rahmen der Wahlpflichtarbeit
** im Studiengang Pharmazie erstellt.
**
** AMA.APP ist freie Software; Sie besteht aus einer HTML-Komponente,
** die gemeinsam von Master- und Studentenversion benutzt wird und
** dieser Qt-Komponente <http://qt-project.org/>, welche ausschließlich
** durch die Masterversion genutzt wird und die Datenbankvervaltung übernimmt.
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


#include "sqlhelpers.h"

#include <QFile>
#include <QSqlQuery>
#include <QSqlDatabase>
#include <QStringList>
#include <QDebug>
#include <QSqlError>

SQLHelpers::SQLHelpers(QObject* parent)
    : QObject(parent)
{
}

/**
* @brief executeQueriesFromFile Read each line from a .sql QFile
* (assumed to not have been opened before this function), and when ; is reached, execute
* the SQL gathered until then on the query object. Then do this until a COMMIT SQL
* statement is found. In other words, this function assumes each file is a single
* SQL transaction, ending with a COMMIT line.
* @derivative_work_of
* @source https://gist.github.com/savolai/6852986
*/

void SQLHelpers::executeQueriesFromFile(QFile *file, QSqlQuery *query)
{
    QStringList fileContents = QString(file->readAll()).split("-------ü-break-for-sqlite");
    QStringListIterator it(fileContents);
    while (it.hasNext()) {
        QString command = it.next();
        if (!command.trimmed().isEmpty()) {
            query->exec(command);
        }
        if(!query->isActive()){
            qDebug() << QSqlDatabase::drivers();
            qDebug() << query->lastError();
            qDebug() << "test executed query:"<< query->executedQuery();
            qDebug() << "test last query:"<< query->lastQuery();
        }
    }
}
