DROP TABLE IF EXISTS property_authentication;

CREATE TABLE property_authentication(
    property TEXT NOT NULL,
    metrics TEXT NOT NULL,
    block_number INT NOT NULL,
    market TEXT NOT NULL,
    authentication_id TEXT NOT NULL,
    PRIMARY KEY(property, metrics)
);


CREATE INDEX ON property_authentication(
	property
);

COMMENT ON TABLE property_authentication IS 'the authentication information for the property.';
COMMENT ON COLUMN property_authentication.property IS 'property address';
COMMENT ON COLUMN property_authentication.metrics IS 'the metrics address for authentication';
COMMENT ON COLUMN property_authentication.block_number IS 'the block number of the authentication process';
COMMENT ON COLUMN property_authentication.market IS 'authenticated market address';
COMMENT ON COLUMN property_authentication.authentication_id IS 'authentication id';
