# NFT Event Server Repo

## Set of Services which indexes the events emitted by a given smart contract (EVM) and exposes a GraphQL API around those events

### Example implementation using the Bored Ape Yacht Club NFT contract (address)

`docker-compose up --build`

### Notes:
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
  - parameterize and use .env file
  - actual error classes and handling
  - testing
  - query, download, store ABIs if not exist
  - break into separate repos
  - publish modules
  - ci/cd
