const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get("/", async function(req, res, next) {
    try {
        const query = await db.query(
            `SELECT code, name, comp_code
                FROM industries as i
                LEFT JOIN company_industries as c
                ON i.code = c.ind_code`
        );
        // return res.json({industries: query.rows})
        const result = {};
        for (const row of query.rows) {
            if (row['code'] in result && row['comp_code']) { 
                result[row['code']]['comp_codes'].push(row['comp_code']);
            } else {
                result[row['code']] = {name: row['name']};
                if (row['comp_code']) {
                    result[row['code']]['comp_codes'] = [row['comp_code']];
                } else {
                    result[row['code']]['comp_codes'] = null;
                }
            }
        }
        return res.json({industries: result})
    } catch (error) {
        return next(error);
    }
});

router.put("/", async function(req, res, next) {
    const {ind_code, name} = req.body;
    try {
        const query = await db.query(
            `INSERT INTO industries (code, name)
                VALUES ($1, $2) RETURNING *`,
                [ind_code, name]
        );
        return res.json({industry: query.rows[0]})
    } catch (error) {
        return next(error);
    }
});

router.put("/company", async function(req, res, next) {
    const {ind_code, comp_code} = req.body;
    try {
        const query = await db.query(
            `INSERT INTO company_industries (ind_code, comp_code)
                VALUES ($1, $2) RETURNING *`,
                [ind_code, comp_code]
        );
        return res.json({association: query.rows[0]})
    }
    catch(error) {
        return next(error);
    }
});

module.exports = router;