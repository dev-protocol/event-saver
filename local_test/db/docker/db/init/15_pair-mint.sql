DROP TABLE IF EXISTS pair_mint;

CREATE TABLE pair_mint(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    sender TEXT NOT NULL,
    amount0 NUMERIC NOT NULL,
	amount1 NUMERIC NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON pair_mint(
	block_number
);

COMMENT ON TABLE pair_mint IS 'UniswapV2Pair Mint event information. A record is created when liquidity is provided.';
COMMENT ON COLUMN pair_mint.event_id IS 'event id';
COMMENT ON COLUMN pair_mint.block_number IS 'event block number';
COMMENT ON COLUMN pair_mint.log_index IS 'event log index';
COMMENT ON COLUMN pair_mint.transaction_index IS 'event transaction index';
COMMENT ON COLUMN pair_mint.sender IS 'router address';
COMMENT ON COLUMN pair_mint.amount0 IS 'amount of tokens provided (0)';
COMMENT ON COLUMN pair_mint.amount1 IS 'amount of tokens provided (1)';
COMMENT ON COLUMN pair_mint.raw_data IS 'event raw data';
