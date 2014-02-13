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


#include "amaserver.h"
#include "amaqtbridge.h"

#include <QNetworkRequest>
#include <QNetworkReply>
#include <QDebug>
#include <QFile>
#include <QtSql>
#include <QJsonArray>
#include <QJsonObject>
#include <QJsonDocument>

// Special thanks to http://www.codeproject.com/Articles/336018/Building-C-Applications-with-HTML5
// and http://code.google.com/p/htmapp/source/browse/frwk/qt/network.cpp
// and http://gitorious.org/qtwebkit/performance/blobs/master/host-tools/mirror/main.cpp

AMANetworkProxy::AMANetworkProxy(QObject *parent, AMAQtBridge *bridge) :
    m_bridge(bridge), QNetworkAccessManager(parent)
{ }

QNetworkReply* AMANetworkProxy::createRequest(Operation op, const QNetworkRequest &request,
                                         QIODevice *outgoingData)
{
    QString sReq = request.url().toString();
    bool isJSData = sReq.startsWith("qrc:/data/");

    if (op == QNetworkAccessManager::PostOperation) {
        return new AMANetworkReplyPostProxy(this, request, op, outgoingData, m_bridge);

    } else if (sReq.startsWith("qrc:/formulae/") || sReq.startsWith("qrc:/images/GHS/") || isJSData) {
        // Reply this request with database content?
        // Formula files are not statically compiled into the resource section;
        // otherwise they could not be changed without re-compiling the application.

        return new AMANetworkReplyProxy(this, request, op, m_bridge);

    } else if (sReq.startsWith("qrc:") || sReq.startsWith("data:")  || sReq.startsWith("file:") || sReq.startsWith("http://localhost") || sReq.startsWith("https://localhost")) {
        return QNetworkAccessManager::createRequest(op, request, outgoingData);
    } else {
        qWarning() << "Insecure resource requested: " << sReq;
        QNetworkRequest reqCopy(request);
        reqCopy.setUrl(QUrl("qrc:/prohibited.html"));
        return QNetworkAccessManager::createRequest(op, reqCopy, outgoingData);
    }
}

AMANetworkReplyProxy::AMANetworkReplyProxy(QObject *parent,
                                           const QNetworkRequest &req,
                                           const QNetworkAccessManager::Operation op,
                                           AMAQtBridge *bridge) :
    m_bridge(bridge), m_imgs(0), QNetworkReply(parent)
{
    /// [Request stuff]
    setRequest(req);
    setOperation(op);
    setUrl(req.url());
    QNetworkReply::open(QIODevice::ReadOnly | QIODevice::Unbuffered);
    /// End [Request stuff]

    /// [Response-data stuff]
    m_lOffset = 0;
    m_content.clear();
    /// End [Response-data stuff]

    QString sReq = req.url().toString();
    QString fileExtension;

    if (sReq.startsWith("qrc:/data/")) {
        if (op == QNetworkAccessManager::PostOperation) {
            /// Upload
            this->open(QIODevice::ReadOnly | QIODevice::Text);
            qDebug() << op << QString( this->readAll() ) << this->isOpen() << this->isReadable() << this->size();
            this->close();
        } else {
            /// Serving JSON data
            QStringList dataRequested = req2DataRequested(req);
            fileExtension = dataRequested.last().toUpper();

            QStringList dataRequestOpts;
            dataRequestOpts << "COMPOUNDDATA" << "RENDERFIELDS" << "RENDERGROUPINFO" << "QUERYFIELDS" << "QUERYGROUPINFO" << "HRFCORR" << "AMAVIEWS" << "LEGEND";

            QJsonArray a;
            QJsonObject o;
            switch(dataRequestOpts.indexOf(dataRequested.first().toUpper())) {
            case 0: {
                QVariantList d = bridge->getData();
                a = QJsonArray::fromVariantList(d);
                break;
            }
            case 1: {
                QVariantList d = bridge->getRenderFields();
                a = QJsonArray::fromVariantList(d);
                break;
            }
            case 2: {
                QVariantMap d = bridge->getRendergroupinfo();
                o = QJsonObject::fromVariantMap(d);
                break;
            }
            case 3: {
                QVariantList d = bridge->getQueryfields();
                a = QJsonArray::fromVariantList(d);
                break;
            }
            case 4: {
                QVariantMap d = bridge->getQuerygroupinfo();
                o = QJsonObject::fromVariantMap(d);
                break;
            }
            case 5: {
                QVariantList d = bridge->getHrfCorr();
                a = QJsonArray::fromVariantList(d);
                break;
            }
            case 6: {
                QVariantList d = bridge->getAmaviews();
                a = QJsonArray::fromVariantList(d);
                break;
            }
            case 7: {
                QString txt = bridge->getMetaSetting("legend");
                QVariantMap d;
                d.insert("legend", txt);
                o = QJsonObject::fromVariantMap(d);
                break;
            }
            default:
                qWarning() << "Cannot handle request " << dataRequested.first().toUpper() << ". Unknown resource.";
            }

            QJsonDocument doc;
            if (a.size()) {
                doc = QJsonDocument(a);
            } else {
                doc = QJsonDocument(o);
            }
            // Create the JSONP-response
            // We're using JSONP because this works cross-site in
            // all browsers, even on localhost or file which is
            // (the latter is restricted by Opera, for example, even
            // when doing the AJAX from a HTML page saved on the local
            // file system)
            m_content
                    .append( "window['" )
                    .append( dataRequested.first().toUtf8().replace("'", "\\'") )
                    .append( "']" )
                    .append( "(" )
                    .append( doc.toJson(QJsonDocument::Compact) )
                    .append( ");" );
        }
    } else if (sReq.startsWith("qrc:/images/GHS/")) {
        // Since filtered later and the request may arrive from different threads,
        // better use our own model
        // This is not the bottlenack; the slow client side JavaScript execution, however is.
        m_imgs = new QSqlRelationalTableModel(this);
        m_imgs->setTable("ghs");

        // CAVE: Ugly and possibly exploitable (SQL-injection)
        QStringList filename = req2FilenameParts(req);
        fileExtension = filename.last().toUpper();
        m_imgs->setFilter("ghs_code='" + filename.first() + "'");
        m_imgs->select();

        // Set response-body content. Since some browsers have the habit
        // asking multiple times for the same stuff, only parts (HTTP-range-request),
        // to boost performance, we read them once and store these little
        // formula files in memory.
        QByteArray qba = m_imgs->record(0).value("ghs_" + fileExtension.toLower()).toByteArray();
        if (qba.length() == 0) {
            qWarning() << " GHS: No " << fileExtension << " for " << filename.first();
        }
        m_content.append(qba);
    } else if (sReq.startsWith("qrc:/formulae/")) {
        // Since filtered later and the request may arrive from different threads,
        // better use our own model
        // This is not the bottlenack; the slow client side JavaScript execution, however is.
        m_imgs = new QSqlRelationalTableModel(this);
        m_imgs->setTable("FORMULAE");
        m_imgs->setRelation(m_imgs->fieldIndex("compound_id"), QSqlRelation("COMPOUNDS", bridge->m_id_field, "c_structure_name"));

        // CAVE: Ugly and possibly exploitable (SQL-injection)
        QStringList filename = req2FilenameParts(req);
        fileExtension = filename.last().toUpper();
        m_imgs->setFilter("c_structure_name='" + filename.first() + "'");
        m_imgs->select();

        // Set response-body content. Since some browsers have the habit
        // asking multiple times for the same stuff, only parts (HTTP-range-request),
        // to boost performance, we read them once and store these little
        // formula files in memory.
        QByteArray qba = m_imgs->record(0).value(fileExtension).toByteArray();
        if (qba.length() == 0) {
            qWarning() << " FROMULA: No " << fileExtension << " for " << filename.first() << req.url().path();
        }
        m_content.append(qba);
    }

    QString mime;

    // C++ cannot switch-by-string, even if constant. Using a helper construct.
    QStringList fileExtensions;
    fileExtensions << "PNG" << "JPG" << "JPEG" << "SVG" << "JS";
    switch(fileExtensions.indexOf(fileExtension)) {
    case 0:
        mime = "image/png";
        break;
    case 1:
    case 2:
        mime = "image/jpeg";
        break;
    case 3:
        mime = "image/svg+xml";
        break;
    case 4:
        mime = "text/javascript;charset=utf-8";
        break;
    default:
        mime = "application/octet-stream";
    }

    // Set 200 OK - status
    setAttribute( QNetworkRequest::HttpStatusCodeAttribute, QVariant( 200 ) );

    // Set reply size
    setHeader( QNetworkRequest::ContentLengthHeader, QVariant( m_content.size() ) );

    // Please do not cache (but the browser does anyway)
    setRawHeader("Cache-Control", "must-revalidate");
    setHeader(QNetworkRequest::LastModifiedHeader, QDateTime::currentDateTimeUtc());


    // That way the browser does not offer the resource for download or does other strange things
    if ( mime.length() )
            setHeader( QNetworkRequest::ContentTypeHeader, QVariant( mime.toUtf8() ) );

    // Allow "cross site resource usage". Nothing confidental here.
    // Prevents for example that canvas gets polluted, ...
    setRawHeader( "Access-Control-Allow-Origin", "*" );

    // Call notify functions
    QMetaObject::invokeMethod( this, "metaDataChanged", Qt::QueuedConnection );
    QMetaObject::invokeMethod( this, "readyRead", Qt::QueuedConnection );
    QMetaObject::invokeMethod( this, "downloadProgress", Qt::QueuedConnection,
                                                       Q_ARG( qint64, m_content.size() ), Q_ARG( qint64, m_content.size() ) );
    QMetaObject::invokeMethod( this, "finished", Qt::QueuedConnection );
    setFinished(true);

    // Created on the heap but not required anymore
    if (m_imgs) {
        m_imgs->clear();
        m_imgs->deleteLater();
    }
}

qint64 AMANetworkReplyProxy::readData( char* pData, qint64 lMaxSize )
{
    // Useful if you want to know about the request-mess some browser create :)
    // qDebug() << "Reading data: " << lMaxSize << " of " << m_content.size();

    // Have we copied all the data?
    if ( m_lOffset >= m_content.size() )
            return -1;

    // Copy a chunk of data
    qint64 lCount = qMin( lMaxSize, m_content.size() - m_lOffset );
    memcpy( pData, m_content.constData() + m_lOffset, lCount );
    m_lOffset += lCount;


    // Return the number of bytes copied
    return lCount;
}

AMANetworkReplyPostProxy::AMANetworkReplyPostProxy(QObject *parent,
                                           const QNetworkRequest &req,
                                           const QNetworkAccessManager::Operation op,
                                           QIODevice *data,
                                           AMAQtBridge *bridge) :
    m_bridge(bridge), QNetworkReply(parent)
{
    QString sData = data->readAll().replace("+", "%20").replace("%2B", "+");
    qDebug() << "Posting something." << req.url().toString() + "?" + sData;
    QUrlQuery uqData(sData);
    QList<QPair<QString, QString>>  params = uqData.queryItems();
    QString oper = uqData.queryItemValue("oper");

    /// [Request stuff]
    setRequest(req);
    setOperation(op);
    setUrl(req.url());
    QNetworkReply::open(QIODevice::ReadOnly | QIODevice::Unbuffered);
    /// End [Request stuff]

    /// [Response-data stuff]
    m_lOffset = 0;
    m_content.clear();
    /// End [Response-data stuff]


    QVariantMap response;
    int httpStatus = 501;
    QString operRes =  "not implemented";


    if (oper.compare("edit") == 0) {
        QVariantMap edit;

        qDebug() << "Editing" << uqData.queryItemValue(bridge->m_id_field);
        int len = params.size();
        for (int i = 0; i < len; i++) {
            edit[params.at(i).first] = params.at(i).second;
        }
        bool ret = bridge->changeRecord(edit);

        if (ret) {
            operRes = "success";
            httpStatus = 200;
        } else {
            operRes = "error";
            // Set status 500 Server Error
            httpStatus = 500;
        }
    } else if (oper.compare("del") == 0) {
        bool ok;
        int rId = uqData.queryItemValue("id").toInt(&ok);
        if (ok) {
            if (bridge->deleteRecord(rId)) {
                operRes = "success";
                httpStatus = 200;
            } else {
                operRes = "error";
                // Deleting failed (DB or whatever)
                httpStatus = 500;
            }
        } else {
            operRes = "error";
            // Client sent something that is not sane
            httpStatus = 400;
        }
    }

    response[oper] = operRes;
    setAttribute( QNetworkRequest::HttpStatusCodeAttribute, QVariant( httpStatus ) );

    // Allow "cross site resource usage" if running in Qt client.
    setRawHeader( "Access-Control-Allow-Origin", "qrc://" );

    m_content.append(QJsonDocument(QJsonObject::fromVariantMap(response)).toJson(QJsonDocument::Compact));

    // Set reply size
    setHeader( QNetworkRequest::ContentLengthHeader, QVariant( m_content.size() ) );

    // Please do not cache (but the browser does anyway)
    setRawHeader( "Cache-Control", "must-revalidate" );
    setHeader( QNetworkRequest::LastModifiedHeader, QDateTime::currentDateTimeUtc() );


    // That way the browser does not offer the resource for download or does other strange things
    setHeader( QNetworkRequest::ContentTypeHeader, "application/json; charset=utf-8" );


    // Call notify functions
    QMetaObject::invokeMethod( this, "metaDataChanged", Qt::QueuedConnection );
    QMetaObject::invokeMethod( this, "readyRead", Qt::QueuedConnection );
    QMetaObject::invokeMethod( this, "downloadProgress", Qt::QueuedConnection,
                                                       Q_ARG( qint64, m_content.size() ), Q_ARG( qint64, m_content.size() ) );
    QMetaObject::invokeMethod( this, "finished", Qt::QueuedConnection );
    setFinished(true);
}

qint64 AMANetworkReplyPostProxy::readData( char* pData, qint64 lMaxSize )
{
    // Useful if you want to know about the request-mess some browser create :)
    // qDebug() << "Reading data: " << lMaxSize << " of " << m_content.size();

    // Have we copied all the data?
    if ( m_lOffset >= m_content.size() )
            return -1;

    // Copy a chunk of data
    qint64 lCount = qMin( lMaxSize, m_content.size() - m_lOffset );
    memcpy( pData, m_content.constData() + m_lOffset, lCount );
    m_lOffset += lCount;


    // Return the number of bytes copied
    return lCount;
}
