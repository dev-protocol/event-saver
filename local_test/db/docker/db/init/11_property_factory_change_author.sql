DROP TABLE IF EXISTS property_factory_change_author;

CREATE TABLE property_factory_change_author(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    property TEXT NOT NULL,
    before_author TEXT NOT NULL,
    after_author TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON property_factory_change_author(
	block_number
);

COMMENT ON TABLE property_factory_change_author IS 'a table to which data is added when the property author changes.';
COMMENT ON COLUMN property_factory_change_author.event_id IS 'event id';
COMMENT ON COLUMN property_factory_change_author.block_number IS 'event block number';
COMMENT ON COLUMN property_factory_change_author.log_index IS 'event log index';
COMMENT ON COLUMN property_factory_change_author.transaction_index IS 'event transaction index';
COMMENT ON COLUMN property_factory_change_author.property IS 'address of the property whose author has been changed';
COMMENT ON COLUMN property_factory_change_author.before_author IS 'author address before the change';
COMMENT ON COLUMN property_factory_change_author.after_author IS 'author address after the change';
COMMENT ON COLUMN property_factory_change_author.raw_data IS 'event raw data';
