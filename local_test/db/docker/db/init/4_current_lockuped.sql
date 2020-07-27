DROP TABLE IF EXISTS current_lockuped;

CREATE TABLE current_lockuped(
    property_address TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    value NUMERIC NOT NULL,
	locked_up_event_id TEXT NOT NULL,
	block_number INT NOT NULL,
);

CREATE INDEX ON current_lockuped(
	property_address
);

COMMENT ON TABLE current_lockuped IS 'current property lockuped information.';
COMMENT ON COLUMN current_lockuped.property_address IS 'property address';
COMMENT ON COLUMN current_lockuped.wallet_address IS 'wallet address';
COMMENT ON COLUMN current_lockuped.value IS 'lockuped value';
COMMENT ON COLUMN current_lockuped.locked_up_event_id IS 'event id of lockup_lockedup';
