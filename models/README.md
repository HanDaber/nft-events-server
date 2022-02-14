# NFT Events Server Models and DB Driver

## TypeORM Models and Postgres driver for shared use by nft-events-server services

### Steps to run this module:

1. `npm i`
2. `npm start` to develop locally
3. `tsc`
4. `npm publish`
5. import into your project `npm install --save @handaber/nft-events-models`
6. include in your project's `.env`: DB_HOST, DB_USERNAME, DB_PASSWORD

TODO:
   - Event `id` should be something like `blockNumber + logIndex` from original event
   - more granular columns per each argument in Event `args`
   - different entities for Event types with different arguments in `args`