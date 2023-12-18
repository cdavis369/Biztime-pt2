process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompanies;

beforeEach(async function() {
    const query = await db.query(`
    INSERT INTO companies (code, name, description) 
        VALUES ('testcompany', 'Test Company', 'This is a test company.')
        RETURNING *`);
        testCompanies = query.rows;
});

describe("GET /companies", function() {
    test("Gets a list of 3 companies", async function() {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: testCompanies
        });
    });
});

describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
        const response = await request(app).get(`/companies/${testCompanies[0].code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({company: testCompanies[0]});
    });
    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).get(`/companies/garblesnuff`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /companies", function() {
    test("Creates a new company", async function() {
        const response = await request(app)
        .post(`/companies`)
        .send({
            name: "Test Company 4!",
            description: "This is a fourth test company."
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: "testcompany4", 
                name: "Test Company 4", 
                description: "This is a fourth test company."
            }
        });
    });
});

describe("PUT /companies", function() {
    test("Updates a current company", async function() {
        const response = await request(app)
        .put(`/companies/${testCompanies[0].code}`)
        .send({
            name: "garblesnuff",
            description: "1st Company Tested"
        });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: testCompanies[0].code, 
                name: "garblesnuff", 
                description: "1st Company Tested"
            }
        });
    });
})

describe("DELETE /comapnies/:code", function() {
    test("Deletes a single a company", async function() {
        const response = await request(app)
        .delete(`/companies/${testCompanies[0].code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ message: `Company ${testCompanies[0].code} deleted` });
    });
});

afterEach(async function() {
    await db.query("DELETE FROM companies");
});
  
afterAll(async function() {
    await db.end();
});