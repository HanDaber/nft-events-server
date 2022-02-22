# NFT Event Server Repo

## Set of Services which indexes the events emitted by a given smart contract (EVM) and exposes a GraphQL API around those events

### Example implementation using the Bored Ape Yacht Club NFT contract (address) in `.env`
---
## How to start:
populate `.env` with DB config, node endpoint and contract address, etc

Run `npm run dev`

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
  - better event parsing
  - query, download, store ABIs if not exist
  - break into separate repos
  - ci/cd
