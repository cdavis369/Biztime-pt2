const { Client } = require("pg");
let DB_URI;


if (process.env.NOCE_ENV === "test") {
    DB_URI = "postgresql://corey:caller1d@localhost/biztime/biztime_test";
}
else {
    DB_URI = "postgresql://corey:caller1d@localhost/biztime";
}

const db = new Client({
    // host :'127.0.0.1',
    // port :3000,
    // user: 'corey',
    // password: 'caller1d',
    // database: 'biztime'
    connectionString: DB_URI
});

db.connect();

module.exports = db;