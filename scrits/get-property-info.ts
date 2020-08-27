/* eslint-disable no-await-in-loop */
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
import { DbConnection, Transaction } from './../common/db/common'
import { PropertyMeta } from './../entities/property-meta'
/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

const abi =
	'[{"inputs":[{"internalType":"address","name":"_config","type":"address"},{"internalType":"address","name":"_own","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"author","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"configAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_sender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]'

let main = async function () {
	console.log('start')
	const db = new DbConnection('get-property-info')
	await db.connect()

	const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_URL!))
	const transaction = new Transaction(db.connection)
	await transaction.start()

	const propertyInfo = {
		'0xhogehoge1': {
			sender: '0xhugahuga',
			block_number: 9000000,
		},
		'0xhogehoge2': {
			sender: '0xhugahuga',
			block_number: 9000000,
		},
		'0xhogehoge3': {
			sender: '0xhugahuga',
			block_number: 9000000,
		},
	}

	for (let address of Object.keys(propertyInfo)) {
		const propertyInstance = new web3.eth.Contract(JSON.parse(abi), address)
		const totalSupply = await propertyInstance.methods.totalSupply().call()
		const author = await propertyInstance.methods.author().call()
		const symbol = await propertyInstance.methods.symbol().call()
		const name = await propertyInstance.methods.symbol().call()

		const meta = new PropertyMeta()
		meta.symbol = symbol
		meta.author = author
		meta.name = name
		meta.total_supply = totalSupply
		meta.property = address
		meta.sender = propertyInfo[address].sender
		meta.block_number = propertyInfo[address].block_number
		console.log(meta)
		await transaction.save(meta)
	}

	await transaction.commit()
	await transaction.finish()
	await db.quit()
	console.log('end')
}

void main()
