CREATE USER nft_events_server WITH PASSWORD 'wagmi';
CREATE DATABASE nft_events;
GRANT ALL PRIVILEGES ON DATABASE nft_events TO nft_events_server;