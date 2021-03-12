DROP TABLE IF EXISTS metrics_factory_create;

CREATE TABLE metrics_factory_create(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    metrics TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON metrics_factory_create(
	block_number
);

COMMENT ON TABLE metrics_factory_create IS 'metrics create event information. records are added each time an metrics is created.';
COMMENT ON COLUMN metrics_factory_create.event_id IS 'event id';
COMMENT ON COLUMN metrics_factory_create.block_number IS 'event block number';
COMMENT ON COLUMN metrics_factory_create.log_index IS 'event log index';
COMMENT ON COLUMN metrics_factory_create.transaction_index IS 'event transaction index';
COMMENT ON COLUMN metrics_factory_create.from_address IS 'the address of the market contract that created the metrics';
COMMENT ON COLUMN metrics_factory_create.metrics IS 'the address of the created metrics';
COMMENT ON COLUMN metrics_factory_create.raw_data IS 'event raw data';
