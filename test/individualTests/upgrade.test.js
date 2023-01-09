const assert = require('assert');
const SQLParser = require('../../lib/SQLParser.js');
const _dbName = 'sql-to-mongo-test';
const {setup, disconnect} = require('../mongo-client');

describe('node-sql-parser upgrade tests', function () {
    this.timeout(90000);
    /** @type {import('mongodb').MongoClient} */
    let mongoClient;
    before(function (done) {
        const run = async () => {
            try {
                const {client} = await setup();
                mongoClient = client;
                done();
            } catch (exp) {
                done(exp);
            }
        };
        run();
    });

    after(function (done) {
        disconnect().then(done).catch(done);
    });

    it('should work after upgrading', async (done) => {
        const queryText =
            'select id,Title,Rating,(select * from Rentals where staffId<10) as rentalsArr from `customers`';
        try {
            const parsedQuery = SQLParser.makeMongoAggregate(queryText);
            const results = await mongoClient
                .db(_dbName)
                .collection(parsedQuery.collections[0])
                .aggregate(parsedQuery.pipeline)
                .toArray();
            assert(results);
            done();
        } catch (err) {
            return done(err);
        }
    });
});
