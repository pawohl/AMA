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

/// TODO: XHRify methods that can be supported by a server such is creating a ZIP containing
/// the student version

#include "amaqtbridge.h"
#include "connection.h"
#include "sqlhelpers.h"
#include "build_vers.h"

#include <QApplication>
#include <QMessageBox>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QNetworkAccessManager>
#include <QNetworkDiskCache>
#include <QXmlStreamReader>

#include <QDir>
#include <QFileInfo>
#include <QFile>
#include <QFileDialog>

#if defined (Q_OS_WIN)
    #include <QProcess>
#else
    #include <QDesktopServices>
#endif


/*!
 * This class operates as follows:
 *
 */

//! [ AMAQtBridge - Constructor ]
AMAQtBridge::AMAQtBridge(QNetworkDiskCache* netcache, QWebView* parent)
    : QObject(parent), m_cache(netcache)
{
    m_listFilled = false;
    m_app_dir = &appDirectory;

    /*  AMAQtBridge only wants to receive http responses
        for requests that it makes, so that's why it has its own
        QNetworkAccessManager. */
    m_network = new QNetworkAccessManager(this);
    /*  We want to share a cache with the web browser,
        in case it has some images we want: */
    m_network->setCache(m_cache);
    m_parent = parent;

    m_db_connected = connectToDB();

    // The following requires a database!
    if (m_db_connected) {
        setUpModels();

        // Now fetch the dirty-state
        if (storedDirtyState()) {
            enqueueUpdateSorting();
        }
        m_id_field = getMetaSetting("CompoundIdField");
    }
    m_excluded_fields << "c_id" << "c_nr";
}
//! [ AMAQtBridge - Constructor ]
AMAQtBridge::~AMAQtBridge()
{
    // Our "creations" will be automatically destroyed.
}

void AMAQtBridge::setUpModels()
{
    m_metadata = new QSqlTableModel(this);
    m_metadata->setTable("META");
    m_metadata->setEditStrategy(QSqlTableModel::OnManualSubmit);
    m_metadata->select();


    m_compounds = new QSqlTableModel(this);
    m_compounds->setTable("COMPOUNDS");
    m_compounds->setSort(m_compounds->fieldIndex("c_nr") , Qt::AscendingOrder);
    m_compounds->setEditStrategy(QSqlTableModel::OnManualSubmit);
    if (!m_compounds->select()) {
        QErrorMessage *qem = new QErrorMessage();
        qem->setWindowTitle(qApp->tr("Data relation error"));
        qem->setWindowModality(Qt::WindowModal);
        qem->showMessage(
                    qApp->tr("Failed to select compound table"
                             " or another error occured during selecting the data."
                             " Please check the database internals.%1")
                            .arg((m_compounds->lastError().isValid() ?
                                      "\n\n Error message is: " + m_compounds->lastError().text() :
                                      QString())),
                    "ama_sql_select_err");
    }

    m_formulae = new QSqlTableModel(this);
    m_formulae->setTable("FORMULAE");
    m_formulae->setEditStrategy(QSqlTableModel::OnManualSubmit);
    if (!m_formulae->select()) {
        QErrorMessage *qem = new QErrorMessage();
        qem->setWindowTitle(qApp->tr("Data relation error"));
        qem->setWindowModality(Qt::WindowModal);
        qem->showMessage(
                    qApp->tr("Failed to select image table"
                             " or another error occured during selecting the data."
                             " Please check the database internals.%1")
                            .arg((m_compounds->lastError().isValid() ?
                                      "\n\n Error message is: " + m_compounds->lastError().text() :
                                      QString())),
                    "ama_sql_select_err");
    }
    //m_compounds->dataChanged();
    QObject::connect(m_compounds, SIGNAL(dataChanged(QModelIndex,QModelIndex,QVector<int>)),
                     this, SLOT(dataChangedHandler(QModelIndex,QModelIndex,QVector<int>)));
    QObject::connect(m_compounds, SIGNAL(beforeInsert(QSqlRecord&)),
                     this, SLOT(dataInsertedHandler(QSqlRecord&)));
    QObject::connect(m_compounds, SIGNAL(beforeDelete(int)),
                     this, SLOT(dataDeletedHandler(int)));
}
void AMAQtBridge::dataChangedHandler(QModelIndex topLeft, QModelIndex bottomRight, QVector<int> roles)
{
    Q_UNUSED(bottomRight);
    Q_UNUSED(roles);

    int row = topLeft.row();
    QSqlRecord rec =  m_compounds->record(row);
    QVariantMap qm;
    qm.insert("action", "update");
    qm.insert("compound", getMapFromRecord(&rec));
    qm.insert("rowChanged", topLeft.row());
    qm.insert("fieldChanged", rec.fieldName(topLeft.column()));
    emit datasocketChange(qm);
#ifdef _DEBUG
    qDebug() << "Something changed!" << rec.fieldName(topLeft.column());
#endif
}
void AMAQtBridge::dataInsertedHandler(QSqlRecord& record)
{
    QVariantMap qm;
    qm.insert("action", "insert");
    qm.insert("compound", getMapFromRecord(&record));
    // CAVE: This may not have the primary key set because this is done by
    // the database engine. Instead, manually trigger this event.
    // emit datasocketChange(qm);
#ifdef _DEBUG
    qDebug() << "Inserted!";
#endif
}
void AMAQtBridge::dataDeletedHandler(int row)
{
    QVariantMap qm;
    qm.insert("action", "delete");
    qm.insert("rowDeleted", row);
    qm.insert("compound", getMapFromRecord(&(m_compounds->record(row))));
    emit datasocketChange(qm);
#ifdef _DEBUG
    qDebug() << "Deleted!";
#endif
}

void AMAQtBridge::saveData(QString fileName, QString data, QString type)
{
    QVariantMap qm;
    qm["mol"] = "MDL Molfile (*.mol)";
    qm["json"] = "JSON Data (*.json)";
    type = qm.value(type, "All files (*)").toString();
    QString target = QFileDialog::getSaveFileName(m_parent, qApp->tr("Wo sollen die Daten gespeichert werden?"),
                                                  fileName, type);
    if (!target.length()) return;
    QFile f(target);
    if (!f.open(QIODevice::WriteOnly | QIODevice::Text)) {
        qDebug() << "Failed to open data file!";
    }
    f.write(data.toUtf8());
    f.close();
}

bool AMAQtBridge::storedDirtyState()
{
    return !!m_metadata->record(0).value("IsAMADirty").toInt();
}

void AMAQtBridge::setStoredDirtyState(bool dirty)
{
    QSqlRecord r;
    m_metadata->setTable("META");
    m_metadata->select();
    r = m_metadata->record(0);
    r.setValue("IsAMADirty", dirty);
    m_metadata->setRecord(0, r);
    m_metadata->submitAll();
}

QSqlTableModel* AMAQtBridge::getCompoundsTable()
{
    return m_compounds;
}

QVariant AMAQtBridge::getValue(int row, const QString &fieldname)
{
    return m_compounds->record(row).value(fieldname);
}
QString AMAQtBridge::getMetaSetting(const QString &fieldname)
{

    return m_metadata->record(0).value(fieldname).toString();
}
QSqlTableModel* AMAQtBridge::getTableModel(QString table, QString sortkey)
{
    // Pull from the DB
    QSqlTableModel *qm = new QSqlTableModel(this);
    qm->setTable(table);
    if (sortkey.length()) qm->setSort(qm->fieldIndex(sortkey) , Qt::AscendingOrder);
    qm->setEditStrategy(QSqlTableModel::OnManualSubmit);
    qm->select();
    return qm;
}
// WARNING: YOUR RESPONSIBILITY TO SEND A SANE ORDER BY CLAUSE. SQL INJECTION OTHERWISE POSSIBLE
QSqlQueryModel* AMAQtBridge::getQueryModel(QString table, QString orderByClause)
{
    // Pull from the DB
    QSqlQueryModel *qm = new QSqlQueryModel(this);
    qm->setQuery("SELECT * FROM " + db.driver()->escapeIdentifier(table, QSqlDriver::TableName) + " ORDER BY " + orderByClause + ";");
    return qm;
}
QVariantList AMAQtBridge::getListFromTable(QSqlTableModel *m, QString sortkey)
{
    QVariantList qvl;
    QSqlQuery q = m->query();
    q.first();
    q.setForwardOnly(true);


    do {
        QVariantMap qvm;
        QSqlRecord record = q.record();
        int fc = 0;
        do {
            QString fieldname = record.fieldName(fc);
            if (0 == fieldname.length()) break;
            if (sortkey != fieldname) {
                switch (record.field(fc).type()) {
                case QVariant::Int:
                    qvm.insert(fieldname, record.value(fc).toInt());
                    break;
                default:
                    qvm.insert(fieldname, record.value(fc).toString());
                    break;
                }
            }
            fc++;
        } while(1);
        qvl << qvm;
    } while(q.next());
    q.finish();
    return qvl;
}
QVariantMap AMAQtBridge::getMapFromTable(QSqlTableModel *m)
{
    QSqlQuery q = m->query();
    QVariantMap mp;
    q.first();
    q.setForwardOnly(true);

    do {
        QVariantMap qvm;
        QSqlRecord record = q.record();
        QString key;
        int fc = 0;
        do {
            QString fieldname = record.fieldName(fc);
            if (0 == fieldname.length()) break;

            QString value = record.value(fc).toString();
            if (fieldname == "k") {
                key = value;
            } else {
                qvm.insert(fieldname, value);
            }
            fc++;
        } while(1);
        mp.insert(key, qvm);
    } while(q.next());
    q.finish();
    return mp;
}
QVariantMap AMAQtBridge::getMapFromRecord(QSqlRecord *r)
{
    QVariantMap qm;
    int fc = 0;
    do {
        QString fieldname = r->fieldName(fc);
        if (0 == fieldname.length()) break;

        QVariant value = r->value(fc);
        qm.insert(fieldname, value);
        fc++;
    } while(1);
    return qm;
}

QVariantList AMAQtBridge::getRenderFields()
{
    if (m_renderfields.length()) {
        return m_renderfields;
    }
    // Pull from the DB
    QSqlTableModel *qm = getTableModel("renderfields", "sortkey");
    m_renderfields = getListFromTable(qm, "sortkey");
    qm->deleteLater();
    return m_renderfields;
}
QVariantMap AMAQtBridge::getRendergroupinfo()
{
    if (!m_rendergroupinfo.isEmpty()) {
        return m_rendergroupinfo;
    }
    QSqlTableModel *qm = getTableModel("rendergroupinfo", "k");
    m_rendergroupinfo = getMapFromTable(qm);

    qm->deleteLater();
    return m_rendergroupinfo;
}
QVariantList AMAQtBridge::getQueryfields()
{
    if (!m_queryfields.isEmpty()) {
        return m_queryfields;
    }
    // Pull from the DB
    QSqlTableModel *qm = getTableModel("queryfields", "sortkey");
    m_queryfields = getListFromTable(qm, "sortkey");
    qm->deleteLater();
    return m_queryfields;
}
QVariantMap AMAQtBridge::getQuerygroupinfo()
{
    if (!m_querygroupinfo.isEmpty()) {
        return m_querygroupinfo;
    }
    QSqlTableModel *qm = getTableModel("querygroupinfo", "k");
    m_querygroupinfo = getMapFromTable(qm);

    qm->deleteLater();
    return m_querygroupinfo;
}
QVariantList AMAQtBridge::getHrfCorr()
{
    if (!m_hrfcorr.isEmpty()) {
        return m_hrfcorr;
    }
    // Pull from the DB
    // CREATE VIEW hrfcorrsorted AS SELECT * FROM [hrfcorr] ORDER BY hc_system, hc_hrfc;
    QSqlTableModel *qm = getTableModel("hrfcorrsorted", "");
    m_hrfcorr = getListFromTable(qm, "");
    qm->deleteLater();
    return m_hrfcorr;
}
QVariantList AMAQtBridge::getAmaviews()
{
    if (!m_amaviews.isEmpty()) {
        return m_amaviews;
    }
    // Pull from the DB
    QSqlTableModel *qm = getTableModel("amaviews", "");
    m_amaviews = getListFromTable(qm, "");
    qm->deleteLater();
    return m_amaviews;
}

int AMAQtBridge::getRowCount()
{
    m_compounds->setFilter("");
    return m_compounds->rowCount();
}
QVariantList AMAQtBridge::getData()
{
    if (!m_listFilled && isDBConnected()) {
        int rc = getRowCount();
        int idField = m_compounds->record(0).indexOf(m_id_field);
        QString formulaField = getMetaSetting("FormulaField");

        for (int i = 0; i < rc; i++) {
#ifdef _DEBUG
            if (i == 10) break;
#endif
            QSqlRecord record = m_compounds->record(i);
            m_formulae->setFilter("compound_id='" + record.value(idField).toString() + "'");

            QSqlRecord recordImg = m_formulae->record(0);
            QVariantMap qm;
            int fc = 0;
            do {
                QString fieldname = record.fieldName(fc);
                if (0 == fieldname.length()) break;
                qm.insert(fieldname, record.value(fc));
                fc++;
            } while(1);
            // TODO: This should be flexible
            qm.insert(formulaField, recordImg.value(formulaField).toString());
            m_list << qm;
        }
        m_listFilled = true;
    }
    return m_list;
}
QVariantMap AMAQtBridge::getRecord(int ID)
{
    QVariantMap qvm;
    m_compounds->setFilter(m_id_field + "='" + QString::number(ID) + "'");
    m_formulae->setFilter("compound_id='" + QString::number(ID) + "'");

    QSqlRecord record = m_compounds->record(0);
    QSqlRecord recordImg = m_formulae->record(0);
    QString formulaField = getMetaSetting("FormulaField");

    int fc = 0;
    do {
        QString fieldname = record.fieldName(fc);
        if (0 == fieldname.length()) break;
        qvm.insert(fieldname, record.value(fc));
        fc++;
    } while(1);
    // TODO: This should be flexible
    qvm.insert(formulaField, recordImg.value(formulaField).toString());

    return qvm;
}


/// Properties
bool AMAQtBridge::isDBConnected() const {
    return this->m_db_connected;
}
bool AMAQtBridge::isSortingDirty() const {
    return this->m_sortingDirty;
}
QString AMAQtBridge::getAppVersion() const {
    return BUILD_NUMBER;
}
/// Slots
void AMAQtBridge::closeApp()
{
    m_parent->close();
}
void AMAQtBridge::minimizeApp()
{
    m_parent->setWindowState(Qt::WindowMinimized);
}
void AMAQtBridge::fullscreenApp()
{
    m_parent->setWindowState(Qt::WindowFullScreen);
}
void AMAQtBridge::closefullscreenApp()
{
    m_parent->setWindowState(Qt::WindowMaximized);
}
void AMAQtBridge::allowEditApp(bool allow)
{
    m_parent->page()->setContentEditable(allow);
}
void AMAQtBridge::showFileInExplorer(QString filepath)
{
    QFileInfo fi(filepath);
    QString p = fi.canonicalPath();
    QString f = fi.fileName();

#if defined (Q_OS_WIN)
    // Improved handler for M$-Windows
    QProcess *proc = new QProcess(this);
    proc->start("explorer.exe", QStringList() << "/select," << QDir::toNativeSeparators(filepath));
#else
    QDesktopServices::openUrl(QUrl("file:///" + QDir::toNativeSeparators(p), QUrl::TolerantMode));
#endif
}
void AMAQtBridge::packAndGo(QString JSONData, QString JSONModel, QString JSONModelGroup, QString JSONviews, QString version, QString hrfc, QString legend)
{
    // Make a new folder in the user's home folder
    emit packAndGoProgress(10, qApp->tr("Creating main folder."));
    QString folderName = QDateTime::currentDateTimeUtc().toString("'ama_'yyyy-MM-dd hh-mm-ss'_student_version'");
    QDir folder = QDir(QDir::homePath());
    folder.mkdir(folderName);
    folder.cd(folderName);

    folder.mkdir("data");
    folder.cd("data");

    // Create the compoundData.js
    emit packAndGoProgress(20, qApp->tr("Writing JSON."));
    writeJS(folder, "compoundData.js", JSONData);


    // Create renderfields.js
    writeJS(folder, "renderfields.js", JSONModel);

    // Create rendergroupinfo.js
    writeJS(folder, "rendergroupinfo.js", JSONModelGroup);

    // Create amaviews.js
    writeJS(folder, "amaviews.js", JSONviews);

    // Create version.js
    writeJS(folder, "version.js", version.toUtf8()
            .replace(QString("$packageID").toUtf8(), QString(folderName).toUtf8())
            .replace(QString("$BUILD_NUMBER").toUtf8(), QString(BUILD_NUMBER).toUtf8())
            );

    // Create hrfcorr.js
    writeJS(folder, "hrfcorr.js", hrfc);

    // Create legend.js
    writeJS(folder, "legend.js", legend);


    folder.cdUp();

    // Now, export all the images
    int rc = getRowCount();
    int idField = m_compounds->record(0).indexOf(m_id_field);
    QString fileNameField = getMetaSetting("MoleculeImageNameField");

    // TODO: This should be flexible
    emit packAndGoProgress(20, qApp->tr("Creating formula folders."));
    folder.mkdir("formulae");
    folder.cd("formulae");
    folder.mkdir("png");
    folder.mkdir("svg");

    emit packAndGoProgress(30, qApp->tr("Writing formula files."));
    for (int i = 0; i < rc; i++) {
        QSqlRecord record = m_compounds->record(i);
        QString imgFileBaseName = record.value(fileNameField).toString();

        m_formulae->setFilter("compound_id='" + record.value(idField).toString() + "'");
        folder.cd("png");
        QString pngFileLocation = folder.absoluteFilePath(imgFileBaseName + ".png");
        folder.cdUp();
        folder.cd("svg");
        QString svgFileLocation = folder.absoluteFilePath(imgFileBaseName + ".svg");
        folder.cdUp();
        QSqlRecord recordImg = m_formulae->record(0);

        QFile png(pngFileLocation);
        png.open(QIODevice::WriteOnly);
        png.write(recordImg.value("PNG").toByteArray());
        png.close();

        QFile svg(svgFileLocation);
        svg.open(QIODevice::WriteOnly);
        svg.write(recordImg.value("SVG").toByteArray());
        svg.close();
    }
    folder.cdUp();

    // Get the resource file
    emit packAndGoProgress(80, qApp->tr("Writing code files."));
    QFile* rcFile = new QFile(":/ama.qrc");
    rcFile->open(QIODevice::ReadOnly | QIODevice::Text);
    QXmlStreamReader xml(rcFile);
    while (!xml.atEnd()) {
          // Read next element.
          QXmlStreamReader::TokenType token = xml.readNext();
          // If token is just StartDocument, we'll go to next.
          if(token == QXmlStreamReader::StartDocument) {
              continue;
          }
          // If token is StartElement, we'll see if we can read it.
          if(token == QXmlStreamReader::StartElement) {
              if(xml.name() == "file" && !xml.attributes().hasAttribute("noinclude")) {
                  while(xml.readNext() == QXmlStreamReader::Characters)
                  {
                      QFile rf(":/" + xml.text());
                      QString rfDestination = folder.absoluteFilePath( xml.text().toString() );
                      QFileInfo( rfDestination ).absoluteDir().mkpath(".");
                      rf.copy(rfDestination);
                      rf.close();
                  }
              }
          }
    }

    // GHS
    emit packAndGoProgress(90, qApp->tr("GHS"));
    QSqlTableModel* ghsModel = new QSqlTableModel(this);
    ghsModel->setTable("ghs");
    ghsModel->setEditStrategy(QSqlTableModel::OnManualSubmit);
    ghsModel->select();
    rc = ghsModel->rowCount();

    folder.mkdir("images");
    folder.cd("images");
    folder.mkdir("GHS");
    folder.cd("GHS");

    for (int i = 0; i < rc; i++) {
        QSqlRecord record = ghsModel->record(i);
        QString imgFileBaseName = record.value("ghs_code").toString();

        QString pngFileLocation = folder.absoluteFilePath(imgFileBaseName + ".png");
        QString svgFileLocation = folder.absoluteFilePath(imgFileBaseName + ".svg");

        QFile png(pngFileLocation);
        png.open(QIODevice::WriteOnly);
        png.write(record.value("ghs_png").toByteArray());
        png.close();

        QFile svg(svgFileLocation);
        svg.open(QIODevice::WriteOnly);
        svg.write(record.value("ghs_svg").toByteArray());
        svg.close();
    }

    ghsModel->deleteLater();
    folder.cdUp();

    folder.mkdir("photos");
    folder.cd("photos");

    // Substance photos
    emit packAndGoProgress(95, qApp->tr("Substance photos"));
    QDir photoDir(appDirectory + "/" + "photos");
    if (photoDir.exists()) {
        QStringList photos = photoDir.entryList(QDir::Files);
        QString photoName;
        foreach (photoName, photos) {
            QString photoOrigin = photoDir.absoluteFilePath(photoName);
            QString photoDest = folder.absoluteFilePath(photoName);
            QFile::copy(photoOrigin, photoDest);
        }
    }


    folder.cdUp();
    folder.cdUp();

    // AMA-Tool photos
    emit packAndGoProgress(99, qApp->tr("AMA-Tool (Lazarus)"));
    QFile amaTool(appDirectory + "/" + "AMA-Tool-win32.exe");
    if (amaTool.exists()) {
        amaTool.copy(folder.absoluteFilePath("AMA-Tool-win32.exe"));
    }

    // Finish
    emit packAndGoProgress(100, qApp->tr("Done."));
    emit packAndGoProgress(101, folder.absolutePath());
    rcFile->close();
}

void AMAQtBridge::enqueueUpdateSorting() {
    // For performance reasons, do not update "c_nr" each time but only on demand/ quit
    if (!m_sortingDirty) {
        m_sortingDirty = true;
        setStoredDirtyState(m_sortingDirty);
        emit sortingDirtyChange(m_sortingDirty);
        QObject::connect(m_parent, SIGNAL(onWindowClose()), //aboutToQuit || lastWindowClosed are too late!
                         this, SLOT(updateSorting()));
    }
}
void AMAQtBridge::updateSorting()
{
    if (!m_sortingDirty) return; // nothing to do here
    emit sorting();

    bool result = true;

    // This can be slow because name is not indexed and it is not a number but
    // the database won't grow >2000 records so this really isn't a matter
    // on recent computers
    result = result && startTransaction(db);

    int nrFieldIndex = m_compounds->fieldIndex("c_nr");
    m_compounds->setSort(m_compounds->fieldIndex("c_name"), Qt::AscendingOrder);
    m_compounds->select();

    int rc = getRowCount();
    for (int i = 0; i < rc; i++) {
        QSqlRecord record = m_compounds->record(i);
        if (record.value(nrFieldIndex) != i+1) {
            record.setValue(nrFieldIndex, i+1);
            result = result && m_compounds->setRecord(i, record);
        }
    }
    result = result && m_compounds->submitAll();
    result = endTransaction(db, result) && result;

    // No real need to reinstall the sorting by number because
    // this would have the same result as the sorting by Substance name
    // -at least if we did everything correctly but for consistency,
    // let's better do it
    m_compounds->setSort(nrFieldIndex, Qt::AscendingOrder);
    m_compounds->select();

    if (!result) {
        QSqlError qerr = m_compounds->lastError();
        QErrorMessage *qem = new QErrorMessage();
        qem->setWindowTitle(qApp->tr("Unable to correct sorting"));
        qem->showMessage(
            qApp->tr("AMAApp was unable to correct the sorting of the substances.\n%1\n\n")
                        .arg((qerr.isValid() ?
                                  "Error message is: " + qerr.text() +
                                  "Please use the following code when reporting this error: " +
                                  qerr.databaseText() + "|" + qerr.driverText() + "|" + QString(qerr.number()) + "|" + QString(qerr.type()):
                                    QString(""))), "ama_sql_sorting_failed");
    } else {
        m_sortingDirty = false;
        setStoredDirtyState(m_sortingDirty);
        emit sortingDirtyChange(m_sortingDirty);
        qDebug() << "Sorting succeeded.";
    }
}
void AMAQtBridge::invalidateList()
{
    m_listFilled = false;
    m_compounds->setFilter("");
    m_formulae->setFilter("");
    m_list.clear();
}
bool AMAQtBridge::deleteRecord(int ID)
{
    bool result = true;
    m_compounds->setFilter(m_id_field + "='" + QString::number(ID) + "'");
    m_formulae->setFilter("compound_id='" + QString::number(ID) + "'");

    qDebug() << "Delete record " << result;

    result = result && startTransaction(db);

    result = m_compounds->removeRows(0, 1);
    result = result && m_formulae->removeRows(0, 1);

    result = result && m_compounds->submitAll();
    result = result && m_formulae->submitAll();

    qDebug() << "Delete record " << result;

    result = endTransaction(db, result) && result;

    invalidateList();
    enqueueUpdateSorting();
    incrementEditCount(1);
    return result;
}

bool AMAQtBridge::changeRecordById(int ID, QVariantMap data, bool noNull = false)
{
    bool result = true;

    m_compounds->setFilter(m_id_field + "='" + QString::number(ID) + "'");
    QSqlRecord record = m_compounds->record(0);

    QString fieldname = record.fieldName(0);
    for (int fc = 0; 0 != fieldname.length(); ++fc, fieldname = record.fieldName(fc))
    {
        if (m_excluded_fields.contains(fieldname)) continue;

        if (data.contains(fieldname)) {
            record.setValue(fc, data[fieldname]);
            qDebug() << "Setting Data: " << fieldname;
        } else {
            if (noNull) continue;
            record.setNull(fc);
            qDebug() << "Setting Null: " << fieldname;
        }
    };

    m_formulae->setFilter("compound_id='" + QString::number(ID) + "'");
    QSqlRecord formulaRecord = m_formulae->record(0);

    fieldname = formulaRecord.fieldName(0);
    for (int fc = 0; 0 != fieldname.length(); ++fc, fieldname = formulaRecord.fieldName(fc))
    {
        if (m_excluded_fields.contains(fieldname)) continue;

        if (data.contains(fieldname)) {
            formulaRecord.setValue(fc, data[fieldname]);
            qDebug() << "Setting Data: " << fieldname << data[fieldname];
        } else {
            // We cannot create all file types using the web-interface
            // Therefore not setting these fields to null at this stage
            // formulaRecord.setNull(fc);
            // qDebug() << "Setting Null: " << fieldname;
        }
    };

    result = result && startTransaction(db);

    result = result && m_compounds->setRecord(0, record);
    qDebug() << result << " at setRecord in changeRecord";
    result = result && m_formulae->setRecord(0, formulaRecord);
    qDebug() << result << " at setRecord in changeRecord";

    result = result && m_compounds->submitAll();
    qDebug() << result << " after submitting " << m_compounds->lastError();
    result = result && m_formulae->submitAll();
    qDebug() << result << " after submitting " << m_compounds->lastError();

    result = endTransaction(db, result) && result;

    invalidateList();
    enqueueUpdateSorting();
    incrementEditCount(4);
    return result;
}
bool AMAQtBridge::changeRecord(QVariantMap data)
{
    return changeRecordById(data[m_id_field].toInt(), data, true);
}

bool AMAQtBridge::purgeFromCache(QString rc)
{
    return m_cache->remove(rc);
}

bool AMAQtBridge::setRecordFieldValue(int ID, QString fieldName, QVariant fieldValue, int increment = 2)
{
    bool result = true;

    m_compounds->setFilter(m_id_field + "='" + QString::number(ID) + "'");
    QSqlRecord record = m_compounds->record(0);

    int fieldIndex = record.indexOf(fieldName);
    if (fieldIndex > -1) {
        record.setValue(fieldIndex, fieldValue);
    }

    m_formulae->setFilter("compound_id='" + QString::number(ID) + "'");
    QSqlRecord formulaRecord = m_formulae->record(0);

    int formulaFieldIndex = formulaRecord.indexOf(fieldName);
    if (formulaFieldIndex > -1) {
        formulaRecord.setValue(formulaFieldIndex, fieldValue);
    }

    result = result && startTransaction(db);

    result = result && m_compounds->setRecord(0, record);
    qDebug() << result << " at setRecord in setRecordFieldValue";
    result = result && m_formulae->setRecord(0, formulaRecord);
    qDebug() << result << " at setRecord in setRecordFieldValue";

    result = result && m_compounds->submitAll();
    qDebug() << result << " after submitting " << m_compounds->lastError();
    result = result && m_formulae->submitAll();
    qDebug() << result << " after submitting " << m_compounds->lastError();

    result = endTransaction(db, result) && result;

    invalidateList();
    enqueueUpdateSorting();
    incrementEditCount(increment);
    return result;
}

int AMAQtBridge::newRecord(QVariantMap data)
{
    bool result = true;
    QSqlRecord record = m_compounds->record();

    QString fieldname = record.fieldName(0);
    for (int fc = 0; 0 != fieldname.length(); ++fc, fieldname = record.fieldName(fc))
    {
        if (m_excluded_fields.contains(fieldname)) continue;

        if (data.contains(fieldname)) {
            record.setValue(fc, data[fieldname]);
#ifdef _DEBUG
            qDebug() << "Setting Data: " << fieldname;
#endif
        } else {
            record.setNull(fc);
#ifdef _DEBUG
            qDebug() << "Setting Null: " << fieldname;
#endif
        }
    };
    QSqlRecord formulaRecord = m_formulae->record();
    fieldname = formulaRecord.fieldName(0);
    for (int fc = 0; 0 != fieldname.length(); ++fc, fieldname = formulaRecord.fieldName(fc))
    {
        if (m_excluded_fields.contains(fieldname)) continue;

        if (data.contains(fieldname)) {
            formulaRecord.setValue(fc, data[fieldname]);
#ifdef _DEBUG
            qDebug() << "Setting Data: " << fieldname << data[fieldname];
#endif
        } else {
            // We cannot create all file types using the web-interface
            // formulaRecord.setNull(fc);
#ifdef _DEBUG
            qDebug() << "Setting Null: " << fieldname;
#endif
        }
    };

    result = result && startTransaction(db);

    // Insert new records at the beginning
    result = result && m_compounds->insertRecord(1, record);
    result = result && m_compounds->submitAll();
    qDebug() << "Insert new record: " << result << m_metadata->lastError();

    int id = m_compounds->query().lastInsertId().toInt();
    formulaRecord.setValue("compound_id", id);
    result = result && m_formulae->insertRecord(1, formulaRecord);
    result = result && m_formulae->submitAll();

    qDebug() << "Insert new record: " << id << result << m_metadata->lastError();

    result = endTransaction(db, result) && result;

    invalidateList();
    enqueueUpdateSorting();
    if (result) {
        incrementEditCount(6);

        QVariantMap qm;
        QVariantMap val = getMapFromRecord(&record);
        val[m_compounds->primaryKey().fieldName(0)] = id;
        qm.insert("action", "insert");
        qm.insert("compound", val);
        // Attention: Manually triggering the insert-handler
        // because now we know the id.
        emit datasocketChange(qm);
        qDebug() << "Inserted!";
    }

    return result == true ? id : -1;
}

void AMAQtBridge::dataSocketData(QString data)
{}

QString AMAQtBridge::createDBBackUp()
{
    QString ret =  backUpDB();
    setUpModels(); // All reverences are void after closing the DB
    if (ret.length()) {
        resetEditCount();
        setLastBackupdate();
    }
    return QDir::toNativeSeparators(ret);
}

/// Edit count since last backup
int AMAQtBridge::editCount()
{
    return m_metadata->record(0).value("EditsSinceLastBackUp").toInt();
}

void AMAQtBridge::incrementEditCount(int count)
{
    QSqlRecord r = m_metadata->record(0);
    int editCountIndex = r.indexOf("EditsSinceLastBackUp");
    int edits = r.value(editCountIndex).toInt();
    r.setValue(editCountIndex, edits + count);
    m_metadata->setRecord(0, r);
    m_metadata->submitAll();
    checkBackUp();
}

void AMAQtBridge::resetEditCount()
{
    qDebug() << "ROW COUNT: " << m_metadata->rowCount();
    QSqlRecord r = m_metadata->record(0);
    r.setValue("EditsSinceLastBackUp", 0);
    m_metadata->setRecord(0, r);
    m_metadata->submitAll();
}

void AMAQtBridge::setLastBackupdate()
{
    QSqlRecord r = m_metadata->record(0);
    r.setValue("LastBackUp", QDateTime::currentDateTimeUtc());
    m_metadata->setRecord(0, r);
    qDebug() << "Submitting backupdate " << m_metadata->submitAll() << m_metadata->lastError();
}
/// Checks whether a backup is needed or not
void AMAQtBridge::checkBackUp()
{
    if (m_metadata->record(0).value("EditsSinceLastBackUp").toInt() > 15) {
        createDBBackUp();
    }
}


/// Maintenance Functions
#ifdef _UPDATEBUILD
QString AMAQtBridge::updateSQL()
{
    QFile f(":/update.sql");
    if (!f.open(QIODevice::ReadOnly | QIODevice::Text)) {
        return "Update error. Can't read file.";
    }
    QSqlQuery sq(db);
    SQLHelpers::executeQueriesFromFile(&f, &sq);
    return db.lastError().text();
}
void AMAQtBridge::addGHSFilesToDB()
{
    qDebug() << "Adding GHS files.";

    QSqlTableModel *model = new QSqlTableModel(this);
    model->setTable("ghs");
    model->setEditStrategy(QSqlTableModel::OnManualSubmit);
    model->select();

    int rc = model->rowCount();
    for (int i = 0; i < rc; i++) {
        QSqlRecord record = model->record(i);
        QString sf = record.value("ghs_code").toString();
        qDebug() << record.value("ghs_code");

        QString svgpath =  "S:/Qt/Projects/ama/resources/images/GHS/";
        svgpath.append(sf);
        svgpath.append(".svg");
        QFile f(svgpath);

        QString pngpath =  "S:/Qt/Projects/ama/resources/images/GHS/";
        pngpath.append(sf);
        pngpath.append(".png");
        QFile f2(pngpath);

        if (f.open(QIODevice::ReadOnly) && f2.open(QIODevice::ReadOnly))
        {
            record.setValue("ghs_svg", f.readAll());
            record.setValue("ghs_png", f2.readAll());
            qDebug() << model->setRecord(i, record) << model->lastError();
        }
    }
    qDebug() << "Adding GHS files " <<  model->submitAll() << model->lastError();
}

void AMAQtBridge::addFilesToDB()
{
    QSqlTableModel *model = new QSqlTableModel(this);
    model->setTable("FORMULAE");
    model->setEditStrategy(QSqlTableModel::OnManualSubmit);

    int rc = getRowCount();
    for (int i = 0; i < rc; i++) {
        QSqlRecord record = m_compounds->record(i);
        QSqlRecord record2 = model->record();
        QString sf = record.value("c_structure_name").toString();
        qDebug() << record.value("c_structure_name") << record.value("ID");

        QString skcpath =  "S:/Qt/Projects/ama/resources/formulae/skc/";
        skcpath.append(sf);
        skcpath.append(".skc");
        QFile f(skcpath);

        QString molpath =  "S:/Qt/Projects/ama/resources/formulae/mol/";
        molpath.append(sf);
        molpath.append(".mol");
        QFile f2(molpath);

        QString svgpath =  "S:/Qt/Projects/ama/resources/formulae/svg/";
        svgpath.append(sf);
        svgpath.append(".svg");
        QFile f3(svgpath);

        QString pngpath =  "S:/Qt/Projects/ama/resources/formulae/png/";
        pngpath.append(sf);
        pngpath.append(".png");
        QFile f4(pngpath);

        if (f.open(QIODevice::ReadOnly) && f2.open(QIODevice::ReadOnly) &&
                f3.open(QIODevice::ReadOnly) && f4.open(QIODevice::ReadOnly))
        {
            record2.setValue("compound_id", record.value(m_id_field));
            record2.setValue("SKC", f.readAll());
            record2.setValue("MOL", f2.readAll());
            record2.setValue("SVG", f3.readAll());
            record2.setValue("PNG", f4.readAll());
            qDebug() << model->insertRecord(-1, record2) << model->lastError();
        }
    }
    qDebug() << "Submitting SKC files " <<  model->submitAll() << model->lastError();
}
void AMAQtBridge::dumpFile(QVariant st)
{
    QFile f("S:/Qt/Projects/ama/dumpfile.png");
    f.open(QIODevice::WriteOnly);
    //m_formulae->setFilter("compound_id='240'");
    //m_formulae->select();
    qDebug() << st;
    qDebug() << f.write(st.toByteArray());
    f.close();
    qDebug() << st << "xxxxx";
}
void AMAQtBridge::printFieldsAsJSkeleton() {
    QSqlRecord record = m_compounds->record(1);
    int fc = 0;
    QStringList qsl;
    do {
        QString fieldname = record.fieldName(fc);
        if (0 == fieldname.length()) break;
        qsl.append("\t'" + fieldname + "': { pattern: \"\", display: \"d\", help: \"h\" }");
        fc++;
       } while(1);
    qDebug() << "window.queryfields = {\n" << qsl.join(",\n") << "\n};";
}
#endif
