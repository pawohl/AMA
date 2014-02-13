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

#ifndef AMAQTBRIDGE_H
#define AMAQTBRIDGE_H

#include <QtWidgets>
#include <QWebView>
#include <QtSql>

QT_BEGIN_NAMESPACE
class QNetworkAccessManager;
class QNetworkReply;
class QNetworkDiskCache;
QT_END_NAMESPACE


class AMAQtBridge : public QObject
{
    Q_OBJECT
public:
    AMAQtBridge(QNetworkDiskCache * netcache, QWebView *parent=0);
    ~AMAQtBridge();

    Q_INVOKABLE QVariant getValue(int row, const QString& fieldname);
    Q_INVOKABLE int getRowCount();
    Q_INVOKABLE QVariantList getData();
    Q_INVOKABLE QVariantMap getRecord(int ID);
    Q_INVOKABLE QString getMetaSetting(const QString &fieldname);
    // These functions are important for the presentation of the data
    Q_INVOKABLE QVariantList getRenderFields();
    Q_INVOKABLE QVariantMap getRendergroupinfo();
    Q_INVOKABLE QVariantList getQueryfields();
    Q_INVOKABLE QVariantMap getQuerygroupinfo();
    Q_INVOKABLE QVariantList getHrfCorr();
    Q_INVOKABLE QVariantList getAmaviews();
    Q_INVOKABLE void saveData(QString fileName, QString data, QString type);

    Q_PROPERTY(bool db_connected READ isDBConnected)
    Q_PROPERTY(bool sorting_dirty READ isSortingDirty)
    Q_PROPERTY(QString appVersion READ getAppVersion)
    bool isDBConnected() const;
    bool isSortingDirty() const;
    QString getAppVersion() const;

    QSqlTableModel* getCompoundsTable();

protected:
    void invalidateList();
    void enqueueUpdateSorting();
    bool storedDirtyState();
    void setStoredDirtyState(bool dirty);
    void checkBackUp();
    int editCount();
    void incrementEditCount(int count);
    void resetEditCount();
    void setLastBackupdate();
    void setUpModels();
    QSqlTableModel *getTableModel(QString table, QString sortkey);
    QSqlQueryModel *getQueryModel(QString table, QString orderByClause);
    QVariantList getListFromTable(QSqlTableModel* m, QString sortkey);
    QVariantMap getMapFromTable(QSqlTableModel *m);
    QVariantMap getMapFromRecord(QSqlRecord *r);

private:
    inline bool startTransaction(QSqlDatabase db)
    {
        bool result = true;
        if (db.driver()->hasFeature(QSqlDriver::Transactions)) {
            result = db.transaction();
            qDebug() << "Starting transaction" << result;
        }
        return result;
    };
    inline bool endTransaction(QSqlDatabase db, bool commit)
    {
        bool result = true;
        if (db.driver()->hasFeature(QSqlDriver::Transactions)) {
            if (commit) {
                result = db.commit();
                qDebug() << "Committing transaction" << result;
            } else {
                result = db.rollback();
                qDebug() << "Reverting transaction" << result;
            }
        }
        return result;
    };
    inline bool writeJS(QDir directory, QString fileName, QString content) {
        bool result;
        QString location = directory.absoluteFilePath(fileName);
        QFile f(location);
        result = f.open(QIODevice::Text | QIODevice::WriteOnly);
        f.write(content.toUtf8());
        f.close();
        return result;
    };

    /// Maintenance functions
#ifdef _UPDATEBUILD
    void addFilesToDB();
    void addGHSFilesToDB();
    void dumpFile(QVariant st);
    void printFieldsAsJSkeleton();
#endif

public slots:
    void closeApp();
    void minimizeApp();
    void fullscreenApp();
    void closefullscreenApp();
    void allowEditApp(bool allow);
    bool deleteRecord(int ID);
    bool changeRecord(QVariantMap data);
    bool changeRecordById(int ID, QVariantMap data, bool noNull);
    bool purgeFromCache(QString rc);
    int newRecord(QVariantMap data);
    bool setRecordFieldValue(int ID, QString fieldName, QVariant fieldValue, int increment);
    void showFileInExplorer(QString filepath);
    void updateSorting();
    QString createDBBackUp();
    void packAndGo(QString JSONData, QString JSONModel, QString JSONModelGroup, QString JSONviews, QString version, QString hrfc, QString legend);
    void dataSocketData(QString data);

    void dataChangedHandler(QModelIndex topLeft, QModelIndex bottomRight, QVector<int> roles);
    void dataInsertedHandler(QSqlRecord &record);
    void dataDeletedHandler(int row);
    /// Maintenance functions
#ifdef _UPDATEBUILD
    QString updateSQL();
#endif

signals:
    void packAndGoProgress(int percentProgress, QString textStatus);
    void sortingDirtyChange(bool sortingDirty);
    void sorting();
    void datasocketChange(QVariantMap changeData);

private slots:

public:
    /// Fieldname of the primary key of the compound table
    QString m_id_field;

protected:
    QNetworkAccessManager* m_network;
    QNetworkDiskCache* m_cache;
    QWebView* m_parent;
    QVariantList m_list;
    bool m_listFilled;
    bool m_sortingDirty;

    QVariantList m_renderfields;
    QVariantMap m_rendergroupinfo;
    QVariantList m_queryfields;
    QVariantMap m_querygroupinfo;
    QVariantList m_hrfcorr;
    QVariantList m_amaviews;

    /// database connection established
    bool m_db_connected;

    /// structural formulae images and compound data
    QSqlTableModel *m_compounds;

    /// formulae
    QSqlTableModel *m_formulae;

    /// Meta information about the state of the database
    QSqlTableModel *m_metadata;

    /// Fields whose values must not be set
    QStringList m_excluded_fields;
private:


};

#endif
