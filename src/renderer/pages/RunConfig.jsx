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
		<div className='space-y-6'>
			<div>
				<h1 className='text-xl font-semibold mb-1'>
					Run configuration
				</h1>
				<p className='text-sm text-gray-500'>
					Configure how many visits to send, how fast, and whether to
					show the browser window.
				</p>
			</div>

			<div className='bg-white border rounded-xl divide-y'>
				<Row
					label='Total visits'
					hint='How many page visits to simulate in total'>
					<input
						type='number'
						value={visits}
						onChange={(e) =>
							setVisits(parseInt(e.target.value) || 1)
						}
						className='w-28 border rounded px-3 py-1.5 text-sm text-right'
						min={1}
					/>
				</Row>

				<Row
					label='Concurrent sessions'
					hint='Parallel browser instances (1–5 recommended)'>
					<div className='flex items-center gap-3'>
						<input
							type='range'
							min={1}
							max={5}
							value={concurrency}
							onChange={(e) =>
								setConcurrency(parseInt(e.target.value))
							}
							className='w-28 accent-indigo-600'
						/>
						<span className='text-sm w-4 text-center'>
							{concurrency}
						</span>
					</div>
				</Row>

				<Row
					label='Min delay between pages'
					hint='Minimum ms a session waits before loading next page'>
					<div className='flex items-center gap-2'>
						<input
							type='number'
							value={minDelay}
							onChange={(e) =>
								setMinDelay(parseInt(e.target.value) || 500)
							}
							className='w-24 border rounded px-3 py-1.5 text-sm text-right'
							step={500}
							min={500}
						/>
						<span className='text-xs text-gray-400'>ms</span>
					</div>
				</Row>

				<Row
					label='Max delay between pages'
					hint='Maximum ms — actual delay is random in this range'>
					<div className='flex items-center gap-2'>
						<input
							type='number'
							value={maxDelay}
							onChange={(e) =>
								setMaxDelay(parseInt(e.target.value) || 1000)
							}
							className='w-24 border rounded px-3 py-1.5 text-sm text-right'
							step={500}
							min={1000}
						/>
						<span className='text-xs text-gray-400'>ms</span>
					</div>
				</Row>

				<Row
					label='Browser mode'
					hint='Headless = invisible (faster). Headed = visible window (safer, slower)'>
					<div className='flex gap-2'>
						<ModeBtn
							active={headless}
							onClick={() => setHeadless(true)}>
							Headless
						</ModeBtn>
						<ModeBtn
							active={!headless}
							onClick={() => setHeadless(false)}>
							Headed (visible)
						</ModeBtn>
					</div>
				</Row>
			</div>

			{/* Summary */}
			<div className='bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 text-sm text-indigo-800 space-y-1'>
				<p>
					<span className='font-medium'>{visits} visits</span> across{" "}
					<span className='font-medium'>{pages.length} pages</span>
				</p>
				<p>
					<span className='font-medium'>{concurrency}</span> parallel
					sessions · {headless ? "headless" : "headed"} mode
				</p>
				<p>
					Proxy:{" "}
					<span className='font-medium'>
						{proxySettings.proxyConfig.type}
					</span>
					{proxySettings.proxyList.length > 0 &&
						` · ${proxySettings.proxyList.length} proxies in rotation`}
				</p>
				<p>
					Delay:{" "}
					<span className='font-medium'>
						{minDelay}–{maxDelay}ms
					</span>{" "}
					between pages
				</p>
			</div>

			<button
				onClick={start}
				className='w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition text-sm'>
				Start automation →
			</button>
		</div>
	);
}

function Row({ label, hint, children }) {
	return (
		<div className='flex items-center justify-between px-5 py-4 gap-4'>
			<div>
				<p className='text-sm font-medium text-gray-800'>{label}</p>
				{hint && <p className='text-xs text-gray-400 mt-0.5'>{hint}</p>}
			</div>
			{children}
		</div>
	);
}

function ModeBtn({ active, onClick, children }) {
	return (
		<button
			onClick={onClick}
			className={`px-3 py-1.5 rounded text-xs border transition ${active ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"}`}>
			{children}
		</button>
	);
}
