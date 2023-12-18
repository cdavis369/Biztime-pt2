const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
const slugify = require("slugify");

router.get("/", async function(req, res, next) {
    try {
        const query = await db.query("SELECT * FROM companies");
        return res.json({companies: query.rows});
    } catch (error) {
        return next(error);
    }
});

router.get("/:code", async function(req, res, next) {
    try {
        const com_code = req.params.code;
        const query = await db.query(`
        SELECT *
            FROM companies as c 
            LEFT JOIN company_industries as c_i
            ON c.code = c_i.comp_code
            WHERE c.code = $1`, [com_code]);
        if (query.rows.length === 0) {
            throw new ExpressError(`Company not found with code ${com_code}`, 404)
        }
        const { code, name, description } = query.rows[0];
        const industries = query.rows.map(rows => rows.ind_code);
        return res.json({code, name, description, industries})
    } catch (error) {
        return next(error);
    }
});

router.post("/", async function(req, res, next) {
    try {
        const {name, description} = req.body;
        const code = slugify(name, {
            replacement: '',
            remove: /[\.,!@#$%^&*)('":;]/g,
            lower: true,
            strict: true
        });
        const query = await db.query(
            `INSERT INTO companies (code, name, description)
                VALUES ($1, $2, $3)
                RETURNING code, name, description`,
            [code, name, description]
        );
        res.statusCode = 201;
        return res.json({company: query.rows[0]})
    } catch (error) {
        return next(error);
    }
});

router.put("/:code", async function(req, res, next) {
    const {name, description} = req.body;
    const code = req.params.code;
    try {
        const sql = "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *";
        const query = await db.query(sql, [name, description, code]);
        if (query.rows.length === 0) {
            throw new ExpressError(`Company not found with code ${code}`, 404)
        }
        return res.json({company: query.rows[0]})
    } catch (error) {
        return next(error);
    }
});

router.delete("/:code", async function(req, res, next) {
    const code = req.params.code;
    try {
        const query = await db.query("DELETE FROM companies WHERE code=$1 RETURNING code", [code]);
        if (query.rows.length === 0) {
            throw new ExpressError(`Company not found with code ${code}`, 404);
        }
        return res.json({message: `Company ${code} deleted`});
    } catch (error) {
        return next(error);
    }
});

module.exports = router;