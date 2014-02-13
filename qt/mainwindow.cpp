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

#include "mainwindow.h"
#include "amaqtbridge.h"
#include "amaserver.h"

#include <QWebFrame>
#include <QWebElementCollection>
#include <QNetworkDiskCache>

/*
 * Default Constructor
 */
//! [MainWindow - constructor]
MainWin::MainWin(QWidget * parent) : QWebView(parent)
{
    // Set the window title and icon
#ifdef _UPDATEBUILD
    setWindowTitle(tr("Update: Arzneimittelanalytik Stoffliste"));
    QWidget::setWindowIcon(QIcon(":/images/update.ico"));
#else
    setWindowTitle(tr("Arzneimittelanalytik Stoffliste"));
    QWidget::setWindowIcon(QIcon(":/images/favicon.ico"));
#endif

    QString cachePath = QStandardPaths::writableLocation(QStandardPaths::CacheLocation) + "/amasearchlist";
    QWebSettings* gs = QWebSettings::globalSettings();
#ifdef _DEBUG
    gs->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
#endif
    gs->setAttribute(QWebSettings::LocalStorageEnabled, true);
    gs->setAttribute(QWebSettings::JavascriptCanAccessClipboard, true);
    gs->setAttribute(QWebSettings::SiteSpecificQuirksEnabled, false);
    gs->setLocalStoragePath(cachePath);

    m_cache = new QNetworkDiskCache(this);
    m_cache->setCacheDirectory(cachePath);
    qDebug() << m_cache->cacheDirectory();
    m_cache->setMaximumCacheSize(2000000); //set the cache to 20megs

    //! The object we will expose to JavaScript engine:
    m_amaqtbridge = new AMAQtBridge(m_cache, this);
    m_network = new AMANetworkProxy(this, m_amaqtbridge);
    m_network->setCache(m_cache);
    page()->setNetworkAccessManager(m_network);

    // Signal is emitted before frame loads any web content:
    QObject::connect(page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()),
                     this, SLOT(addJSObject()));

    // qrc:// URLs refer to internal resources (compiled by Qt's RCC)
#ifdef _UPDATEBUILD
    QUrl startURL = QUrl("qrc:/update.html");
#else
    QUrl startURL = QUrl("qrc:/suchliste_starten.html");
#endif

    // Load web content now!
    setUrl(startURL);

    page()->createStandardContextMenu();
}
//! [MainWindow - constructor]

MainWin::~MainWin()
{

}

//! [MainWindow - addJSObject]
void MainWin::addJSObject() {
    // Add pAMAQtBridge to JavaScript Frame as member "amaQtServer".
    page()->mainFrame()->addToJavaScriptWindowObject(QString("amaQtHost"), m_amaqtbridge);

    // Required to identify builds for touch devices
#ifdef _MOBILE
    page()->mainFrame()->addToJavaScriptWindowObject(QString("touchBuild"), true);
#endif

#ifdef _DEBUG
    if (m_amaqtbridge->isDBConnected()) {
        qDebug() << "First record is:" << m_amaqtbridge->getCompoundsTable()->record(0).value("c_structure_name").toString();
    }
#endif
    // Make JS aware that there is now a Qt object
    page()->mainFrame()->evaluateJavaScript("if (window.qtenhancedtrigger) qtenhancedtrigger()");
}
//! [MainWindow - addJSObject]

void MainWin::closeEvent(QCloseEvent *event)
{
    emit onWindowClose();
    event->accept();
}
