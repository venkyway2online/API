let Operations = module.exports;

const MongoClient = require('mongodb').MongoClient;
const config = require('config')
const url = config.mongodb.uri
// const db = config.mongodb.db;



let mongodb;
let urls = [];
let clients = [];
let connections = []

Operations.connect = (url, db) => {
    let index;
    if (urls.indexOf(url) === -1) {
        urls.push(url);
        let client = new MongoClient(url, {
            useNewUrlParser: true
        });
        index = urls.length - 1;
        clients[index] = client;
        connections[index] = client.connect();
    } else {
        index = urls.indexOf(url);
    }

    return new Promise((resolve, reject) => {
        connections[index].then(() => {
            console.log(`MongoDB native driver connected to database: ${db}`)
            resolve(clients[index].db(db));
        }).catch((mongoConnectErr) => {
            console.error('MongoDB native driver connection error', new Error(mongoConnectErr))
            reject(mongoConnectErr);
        })

    });
}

Operations.op = function (mongo) {

    this.find = function (collection, query, projection = {}, sort = {}) {
        return mongo.collection(collection).find(query, { projection }).sort(sort).toArray()
    }

    this.findRev = function (collection, query, projection = {}, sort = {}, skip = 0, limit = 0) {
        return mongo.collection(collection).find(query, { projection }).sort(sort).skip(skip).limit(limit).toArray();
    }

    this.findOne = function (collection, query, projection = {}) {
        return mongo.collection(collection).findOne(query, { projection })
    }

    this.findOneAndUpdate = function (collection, query, projection = {}) {
        let setObj = {
            $set: query.update
        };
        if (query['$addToSet']) {
            setObj['$addToSet'] = query['$addToSet'];
        }
        return mongo.collection(collection).findOneAndUpdate(query.find, setObj, projection)
    }

    this.simpleCount = function (collection, query) {
        return mongo.collection(collection).count(query);
    }

    this.getCollection = function (collection) {
        return mongo.collection(collection)
    }

    this.findOneAndIncrement = function (collection, query, projection = {}) {
        return mongo.collection(collection).findOneAndUpdate(query.find, query.update, projection)
    }


    this.updateMany = function (collection, query) {
        return mongo.collection(collection).updateMany(query.find, query.update)
    }

    this.updateOne = function (collection, query) {
        return mongo.collection(collection).updateOne(query.find, query.update)
    }

    this.insertMany = function (collection, query) {
        return mongo.collection(collection).insertMany(query)
    }

    this.insertManyUnorder = function (collection, data) {
        return mongo.collection(collection).insertMany(data, { ordered: false });
    }

    this.insertOne = function (collection, query) {
        return mongo.collection(collection).insertOne(query)
    }

    this.updateOneUpsert = function (collection, query) {
        return mongo.collection(collection).updateOne(query.find, query.update, { upsert: query.upsert });
    }

    this.count = function (collection, query) {
        return mongo.collection(collection).countDocuments(query);
    }
    this.aggregation = function (collection, query) {
        // console.log(collection,query)
        // console.log(mongo.collection(collection).aggregate(query))
        return mongo.collection(collection).aggregate(query).toArray();
    }

    this.UpdateMany = function (collection, query) {
        return mongo.collection(collection).updateMany(query.find, query.update);
    }

    this.findSkipLimit = function (collection, query = {}, projection = {}, sortObj = { _id: -1 }, skip = 0, limit = 0) {
        return mongo.collection(collection).find(query, { projection }).sort(sortObj).skip(skip).limit(limit).toArray();
    }

    this.findLimit = function (collection, query, projection = {}, sort = {}, limit = 0) {
        return mongo.collection(collection).find(query, { projection }).sort(sort).limit(limit).toArray();
    }

    this.remove = function (collection, query) {
        return mongo.collection(collection).remove(query);
    }

    this.deleteOne = function (collection, query) {
        return mongo.collection(collection).deleteOne(query);
    }

    this.distinct = function (collection, field, query) {
        return mongo.collection(collection).distinct(field, query)
    }

}


/*
'count',
'countDocuments',
'deleteMany',
'deleteOne',
'estimatedDocumentCount',
'find',
'findOne',
'findOneAndDelete',
'findOneAndRemove',
'findOneAndReplace',
'findOneAndUpdate',
'remove',
'replaceOne',
'update',
'updateMany',
'updateOne'
 */