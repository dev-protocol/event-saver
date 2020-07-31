DROP TABLE IF EXISTS dev_property_transfer;

CREATE TABLE dev_property_transfer(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
	value NUMERIC NOT NULL,
	is_from_address_property BOOLEAN NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON dev_property_transfer(
	block_number
);

COMMENT ON TABLE dev_property_transfer IS 'Transfer event for a DEV token whose from address or to address is a property address.';
COMMENT ON COLUMN dev_property_transfer.event_id IS 'event id';
COMMENT ON COLUMN dev_property_transfer.block_number IS 'event block number';
COMMENT ON COLUMN dev_property_transfer.log_index IS 'event log index';
COMMENT ON COLUMN dev_property_transfer.transaction_index IS 'event transaction index';
COMMENT ON COLUMN dev_property_transfer.from_address IS 'from address';
COMMENT ON COLUMN dev_property_transfer.to_address IS 'to address';
COMMENT ON COLUMN dev_property_transfer.value IS 'value';
COMMENT ON COLUMN dev_property_transfer.is_from_address_property IS 'if from address is property address, true';
COMMENT ON COLUMN dev_property_transfer.raw_data IS 'event raw data';
