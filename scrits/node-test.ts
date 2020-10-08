// /* eslint-disable @typescript-eslint/no-var-requires */
// const Web3 = require('web3')

// let main = async function () {
// 	console.log('start')

// 	const web3 = new Web3(
// 		new Web3.providers.HttpProvider('https://51.103.142.121:8545')
// 	)
// 	console.log('1')
// 	const blockNumber = await web3.eth.getBlockNumber()
// 	console.log(blockNumber)
// 	const balance = await web3.eth.getBalance(
// 		'0xDaEca4F52C4bE0d6e7DE675C2FEB4C3006A96C84'
// 	)
// 	console.log(balance)
// 	const count = await web3.eth.getBlockTransactionCount(10915874)
// 	console.log(count)

// 	const idString = web3.eth.net.getId()
// 	console.log(idString)

// 	const shhInfo = await web3.shh.getInfo()
// 	console.log(shhInfo)

// 	const account = await web3.eth.personal.newAccount('password')
// 	console.log(account)

// 	console.log('end')
// }

// void main()
