import {
    Query,
    Resolver,
} from "type-graphql"
import { Event } from "@handaber/nft-events-models";

@Resolver(of => Event)
export class EventResolver {
    @Query(() => String)
    sample(): String {
        return "Hello"
    }
}