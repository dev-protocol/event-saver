DROP TABLE IF EXISTS account_lockup;

CREATE TABLE account_lockup(
    account_address TEXT NOT NULL,
    property_address TEXT NOT NULL,
    value NUMERIC NOT NULL,
	locked_up_event_id TEXT NOT NULL,
	block_number INT NOT NULL,
	PRIMARY KEY(account_address, property_address)
);

COMMENT ON TABLE account_lockup IS 'current user lockup information.';
COMMENT ON COLUMN account_lockup.account_address IS 'account address';
COMMENT ON COLUMN account_lockup.property_address IS 'property address';
COMMENT ON COLUMN account_lockup.value IS 'lockup value';
COMMENT ON COLUMN account_lockup.locked_up_event_id IS 'event id of lockup_lockedup';
COMMENT ON COLUMN account_lockup.block_number IS 'block number';
