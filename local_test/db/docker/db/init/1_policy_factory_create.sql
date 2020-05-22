DROP TABLE IF EXISTS policy_factory_create;

CREATE TABLE policy_factory_create(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    log_index INT NOT NULL,
    transaction_index INT NOT NULL,
    from_address TEXT NOT NULL,
    policy_address TEXT NOT NULL,
    inner_policy TEXT NOT NULL,
    raw_data TEXT NOT NULL,
    PRIMARY KEY(event_id)
);

CREATE INDEX ON policy_factory_create(
	block_number
);

COMMENT ON TABLE policy_factory_create IS 'policy create event information. records are added each time a new policy is created.';
COMMENT ON COLUMN policy_factory_create.event_id IS 'event id';
COMMENT ON COLUMN policy_factory_create.block_number IS 'event block number';
COMMENT ON COLUMN policy_factory_create.log_index IS 'event log index';
COMMENT ON COLUMN policy_factory_create.transaction_index IS 'event transaction index';
COMMENT ON COLUMN policy_factory_create.from_address IS 'author address of the policy';
COMMENT ON COLUMN policy_factory_create.policy_address IS 'policy address';
COMMENT ON COLUMN policy_factory_create.inner_policy IS 'detailed policy address';
COMMENT ON COLUMN policy_factory_create.raw_data IS 'event raw data';
