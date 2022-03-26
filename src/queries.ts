import { Pool, PoolConfig } from "pg";
import { Request, Response } from 'express';

var dbInfo: PoolConfig = {
    user: 'proreport',
    host: 'localhost',
    database: 'proreport',
    password: 'test',
    port: 5432
};

if (process.env.NODE_ENV === 'production') {
    dbInfo = {
        user: 'proreport',
        host: '/var/run/postgresql',
        database: 'proreport',
        port: 5432
    }
}

const pool = new Pool(dbInfo);

export const getUsers = (request: Request, response: Response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
        if (error) throw error;
        response.status(200).json(results.rows);
    });
}