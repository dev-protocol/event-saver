DROP TABLE IF EXISTS property_directory_factory_recreate;

CREATE TABLE property_directory_factory_recreate(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    old TEXT NOT NULL,
    new TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON property_directory_factory_recreate(
	block_number
);

COMMENT ON TABLE property_directory_factory_recreate IS 'property directory recreate event information. records are added each time an property directory is recreated.';
COMMENT ON COLUMN property_directory_factory_recreate.event_id IS 'event id';
COMMENT ON COLUMN property_directory_factory_recreate.block_number IS 'event block number';
COMMENT ON COLUMN property_directory_factory_recreate.log_index IS 'event log index';
COMMENT ON COLUMN property_directory_factory_recreate.transaction_index IS 'event transaction index';
COMMENT ON COLUMN property_directory_factory_recreate.old IS 'the address of the before property directory';
COMMENT ON COLUMN property_directory_factory_recreate.new IS 'the address of the after property directory';
COMMENT ON COLUMN property_directory_factory_recreate.raw_data IS 'event raw data';
