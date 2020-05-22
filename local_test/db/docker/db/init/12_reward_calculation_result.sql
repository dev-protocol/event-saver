DROP TABLE IF EXISTS reward_calculation_result;

CREATE TABLE reward_calculation_result(
    event_id TEXT NOT NULL,
    block_number INT NOT NULL,
    metrics TEXT NOT NULL,
    lockup NUMERIC NOT NULL,
    allocate_result NUMERIC NOT NULL,
    holder_reward NUMERIC NOT NULL,
    staking_reward NUMERIC NOT NULL,
    policy TEXT NOT NULL,
    PRIMARY KEY(event_id)
);


CREATE INDEX ON reward_calculation_result(
    block_number
);

COMMENT ON TABLE reward_calculation_result IS 'the results of the reward calculation.';
COMMENT ON COLUMN reward_calculation_result.event_id IS 'the event id of the result of the allocate execution';
COMMENT ON COLUMN reward_calculation_result.block_number IS 'block number at the time of allocate';
COMMENT ON COLUMN reward_calculation_result.metrics IS 'the metrics address specified at the time of allocate';
COMMENT ON COLUMN reward_calculation_result.lockup IS 'lockup value per property';
COMMENT ON COLUMN reward_calculation_result.allocate_result IS 'allocate result';
COMMENT ON COLUMN reward_calculation_result.holder_reward IS 'holder reward';
COMMENT ON COLUMN reward_calculation_result.staking_reward IS 'reward for staking accounts';
COMMENT ON COLUMN reward_calculation_result.policy IS 'the address of the policy that computed the reward';
