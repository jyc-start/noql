const {setup, disconnect} = require('../utils/mongo-client.js');
const {buildQueryResultTester} = require('../utils/query-tester');

describe('joins', function () {
    this.timeout(90000);
    const fileName = 'join-cases';
    const mode = 'write';
    const dirName = __dirname;
    /** @type {import('../utils/query-tester/types').QueryResultTester} */
    let queryResultTester;
    /** @type {import('mongodb').MongoClient} */
    let mongoClient;
    before(function (done) {
        const run = async () => {
            try {
                const {client} = await setup();
                mongoClient = client;
                queryResultTester = buildQueryResultTester({
                    dirName,
                    fileName,
                    mongoClient,
                    mode,
                });
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
    describe('existing regression tests', () => {
        it('should work for case 1', async () => {
            await queryResultTester({
                queryString: `
                select
                    c.id,
                    c.'First Name',
                    c.'Last Name',
                    cn.id as CNoteId,
                    cn.notes as Note,
                    cn.date as CNDate,
                    unset(_id)
                from customers c
                inner join 'customer-notes|unwind' cn on cn.id=c.id
                inner join 'customer-notes|unwind' cn2 on cn2.id=convert(c.id,'int')
                limit 4`,
                casePath: 'case1',
            });
        });

        it('should work for case 2', async () => {
            await queryResultTester({
                queryString: `
                SELECT
                    c.id,
                    c.'First Name',
                    c.'Last Name',
                    cn.id as CNoteId,
                    cn.notes as Note,
                    cn.date as CNDate,
                    unset(_id)
                FROM customers c
                left outer join 'customer-notes' 'cn|first' on cn.id=to_int(c.id)
                LIMIT 5`,
                casePath: 'case2',
            });
        });
        it('should work for case 3', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join `customer-notes|unwind` as cn on `cn`.id=c.id and cn.id<5 where c.id>1',
                casePath: 'case3',
            });
        });
        it('should work for case 4', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join `customer-notes|unwind` as cn on `cn`.id=c.id and cn.id<5',
                casePath: 'case4',
            });
        });
        it('should work for case 5', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join `customer-notes|first` as cn on `cn`.id=c.id and cn.id<5',
                casePath: 'case5',
            });
        });
        it('should work for case 6', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join `customer-notes|first` as cn on `cn`.id=c.id and cn.id<5',
                casePath: 'case6',
            });
        });
        it('should work for case 7', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join (select * from `customer-notes` where id>2) `cn|optimize|first` on c.id=cn.id',
                casePath: 'case7',
            });
        });
        it('should work for case 8', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join (select * from `customer-notes` where id>2) `cn|optimize|first` on cn.id=c.id',
                casePath: 'case8',
            });
        });
        it('should work for case 9', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join (select * from `customer-notes` where id>2) `cn|optimize` on cn.id=c.id',
                casePath: 'case9',
            });
        });
        it('should work for case 10', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join (select * from `customer-notes` where id>2) `cn|first` on cn.id=c.id',
                casePath: 'case10',
            });
        });
        it('should work for case 11', async () => {
            await queryResultTester({
                queryString:
                    'select c.*,cn.*,unset(_id,c._id,c.Rentals,c.Address,cn._id) from customers c inner join `customer-notes` cn on cn.id=c.id and (cn.id>2 or cn.id<5)',
                casePath: 'case11',
            });
        });
    });
});
