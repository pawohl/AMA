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


#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QWebView>


// Forward declarations
class AMANetworkProxy;

class AMAQtBridge;
QT_BEGIN_NAMESPACE
class QNetworkDiskCache;
QT_END_NAMESPACE

class MainWin : public QWebView
{
    Q_OBJECT
    
public:
    explicit MainWin(QWidget * parent = 0);
    ~MainWin();

private:
    AMAQtBridge * m_amaqtbridge;
    AMANetworkProxy * m_network;
    QNetworkDiskCache * m_cache;

private slots:
    void addJSObject();

protected:
    void closeEvent(QCloseEvent *event);

signals:
    void onWindowClose();

};
#endif
