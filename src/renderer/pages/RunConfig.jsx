import { useState } from "react";

export default function RunConfig({ pages, proxySettings, onStart }) {
	const [visits, setVisits] = useState(100);
	const [concurrency, setConcurrency] = useState(2);
	const [headless, setHeadless] = useState(true);
	const [minDelay, setMinDelay] = useState(2000);
	const [maxDelay, setMaxDelay] = useState(7000);

	const start = async () => {
		const config = {
			pages,
			visits,
			concurrency,
			headless,
			minDelay,
			maxDelay,
			proxyConfig: proxySettings.proxyConfig,
			proxyList: proxySettings.proxyList,
		};
		await window.api.startAutomation(config);
		onStart(config);
	};

	return (
		<div className='space-y-8'>
			<div>
				<h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
					Run Configuration
				</h1>
				<p className='text-gray-500'>
					Set up your automation parameters like visits, speed, and browser mode.
				</p>
			</div>

			<div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
				<Row
					label='Total Visits'
					hint='Total number of page visits to simulate'
				>
					<input
						type='number'
						value={visits}
						onChange={(e) => setVisits(parseInt(e.target.value) || 1)}
						className='w-32 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-right focus:border-indigo-500 focus:outline-none'
						min={1}
					/>
				</Row>

				<Row
					label='Concurrent Sessions'
					hint='Number of parallel browser instances (1–5 recommended)'
				>
					<div className='flex items-center gap-4'>
						<input
							type='range'
							min={1}
							max={5}
							value={concurrency}
							onChange={(e) => setConcurrency(parseInt(e.target.value))}
							className='w-40 accent-indigo-600'
						/>
						<span className='text-lg font-bold text-indigo-600 w-10 text-center'>
							{concurrency}
						</span>
					</div>
				</Row>

				<Row
					label='Min Delay Between Pages'
					hint='Minimum milliseconds a session waits before next page'
				>
					<div className='flex items-center gap-2'>
						<input
							type='number'
							value={minDelay}
							onChange={(e) => setMinDelay(parseInt(e.target.value) || 500)}
							className='w-28 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-right focus:border-indigo-500 focus:outline-none'
							step={500}
							min={500}
						/>
						<span className='text-sm text-gray-400 font-medium'>ms</span>
					</div>
				</Row>

				<Row
					label='Max Delay Between Pages'
					hint='Maximum milliseconds — actual delay is random in range'
				>
					<div className='flex items-center gap-2'>
						<input
							type='number'
							value={maxDelay}
							onChange={(e) => setMaxDelay(parseInt(e.target.value) || 1000)}
							className='w-28 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-right focus:border-indigo-500 focus:outline-none'
							step={500}
							min={1000}
						/>
						<span className='text-sm text-gray-400 font-medium'>ms</span>
					</div>
				</Row>

				<Row
					label='Browser Mode'
					hint='Headless is faster, headed is visible'
				>
					<div className='flex gap-3'>
						<ModeBtn active={headless} onClick={() => setHeadless(true)}>
							Headless (Faster)
						</ModeBtn>
						<ModeBtn active={!headless} onClick={() => setHeadless(false)}>
							Headed (Visible)
						</ModeBtn>
					</div>
				</Row>
			</div>

			<div className='bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 p-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<div>
						<p className='text-sm text-indigo-700'>
							<span className='font-bold text-indigo-900'>{visits}</span> visits across{" "}
							<span className='font-bold text-indigo-900'>{pages.length}</span> pages
						</p>
					</div>
					<div>
						<p className='text-sm text-indigo-700'>
							<span className='font-bold text-indigo-900'>{concurrency}</span> parallel sessions · {headless ? "headless" : "headed"} mode
						</p>
					</div>
					<div>
						<p className='text-sm text-indigo-700'>
							Proxy: <span className='font-bold text-indigo-900'>{proxySettings.proxyConfig.type}</span>
							{proxySettings.proxyList.length > 0 && ` · ${proxySettings.proxyList.length} proxies`}
						</p>
					</div>
					<div>
						<p className='text-sm text-indigo-700'>
							Delay: <span className='font-bold text-indigo-900'>{minDelay}–{maxDelay}ms</span> between pages
						</p>
					</div>
				</div>
			</div>

			<button
				onClick={start}
				className='w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg'
			>
				Start Automation →
			</button>
		</div>
	);
}

function Row({ label, hint, children }) {
	return (
		<div className='flex items-center justify-between px-6 py-5 gap-6 border-b border-gray-100 last:border-b-0'>
			<div>
				<p className='text-base font-semibold text-gray-800'>{label}</p>
				{hint && <p className='text-sm text-gray-400 mt-1'>{hint}</p>}
			</div>
			{children}
		</div>
	);
}

function ModeBtn({ active, onClick, children }) {
	return (
		<button
			onClick={onClick}
			className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
				active
					? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md"
					: "border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
			}`}
		>
			{children}
		</button>
	);
}
