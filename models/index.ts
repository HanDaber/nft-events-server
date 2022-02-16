import * as dotenv from 'dotenv';
import "reflect-metadata";
import { Connection, createConnection } from "typeorm";
import { Event } from "./src/entity/Event";
import { BlockSpan } from "./src/entity/BlockSpan";

dotenv.config();

const { 
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD
} = process.env;

// Use e.g.
// DB.connect(async (connection) => {
//     doYourDeed();
//     connection.close();
// });
export namespace DB {
    export async function connect(next: Function) {

        const connection: Connection = await createConnection({
            type: "postgres",
            host: DB_HOST || "localhost",
            port: 5432,
            username: DB_USERNAME,
            password: DB_PASSWORD,
            database: "nft_events",
            synchronize: true,
            logging: false,
            entities: [Event, BlockSpan],
            migrations: [__dirname + "../src/migration/**/*.ts"],
            subscribers: [__dirname + "../src/subscriber/**/*.ts"],
            cli: {
               entitiesDir: "src/entity",
               migrationsDir: "src/migration",
               subscribersDir: "src/subscriber"
            }
        });

        next(connection);
    };
}

export { Event, BlockSpan };