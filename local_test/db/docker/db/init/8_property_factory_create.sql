DROP TABLE IF EXISTS property_factory_create;

CREATE TABLE property_factory_create(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    property TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON property_factory_create(
	block_number
);

COMMENT ON TABLE property_factory_create IS 'property create event information. records are added each time an property is created.';
COMMENT ON COLUMN property_factory_create.event_id IS 'event id';
COMMENT ON COLUMN property_factory_create.block_number IS 'event block number';
COMMENT ON COLUMN property_factory_create.log_index IS 'event log index';
COMMENT ON COLUMN property_factory_create.transaction_index IS 'event transaction index';
COMMENT ON COLUMN property_factory_create.from_address IS 'the address of the account where you created the property';
COMMENT ON COLUMN property_factory_create.property IS 'the address of the created property';
COMMENT ON COLUMN property_factory_create.raw_data IS 'event raw data';
