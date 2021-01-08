DROP TABLE IF EXISTS withdraw_property_transfer;

CREATE TABLE withdraw_property_transfer(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    property_address TEXT NOT NULL,
    from_address TEXT NOT NULL,
	to_address TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON withdraw_property_transfer(
	block_number
);

COMMENT ON TABLE withdraw_property_transfer IS 'property transfer information';
COMMENT ON COLUMN withdraw_property_transfer.event_id IS 'event id';
COMMENT ON COLUMN withdraw_property_transfer.block_number IS 'event block number';
COMMENT ON COLUMN withdraw_property_transfer.log_index IS 'event log index';
COMMENT ON COLUMN withdraw_property_transfer.transaction_index IS 'event transaction index';
COMMENT ON COLUMN withdraw_property_transfer.property_address IS 'property address';
COMMENT ON COLUMN withdraw_property_transfer.from_address IS 'from address';
COMMENT ON COLUMN withdraw_property_transfer.to_address IS 'to address';
COMMENT ON COLUMN withdraw_property_transfer.raw_data IS 'event raw data';
