DROP TABLE IF EXISTS pair_transfer;

CREATE TABLE pair_transfer(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
	token_value NUMERIC NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON pair_mint(
	block_number
);

COMMENT ON TABLE pair_transfer IS 'Uni v2 token transfer event information';
COMMENT ON COLUMN pair_transfer.event_id IS 'event id';
COMMENT ON COLUMN pair_transfer.block_number IS 'event block number';
COMMENT ON COLUMN pair_transfer.log_index IS 'event log index';
COMMENT ON COLUMN pair_transfer.transaction_index IS 'event transaction index';
COMMENT ON COLUMN pair_transfer.from_address IS 'from address';
COMMENT ON COLUMN pair_transfer.to_address IS 'to address';
COMMENT ON COLUMN pair_transfer.token_value IS 'value';
COMMENT ON COLUMN pair_transfer.raw_data IS 'event raw data';
