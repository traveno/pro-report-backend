import { Pool } from "pg";
import { Request, Response } from 'express';

const pool = new Pool({
    user: 'proreport',
    host: 'localhost',
    database: 'proreport',
    password: 'test',
    port: 5432
});

export const getUsers = (request: Request, response: Response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
        if (error) throw error;
        response.status(200).json(results.rows);
    });
}