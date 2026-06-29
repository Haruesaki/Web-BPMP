const { Client } = require('pg');

async function migrate() {
    // 1. Connect to default 'postgres' database to create new db
    const clientDefault = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'root',
        port: 5432,
    });

    try {
        await clientDefault.connect();
        const res = await clientDefault.query("SELECT datname FROM pg_database WHERE datname = 'bpmp_lampung'");
        if (res.rowCount === 0) {
            console.log("Creating database bpmp_lampung...");
            await clientDefault.query("CREATE DATABASE bpmp_lampung");
            console.log("Database created successfully.");
        } else {
            console.log("Database bpmp_lampung already exists.");
        }
    } catch (e) {
        console.error("Error creating database:", e);
    } finally {
        await clientDefault.end();
    }

    // 2. Connect to 'bpmp_lampung' to create table
    const clientApp = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'bpmp_lampung',
        password: 'root',
        port: 5432,
    });

    try {
        await clientApp.connect();
        console.log("Creating table youtube_cache...");
        await clientApp.query(`
            CREATE TABLE IF NOT EXISTS youtube_cache (
                id SERIAL PRIMARY KEY,
                videos_data JSONB NOT NULL,
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Table youtube_cache created successfully.");
    } catch (e) {
        console.error("Error creating table:", e);
    } finally {
        await clientApp.end();
    }
}

migrate();
