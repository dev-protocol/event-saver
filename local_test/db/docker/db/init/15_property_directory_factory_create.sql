DROP TABLE IF EXISTS property_directory_factory_create;

CREATE TABLE property_directory_factory_create(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    property_directory TEXT NOT NULL,
    author TEXT NOT NULL,
	name TEXT NOT NULL,
	symbol TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON property_directory_factory_create(
	block_number
);

COMMENT ON TABLE property_directory_factory_create IS 'property directory create event information. records are added each time an property directory is created.';
COMMENT ON COLUMN property_directory_factory_create.event_id IS 'event id';
COMMENT ON COLUMN property_directory_factory_create.block_number IS 'event block number';
COMMENT ON COLUMN property_directory_factory_create.log_index IS 'event log index';
COMMENT ON COLUMN property_directory_factory_create.transaction_index IS 'event transaction index';
COMMENT ON COLUMN property_directory_factory_create.property_directory IS 'the address of the property directory';
COMMENT ON COLUMN property_directory_factory_create.author IS 'the address of the property directory token author';
COMMENT ON COLUMN property_directory_factory_create.name IS 'the name of the property directory token';
COMMENT ON COLUMN property_directory_factory_create.symbol IS 'the symbol of the property directory token';
COMMENT ON COLUMN property_directory_factory_create.raw_data IS 'event raw data';
