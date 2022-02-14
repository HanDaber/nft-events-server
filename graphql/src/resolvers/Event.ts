import { getManager } from "typeorm";
import {
    Query,
    Resolver,
} from "type-graphql"
import { Event } from "@handaber/nft-events-models";

@Resolver(of => Event)
export class EventResolver {
    @Query(() => String)
    async all(): Promise<Event[]> {
        return await getManager().find(Event);
    }
}