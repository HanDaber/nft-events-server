import * as dotenv from 'dotenv';
import { ApolloServer } from "apollo-server-express"
import express from "express"
import "reflect-metadata"
import { buildSchema } from "type-graphql"
import { EventResolver } from "./resolvers/Event"

import { DB, Event } from "@handaber/nft-events-models";

dotenv.config({ path: __dirname+'/../.env' });

const { SERVER_PORT } = process.env;

console.log('gql', { SERVER_PORT })

startServer()

async function startServer() {
    const schema = await buildSchema({
      resolvers: [EventResolver],
      emitSchemaFile: true,
    })
    const app = express()

    DB.connect(async (connection: any) => {
        console.log("connected to DB")

        const server = new ApolloServer({
            schema,
            context: () => ({}),
        })
        await server.start()
        server.applyMiddleware({ app })

        app.listen(SERVER_PORT, async () => {
            console.log(`GQL says 'sup from port ${SERVER_PORT}`)

            const aFewEvents = await connection.manager.find(Event, { take: 3 });
            console.log({aFewEvents})
        })
    });
}
