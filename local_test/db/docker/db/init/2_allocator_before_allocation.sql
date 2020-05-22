DROP TABLE IF EXISTS allocator_before_allocation;

CREATE TABLE allocator_before_allocation(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    blocks NUMERIC NOT NULL,
    mint NUMERIC NOT NULL,
    token_value NUMERIC NOT NULL,
    market_value NUMERIC NOT NULL,
    assets NUMERIC NOT NULL,
    total_assets NUMERIC NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON allocator_before_allocation(
	block_number
);

COMMENT ON TABLE allocator_before_allocation IS 'allocate event information. records are added each time an allocate is executed.';
COMMENT ON COLUMN allocator_before_allocation.event_id IS 'event id';
COMMENT ON COLUMN allocator_before_allocation.block_number IS 'event block number';
COMMENT ON COLUMN allocator_before_allocation.log_index IS 'event log index';
COMMENT ON COLUMN allocator_before_allocation.transaction_index IS 'event transaction index';
COMMENT ON COLUMN allocator_before_allocation.blocks IS 'Block numbers from the last allocate';
COMMENT ON COLUMN allocator_before_allocation.mint IS 'total rewards';
COMMENT ON COLUMN allocator_before_allocation.token_value IS 'asset value';
COMMENT ON COLUMN allocator_before_allocation.market_value IS 'asset value of market';
COMMENT ON COLUMN allocator_before_allocation.assets IS 'assets by market';
COMMENT ON COLUMN allocator_before_allocation.total_assets IS 'total assets';
COMMENT ON COLUMN allocator_before_allocation.raw_data IS 'event raw data';
