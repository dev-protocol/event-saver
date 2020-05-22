DROP TABLE IF EXISTS property_meta;

CREATE TABLE property_meta(
	author TEXT NOT NULL,
    property TEXT NOT NULL,
    sender TEXT NOT NULL,
    block_number INT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    PRIMARY KEY(author, property)
);


CREATE INDEX ON property_meta(
	author
);

COMMENT ON TABLE property_meta IS 'property meta-information.';
COMMENT ON COLUMN property_meta.author IS 'property author address';
COMMENT ON COLUMN property_meta.property IS 'property address';
COMMENT ON COLUMN property_meta.sender IS 'the address of the account where you created the property';
COMMENT ON COLUMN property_meta.block_number IS 'the block number from which the property was created';
COMMENT ON COLUMN property_meta.name IS 'property name';
COMMENT ON COLUMN property_meta.symbol IS 'property symbol';
