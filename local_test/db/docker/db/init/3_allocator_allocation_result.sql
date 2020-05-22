DROP TABLE IF EXISTS allocator_allocation_result;

CREATE TABLE allocator_allocation_result(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    metrics TEXT NOT NULL,
    arg_value NUMERIC NOT NULL,
    market TEXT NOT NULL,
    property TEXT NOT NULL,
    lockup_value NUMERIC NOT NULL,
    result NUMERIC NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON allocator_allocation_result(
	block_number
);

COMMENT ON TABLE allocator_allocation_result IS 'allocate event information. records are added each time an allocate is executed.';
COMMENT ON COLUMN allocator_allocation_result.event_id IS 'event id';
COMMENT ON COLUMN allocator_allocation_result.block_number IS 'event block number';
COMMENT ON COLUMN allocator_allocation_result.log_index IS 'event log index';
COMMENT ON COLUMN allocator_allocation_result.transaction_index IS 'event transaction index';
COMMENT ON COLUMN allocator_allocation_result.metrics IS 'the metrics address specified when allocate is executed';
COMMENT ON COLUMN allocator_allocation_result.arg_value IS 'the target asset value passed from the market contract';
COMMENT ON COLUMN allocator_allocation_result.market IS 'the address of the market tied to the metrics';
COMMENT ON COLUMN allocator_allocation_result.property IS 'the address of the property tied to the metrics';
COMMENT ON COLUMN allocator_allocation_result.lockup_value IS 'lockup value per property';
COMMENT ON COLUMN allocator_allocation_result.result IS 'the result of allocation';
COMMENT ON COLUMN allocator_allocation_result.raw_data IS 'event raw data';
