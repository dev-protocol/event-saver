DROP TABLE IF EXISTS lockup_lockedup;

CREATE TABLE lockup_lockedup(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    property TEXT NOT NULL,
    token_value NUMERIC NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON lockup_lockedup(
	block_number
);

COMMENT ON TABLE lockup_lockedup IS 'lockup event information. records are added each time an lockup is executed.';
COMMENT ON COLUMN lockup_lockedup.event_id IS 'event id';
COMMENT ON COLUMN lockup_lockedup.block_number IS 'event block number';
COMMENT ON COLUMN lockup_lockedup.log_index IS 'event log index';
COMMENT ON COLUMN lockup_lockedup.transaction_index IS 'event transaction index';
COMMENT ON COLUMN lockup_lockedup.from_address IS 'The address holding the Dev token to be locked up';
COMMENT ON COLUMN lockup_lockedup.property IS 'lockup destination property address';
COMMENT ON COLUMN lockup_lockedup.token_value IS 'lockup token value';
COMMENT ON COLUMN lockup_lockedup.raw_data IS 'event raw data';
