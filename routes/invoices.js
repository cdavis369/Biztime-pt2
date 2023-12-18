const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function(req, res, next) {
    try {
        const query = await db.query("SELECT * FROM invoices");
        return res.json({invoices: query.rows});
    } catch (error) {
        return next(error);
    }
})

router.get("/:id", async function(req, res, next) {
    try {
        const id = req.params.id;
        const invoiceQuery = await db.query("SELECT * FROM invoices WHERE id = $1", [id]);
        if (invoiceQuery.rows.length === 0) {
            throw new ExpressError(`Invoice not found with id ${id}`, 404)
        }
        const invoice = invoiceQuery.rows[0];
        const companyQuery = await db.query("SELECT * FROM companies WHERE code = $1", [invoice.comp_code])
        invoice['company']  = companyQuery.rows[0];
        return res.json({invoice: invoice})
    } catch (error) {
        return next(error);
    }
});

router.get("/invoices/companies/:id", async function(req, res, next) {
    const code = req.params.code;
    let company;
    try {
        const companyQuery = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
        if (companyQuery.rows.length === 0) {
            throw new ExpressError(`Company not found with code ${code}`, 404)
        }
        company = companyQuery.rows[0];
        const invoicesQuery = await db.query(`SELECT * FROM invoices WHERE comp_code = $1`, [code]);
        if (invoicesQuery.rows.length === 0) {
            company['invoices'] = null;
        } else {
            company['invoices'] = invoicesQuery.rows;
        }
        return res.json({invoices: company});
    } catch (error) {
        return next(error);
    }
    
});

router.post("/", async function(req, res, next) {
    try {
        const {comp_code, amt} = req.body;
        const query = await db.query(
            `INSERT INTO invoices (comp_code, amt)
                VALUES ($1, $2)
                RETURNING *`,
            [comp_code, amt]
        );
        res.statusCode = 201;
        return res.json({invoice: query.rows[0]})
    } catch (error) {
        return next(error);
    }
});

router.put("/:id", async function(req, res, next) {
    const {amt, paid} = req.body;
    const id = req.params.id;
    let sql, query;
    try {
        if (paid) {
            const date = new Date();
            console.log(date)
            sql = "UPDATE invoices SET amt = $1, paid = $2, paid_date = $3 WHERE id = $4 RETURNING *";
            query = await db.query(sql, [amt, true, date, id]);
        } else {
            sql = "UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *";
            query = await db.query(sql, [amt, id]);
        }
        if (query.rows.length === 0) {
            throw new ExpressError(`Invoice not found with code ${code}`, 404)
        }
        return res.json({invoice: query.rows[0]})
    } catch (error) {
        return next(error);
    }
});

router.delete("/:id", async function(req, res, next) {
    const id = req.params.id;
    try {
        const query = await db.query("DELETE FROM invoices WHERE id=$1 RETURNING id", [id]);
        if (query.rows.length === 0) {
            throw new ExpressError(`Invoice not found with id ${id}`, 404);
        }
        return res.json({message: `Invoice ${id} deleted`});
    } catch (error) {
        return next(error);
    }
});


module.exports = router;