DROP TABLE IF EXISTS metrics_factory_destroy;

CREATE TABLE metrics_factory_destroy(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    metrics TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON metrics_factory_destroy(
	block_number
);

COMMENT ON TABLE metrics_factory_destroy IS 'metrics destroy event information. records are added each time an metrics is disable.';
COMMENT ON COLUMN metrics_factory_destroy.event_id IS 'event id';
COMMENT ON COLUMN metrics_factory_destroy.block_number IS 'event block number';
COMMENT ON COLUMN metrics_factory_destroy.log_index IS 'event log index';
COMMENT ON COLUMN metrics_factory_destroy.transaction_index IS 'event transaction index';
COMMENT ON COLUMN metrics_factory_destroy.from_address IS 'the address of the market contract that disabled the metrics';
COMMENT ON COLUMN metrics_factory_destroy.metrics IS 'the address of the disabled metrics';
COMMENT ON COLUMN metrics_factory_destroy.raw_data IS 'event raw data';
