const assert = require('assert');
// eslint-disable-next-line node/no-extraneous-require
const {set, get} = require('lodash');
const fs = require('fs/promises');
const $path = require('path');
const {dbName} = require('../mongo-client');
const SQLParser = require('../../../lib/SQLParser.js');
const $check = require('check-types');

module.exports = {
    queryResultTester,
    buildQueryResultTester,
};
/**
 *
 * @param {import('./types.js').BuildQueryResultOptions} options
 */
function buildQueryResultTester(options) {
    return runQueryResultTester;

    /**
     *
     * @param {import('./types.js').QueryResultOptions} innerOptions
     * @returns
     */
    async function runQueryResultTester(innerOptions) {
        return await queryResultTester({...options, ...innerOptions});
    }
}
/**
 * Used to write the query + expected results to the output file
 *
 * @param {import('./types.js').AllQueryResultOptions} options The options to use
 * @returns {Promise<import('./types').QueryTesterResult>}
 */
async function queryResultTester(options) {
    let {
        mongoClient,
        queryString,
        casePath,
        fileName,
        mode = 'test',
        dirName,
        expectZeroResults,
        ignoreDateValues = false,
        outputPipeline = false,
    } = options;
    if (!fileName.endsWith('.json')) {
        fileName = fileName + '.json';
    }
    const {collections, pipeline} = SQLParser.makeMongoAggregate(queryString, {
        database: 'PostgresQL',
    });
    const filePath = $path.resolve(dirName, fileName);
    /** @type {import('mongodb').Document[]} */
    let results = [];
    try {
        results = await mongoClient
            .db(dbName)
            .collection(collections[0])
            .aggregate(pipeline)
            .toArray();
    } catch (err) {
        console.error(err);
    }
    results.map((o) => checkForMongoTypes(o, ignoreDateValues));
    const obj = await readCases(filePath);
    if (mode === 'write') {
        if (outputPipeline) {
            set(obj, casePath + '.pipeline', pipeline);
        } else {
            set(obj, casePath + '.pipeline', undefined);
        }
        if (!expectZeroResults) {
            set(obj, casePath + '.expectedResults', results);
        }
        await writeFile(filePath, obj);
    }
    if (!expectZeroResults) {
        assert(results.length);
        const expectedResults = get(obj, casePath + '.expectedResults');
        assert.deepStrictEqual(results, expectedResults);
    }
    return {
        results,
        collections,
        pipeline,
    };
}

function checkForMongoTypes(obj, ignoreDateValues) {
    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            obj[key] = value.sort();
        } else if ($check.date(value)) {
            if (ignoreDateValues) {
                obj[key] = '$date-placeholder';
            }
        } else if ($check.object(value)) {
            if (Buffer.isBuffer(value)) {
                obj[key] = value.toString('utf-8');
            } else if (value._bsontype) {
                if (value._bsontype === 'Decimal128') {
                    obj[key] = Number(value.toString());
                } else if (value._bsontype.toLowerCase() === 'objectid') {
                    obj[key] = value.toString();
                } else {
                    throw new Error(
                        `Unsupported bson type: ${value._bsontype}`
                    );
                }
            } else {
                obj[key] = checkForMongoTypes(value);
            }
        }
    }
    return obj;
}

/**
 * @param {string} path
 * @returns {Promise<boolean>} returns true if the file already existed, false if it was created
 */
async function ensureFileExists(path) {
    try {
        await fs.stat(path);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            // file does not exist
            await writeFile(path, {});
            return false;
        }
        throw err;
    }
}

/**
 *
 * @param {string} path
 * @param {object} content
 * @returns {Promise<void>}
 */
async function writeFile(path, content) {
    const contentString = JSON.stringify(content, null, 2);
    await fs.writeFile(path, contentString, {
        encoding: 'utf-8',
    });
}

/**
 * @param {string} path
 * @returns {Promise<object>}
 */
async function readCases(path) {
    const existed = await ensureFileExists(path);
    if (!existed) {
        return {};
    }
    const dataString = await fs.readFile(path, {encoding: 'utf-8'});
    return JSON.parse(dataString);
}
