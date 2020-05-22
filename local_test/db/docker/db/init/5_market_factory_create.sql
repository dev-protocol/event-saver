DROP TABLE IF EXISTS market_factory_create;

CREATE TABLE market_factory_create(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    market TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON market_factory_create(
	block_number
);

COMMENT ON TABLE market_factory_create IS 'market create event information. records are added each time an market is created.';
COMMENT ON COLUMN market_factory_create.event_id IS 'event id';
COMMENT ON COLUMN market_factory_create.block_number IS 'event block number';
COMMENT ON COLUMN market_factory_create.log_index IS 'event log index';
COMMENT ON COLUMN market_factory_create.transaction_index IS 'event transaction index';
COMMENT ON COLUMN market_factory_create.from_address IS 'the address of the account where you created the market';
COMMENT ON COLUMN market_factory_create.market IS 'the address of the created market';
COMMENT ON COLUMN market_factory_create.raw_data IS 'event raw data';
