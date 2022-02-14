# NFT Event Server Repo

## Set of Services which indexes the events emitted by a given smart contract (EVM) and exposes a GraphQL API around those events

### Example implementation using the Bored Ape Yacht Club NFT contract (address) in `.env`
---
## How to use:
populate `.env` with DB config and contract address

run `docker-compose up`

---
## Notes:
Repos:
  - models
  - scan
  - gql
  - [subgraphs]
  - [infra]

Connections:
  - Infura node
  - postgres
  - [the graph]

TODO:
  - actual error classes and handling
  - testing
  - iterate over event logs in chunks and keep track of already scanned blocks
  - better event parsing
  - query, download, store ABIs if not exist
  - break into separate repos
  - ci/cd
