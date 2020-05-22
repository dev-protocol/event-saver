DROP TABLE IF EXISTS property_authentication_deleted;

CREATE TABLE property_authentication_deleted(
    property TEXT NOT NULL,
    metrics TEXT NOT NULL,
    block_number INT NOT NULL,
    market TEXT NOT NULL,
    authentication_id TEXT NOT NULL,
    PRIMARY KEY(property, metrics)
);


CREATE INDEX ON property_authentication_deleted(
	property
);

COMMENT ON TABLE property_authentication_deleted IS 'The property de-authentication information.';
COMMENT ON COLUMN property_authentication_deleted.property IS 'property address';
COMMENT ON COLUMN property_authentication_deleted.metrics IS 'disabled metrics address for authentication';
COMMENT ON COLUMN property_authentication_deleted.block_number IS 'block number where the de-authentication process was executed';
COMMENT ON COLUMN property_authentication_deleted.market IS 'de-authenticated market address';
COMMENT ON COLUMN property_authentication_deleted.authentication_id IS 'disabled authentication id';
