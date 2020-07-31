DROP TABLE IF EXISTS property_lockup;

CREATE TABLE property_lockup(
    property_address TEXT NOT NULL,
    account_address TEXT NOT NULL,
    value NUMERIC NOT NULL,
	locked_up_event_id TEXT NOT NULL,
	PRIMARY KEY(account_address, property_address)
);


COMMENT ON TABLE property_lockup IS 'current property lockuped information.';
COMMENT ON COLUMN property_lockup.property_address IS 'property address';
COMMENT ON COLUMN property_lockup.account_address IS 'account address';
COMMENT ON COLUMN property_lockup.value IS 'lockuped value';
COMMENT ON COLUMN property_lockup.locked_up_event_id IS 'event id of lockup_lockedup';
