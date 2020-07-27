DROP TABLE IF EXISTS current_lockup;

CREATE TABLE current_lockup(
    wallet_address TEXT NOT NULL,
    property_address TEXT NOT NULL,
    value NUMERIC NOT NULL,
	locked_up_event_id TEXT NOT NULL
);

CREATE INDEX ON current_lockup(
	wallet_address
);

COMMENT ON TABLE current_lockup IS 'current user lockup information.';
COMMENT ON COLUMN current_lockup.wallet_address IS 'wallet address';
COMMENT ON COLUMN current_lockup.property_address IS 'property address';
COMMENT ON COLUMN current_lockup.value IS 'lockup value';
COMMENT ON COLUMN current_lockup.locked_up_event_id IS 'event id of lockup_lockedup';
