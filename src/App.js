import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import abi from './utils/WavePortal.json'

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('')
	const [messageValue, setMessageValue] = useState('')
	const [allWaves, setAllWaves] = useState([])
	const contractAddress = '0x9bD07c0833c605B447545CF5416983C7e715a0d0'
	const contractABI = abi.abi

	const checkIfWalletIsConnected = async () => {
		try {
			const { ethereum } = window
			if (!ethereum) return

			const accounts = await ethereum.request({ method: 'eth_accounts' })
			if (accounts.length !== 0) {
				const account = accounts[0]
				setCurrentAccount(account)
				getAllWaves()
			}
			return
		} catch (error) {
			console.log(error)
			return
		}
	}

	const connectWallet = async () => {
		try {
			const { ethereum } = window
			if (!ethereum) return
			const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
			setCurrentAccount(accounts[0])
		} catch (error) {
			return
		}
	}

	const wave = async () => {
		try {
			const { ethereum } = window
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				)
				let count = await wavePortalContract.getTotalWaves()
				console.log(count)

				let contractBalance = await provider.getBalance(
					wavePortalContract.address
				)

				const waveTxn = await wavePortalContract.wave(messageValue, {
					gasLimit: 300000
				})
				await waveTxn.wait()
				count = await wavePortalContract.getTotalWaves()

				let contractBalance_post = await provider.getBalance(
					wavePortalContract.address
				)
				if (contractBalance_post < contractBalance) {
					alert('!! You won ETH !!')
				}
				console.log(`new ${count}`)
			}
		} catch (error) {
			return
		}
	}

	const getAllWaves = async () => {
		const { ethereum } = window
		try {
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				)

				const waves = await wavePortalContract.getAllWaves()

				const wavesCleaned = waves.map((wave) => {
					return {
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message
					}
				})
				setAllWaves(wavesCleaned)
			}
		} catch (error) {
			console.log(error)
		}
	}

	useEffect(() => {
		checkIfWalletIsConnected()
	}, [])

	useEffect(() => {
		let wavePortalContract

		const onNewWave = (from, timestamp, message) => {
			console.log('new wave', from, timestamp, message)
			setAllWaves((prevState) => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message
				}
			])
		}

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum)
			const signer = provider.getSigner()

			wavePortalContract = new ethers.Contract(
				contractAddress,
				contractABI,
				signer
			)
			wavePortalContract.on('NewWave', onNewWave)
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off('NewWave', onNewWave)
			}
		}
	}, [])

	return (
		<div className="mainContainer">
			<div className="dataContainer">
				<div className="header">
					<span role="img" aria-label="hand-wave">
						👋
					</span>{' '}
					WELCOME!
				</div>
				<div className="bio">
					イーサリアムウォレットを接続して、「
					<span role="img" aria-label="hand-wave">
						👋
					</span>
					(wave)」を送ってください
					<span role="img" aria-label="shine">
						✨
					</span>
				</div>
				<button className="waveButton" onClick={wave}>
					Wave at Me
				</button>

				<button className="waveButton" onClick={connectWallet}>
					{currentAccount ? 'connected' : 'connect'}
				</button>

				{currentAccount && (
					<>
						<textarea
							name="messageArea"
							placeholder="メッセージはこちら"
							onChange={(e) => setMessageValue(e.target.value)}
							style={{ marginTop: '20px' }}
						/>
						{allWaves
							.slice(0)
							.reverse()
							.map((wave, index) => {
								return (
									<div
										key={index}
										style={{
											background: '#f8f8f8',
											marginTop: '16px',
											padding: '8px'
										}}
									>
										<div>{wave.address}</div>
										<div>{wave.timestamp.toString()}</div>
										<div>{wave.message}</div>
									</div>
								)
							})}
					</>
				)}
			</div>
		</div>
	)
}

export default App
