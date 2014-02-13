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

#ifndef AMASERVER_H
#define AMASERVER_H

#include "amaqtbridge.h"

#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QNetworkRequest>
#include <QtSql>

class AMANetworkProxy : public QNetworkAccessManager
{
    Q_OBJECT
public:
    explicit AMANetworkProxy(QObject *parent = 0, AMAQtBridge *bridge = 0);

protected:
    AMAQtBridge* m_bridge;
    QNetworkReply *createRequest(Operation op, const QNetworkRequest &request,
                                             QIODevice *outgoingData = 0);

signals:

public slots:
    
};

/// This is for serving resources and database reading
class AMANetworkReplyProxy : public QNetworkReply
{
    Q_OBJECT
public:
    explicit AMANetworkReplyProxy(QObject *parent, const QNetworkRequest &req, const QNetworkAccessManager::Operation op, AMAQtBridge *bridge);

protected:
    AMAQtBridge* m_bridge;
    QSqlRelationalTableModel *m_imgs;
    qint64 readData( char* pData, qint64 lMaxSize );

    ///
    inline QStringList req2FilenameParts(QNetworkRequest req)
    {
        return req.url().path().split('?').first().split('/').last().split('.');
    }

    ///
    inline QStringList req2DataRequested(QNetworkRequest req)
    {
        return req.url().path().split('?').first().split('/').last().split('.');
    }

signals:

public Q_SLOTS:
    /// Aborts the transfer
    void abort() { QNetworkReply::close(); }

    /// Return the number of bytes available
    qint64 bytesAvailable() const { return m_content.size(); }

    /// Return non zero for sequential data
    bool isSequential() const { return true; }


private:
    /// Offset progress
    qint64 m_lOffset;

    /// Data buffer
    QByteArray m_content;

};

/// This is for data coming from the client and to perform database changes
class AMANetworkReplyPostProxy : public QNetworkReply {
    Q_OBJECT
public:
    explicit AMANetworkReplyPostProxy(QObject *parent, const QNetworkRequest &req, const QNetworkAccessManager::Operation op, QIODevice *data, AMAQtBridge *bridge);

protected:
    AMAQtBridge* m_bridge;
    qint64 readData( char* pData, qint64 lMaxSize );

public Q_SLOTS:
    /// Aborts the transfer
    void abort() { QNetworkReply::close(); }

    /// Return the number of bytes available
    qint64 bytesAvailable() const { return m_content.size(); }

    /// Return non zero for sequential data
    bool isSequential() const { return true; }

private:
    /// Offset progress
    qint64 m_lOffset;

    /// Data buffer
    QByteArray m_content;
};

#endif // AMASERVER_H
