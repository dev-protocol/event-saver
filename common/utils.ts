export function getTargetRecordsSeparatedByBlockNumber<
	T extends { block_number: number }
>(records: T[], maxCount: number): T[] {
	const targetRecords: any[] = []
	let lastBlockNumber = 0
	for (let record of records) {
		if (targetRecords.length >= maxCount) {
			if (lastBlockNumber !== record.block_number) {
				break
			}
		}

		targetRecords.push(record)
		lastBlockNumber = record.block_number
	}

	return targetRecords
}

export function getMaxBlockNumber(records: any[]): number {
	if (records.length === 0) {
		throw new Error('input data length is 0')
	}

	const tmp = records.map((record) => {
		return record.block_number
	})
	const maxBlockNumber = Math.max(...tmp)
	return maxBlockNumber
}
