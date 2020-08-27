/* eslint-disable @typescript-eslint/no-var-requires */
const Web3 = require('web3')

let main = async function () {
	console.log('start')
	const web3 = new Web3()
	const tmp = await web3.eth.accounts.sign('github-user/repo', 'himitukagi')
	console.log(tmp)
	console.log('end')
}

void main()
