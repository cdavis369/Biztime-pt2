process.env.NODE_ENV = "test";
const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInvoices, testCompanies;

beforeAll(async () => {
    const query = await db.query(`
        INSERT INTO companies (code, name, description) 
            VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
            ('ibm', 'IBM', 'Big blue.')
            RETURNING *`
    );
    testCompanies = query.rows;
});

beforeEach(async function() {
    const query = await db.query(`
        INSERT INTO invoices (comp_Code, amt, paid, paid_date)
            VALUES ('apple', 100, false, null),
            ('apple', 200, false, null),
            ('apple', 300, true, '2018-01-01'),
            ('ibm', 400, false, null)
            RETURNING *`
    );
    testInvoices = query.rows;
    console.log("INVOICES: ", testInvoices)
});

describe("GET /invoices", function() {
    test("Gets a list of invoices", async function() {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({invoices: testInvoices});
    });
});

describe("GET /invoices/:id", function() {
    test("Gets a single company", async function() {
        const response = await request(app).get(`/invoices/${testInvoices[0].id}`);
        expect(response.statusCode).toEqual(200);
        const r = JSON.parse(response.body);
        console.log(r)
        expect(response.body).toEqual({company: testInvoices[0]});
    });
    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).get(`/invoices/100`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /invoices", function() {
    test("Creates a new invoice", async function() {
        const response = await request(app)
        .post(`/invoices`)
        .send({
            comp_code: 'apple',
            amt: 123456
        });
        const query = await db.query("SELECT * FROM invoices WHERE comp_code='apple' AND amt=123456");
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: query.rows[0]
        });
    });
});

describe("PUT /invoices", function() {
    test("Updates a current company", async function() {
        const response = await request(app)
        .put(`/invoices/${testInvoices[0].id}`)
        .send({
            amt: 654321
        });
        const query = await db.query(`SELECT * FROM invoices WHERE id=${testInvoices[0].id}`);
        const invoice = JSON.parse({invoice:query.rows[0]});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual(invoice);
    });
})

describe("DELETE /invoices/:id", function() {
    test("Deletes a single invoice", async function() {
        const response = await request(app)
        .delete(`/invoices/${testInvoices[0].id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ message: `Invoice ${testInvoices[0].id} deleted` });
    });
});

afterEach(async function() {
    await db.query("DELETE FROM invoices");
});
  
afterAll(async function() {
    await db.query("DELETE FROM companies");
    await db.end();
});