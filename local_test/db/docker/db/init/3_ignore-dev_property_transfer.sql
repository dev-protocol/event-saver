DROP TABLE IF EXISTS ignore_dev_property_transfer;

CREATE TABLE ignore_dev_property_transfer(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
	value NUMERIC NOT NULL,
	is_lockup BOOLEAN NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON ignore_dev_property_transfer(
	block_number
);

COMMENT ON TABLE ignore_dev_property_transfer IS 'Ignore list of transfer events for dev tokens.';
COMMENT ON COLUMN ignore_dev_property_transfer.event_id IS 'event id';
COMMENT ON COLUMN ignore_dev_property_transfer.block_number IS 'event block number';
COMMENT ON COLUMN ignore_dev_property_transfer.log_index IS 'event log index';
COMMENT ON COLUMN ignore_dev_property_transfer.transaction_index IS 'event transaction index';
COMMENT ON COLUMN ignore_dev_property_transfer.from_address IS 'from address';
COMMENT ON COLUMN ignore_dev_property_transfer.to_address IS 'to address';
COMMENT ON COLUMN ignore_dev_property_transfer.value IS 'value';
COMMENT ON COLUMN ignore_dev_property_transfer.is_lockup IS 'if it is lockup trahsfer, true';
COMMENT ON COLUMN ignore_dev_property_transfer.raw_data IS 'event raw data';
