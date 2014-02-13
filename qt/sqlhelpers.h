#ifndef SQLHELPERS_H
#define SQLHELPERS_H

#include <QFile>
#include <QSqlQuery>
#include <QSqlDatabase>

class SQLHelpers : public QObject
{
    Q_OBJECT
public:
    SQLHelpers(QObject *parent);
    static void executeQueriesFromFile(QFile *file, QSqlQuery *query);
};

#endif // SQLHELPERS_H
