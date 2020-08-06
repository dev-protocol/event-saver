DROP TABLE IF EXISTS property_balance;

CREATE TABLE property_balance(
    property_address TEXT NOT NULL,
	account_address TEXT NOT NULL,
	balance NUMERIC NOT NULL,
	is_author BOOLEAN NOT NULL,
    block_number INT NOT NULL,
	PRIMARY KEY(property_address, account_address)
);

CREATE INDEX ON property_balance(
	property_address
);

COMMENT ON TABLE property_balance IS 'property token balance';
COMMENT ON COLUMN property_balance.property_address IS 'property address';
COMMENT ON COLUMN property_balance.account_address IS 'account_address';
COMMENT ON COLUMN property_balance.balance IS 'property token balance';
COMMENT ON COLUMN property_balance.is_author IS 'if account_address is author, true';
COMMENT ON COLUMN property_balance.block_number IS 'block number';
