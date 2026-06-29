import { useEffect, useState, useRef } from "react";

export default function Dashboard({ config }) {
	const [events, setEvents] = useState([]);
	const [sessionStats, setSessionStats] = useState({
		completed: 0,
		errors: 0,
		total: config?.visits || 0,
	});
	const [dbStats, setDbStats] = useState(null);
	const [running, setRunning] = useState(true);
	const logRef = useRef(null);

	useEffect(() => {
		async function loadDbStats() {
			const stats = await window.api.getStats();
			setDbStats(stats);
		}
		loadDbStats();
	}, []);

	useEffect(() => {
		const unsub = window.api.onAutomationEvent(({ event, data }) => {
			if (event === "visit") {
				setEvents((prev) => [data, ...prev].slice(0, 200));
				setSessionStats((prev) => ({
					...prev,
					completed:
						data.status === "ok"
							? prev.completed + 1
							: prev.completed,
					errors:
						data.status === "error" ? prev.errors + 1 : prev.errors,
				}));
				// Reload db stats
				window.api.getStats().then((stats) => setDbStats(stats));
			}
			if (event === "done") {
				setRunning(false);
			}
		});
		return unsub;
	}, []);

	const stop = async () => {
		await window.api.stopAutomation();
		setRunning(false);
	};

	const total = config?.visits || 1;
	const done = sessionStats.completed + sessionStats.errors;
	const pct = Math.min(100, Math.round((done / total) * 100));

	return (
		<div className='space-y-8'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
						Live Dashboard
					</h1>
					<p className='text-sm text-gray-500 mt-2'>
						{running
							? "🚀 Automation Running"
							: "✅ Automation Complete"}
					</p>
				</div>
				{running && (
					<button
						onClick={stop}
						className='px-6 py-3 rounded-xl border-2 border-red-200 text-red-700 font-medium hover:bg-red-50 hover:border-red-300 transition-all duration-200 flex items-center gap-2'>
						<svg
							className='w-5 h-5'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'
							/>
						</svg>
						Stop Automation
					</button>
				)}
			</div>

			<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-sm font-semibold text-gray-700'>
						Current Session
					</h3>
				</div>

				<div className='mb-6'>
					<div className='flex justify-between text-sm font-medium text-gray-600 mb-2'>
						<span>
							{done} / {total} Visits
						</span>
						<span className='text-indigo-600'>{pct}%</span>
					</div>
					<div className='h-3 bg-gray-100 rounded-full overflow-hidden'>
						<div
							className='h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500'
							style={{ width: pct + "%" }}
						/>
					</div>
				</div>

				<div className='grid grid-cols-3 gap-4'>
					<StatCard
						label='Successful'
						value={sessionStats.completed}
						color='from-green-500 to-emerald-600'
					/>
					<StatCard
						label='Errors'
						value={sessionStats.errors}
						color='from-red-500 to-rose-600'
					/>
					<StatCard
						label='Remaining'
						value={Math.max(0, total - done)}
						color='from-gray-500 to-slate-600'
					/>
				</div>
			</div>

			{dbStats && (
				<div className='bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6'>
					<div className='flex items-center gap-2 mb-4'>
						<svg
							className='w-6 h-6 text-indigo-600'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
							/>
						</svg>
						<h3 className='text-sm font-bold text-indigo-900'>
							All Time Stats
						</h3>
					</div>
					<div className='grid grid-cols-3 gap-4 mb-6'>
						<StatCard
							label='Total Visits'
							value={dbStats.total}
							color='from-indigo-500 to-purple-600'
						/>
						<StatCard
							label='Total Successful'
							value={dbStats.ok}
							color='from-green-500 to-emerald-600'
						/>
						<StatCard
							label='Total Errors'
							value={dbStats.errors}
							color='from-red-500 to-rose-600'
						/>
					</div>
					{dbStats.recent && dbStats.recent.length > 0 && (
						<div>
							<h4 className='text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-3'>
								Recent Visits History
							</h4>
							<div className='bg-white rounded-xl border border-indigo-100 p-4 max-h-80 overflow-y-auto'>
								{dbStats.recent.map((item) => (
									<div
										key={item.id}
										className='flex items-center justify-between py-3 border-b border-gray-100 last:border-0'>
										<div className='flex items-center gap-3'>
											<span
												className={`inline-block w-2.5 h-2.5 rounded-full ${item.status === "ok" ? "bg-green-500" : "bg-red-500"}`}></span>
											<span className='text-sm text-gray-800 truncate max-w-xs flex-1'>
												{item.url}
											</span>
										</div>
										<div className='flex items-center gap-4 text-xs text-gray-500'>
											{item.proxy && (
												<span className='px-2 py-1 bg-gray-100 rounded-lg text-gray-700 truncate max-w-40'>
													{item.proxy}
												</span>
											)}
											<span>
												{new Date(
													item.ts * 1000,
												).toLocaleString()}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
				<div className='flex items-center gap-2 mb-4'>
					<svg
						className='w-6 h-6 text-purple-600'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M8 9l4-4 4 4m0 6l-4 4-4-4'
						/>
					</svg>
					<h3 className='text-sm font-semibold text-gray-700'>
						Live Log
					</h3>
				</div>
				<div
					ref={logRef}
					className='bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl h-96 overflow-y-auto p-5 space-y-3 font-mono text-sm'>
					{events.length === 0 && (
						<div className='flex items-center justify-center h-full text-gray-500'>
							<div className='text-center'>
								<svg
									className='w-12 h-12 mx-auto mb-3 text-gray-600'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
								<p>Waiting for first visit...</p>
							</div>
						</div>
					)}
					{events.map((e, i) => (
						<div
							key={i}
							className={`flex items-start gap-4 p-4 rounded-xl ${e.status === "error" ? "bg-red-900/30 text-red-300" : "bg-green-900/30 text-green-300"}`}>
							<span className='text-xs text-gray-400 shrink-0'>
								{new Date().toLocaleTimeString()}
							</span>
							<span className='shrink-0 text-xl'>
								{e.status === "ok" ? "✓" : "✗"}
							</span>
							<div className='flex-1 space-y-1'>
								<div className='text-gray-200 truncate'>
									{e.url}
								</div>
								{e.error && (
									<div className='text-red-400 truncate'>
										{e.error}
									</div>
								)}
								{e.proxy && (
									<div className='text-xs text-gray-400'>
										Proxy: {e.proxy}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{!running && (
				<div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6'>
					<div className='flex items-center gap-3'>
						<svg
							className='w-10 h-10 text-green-600'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
						<div>
							<h3 className='text-xl font-bold text-green-900'>
								Automation Complete!
							</h3>
							<p className='text-sm text-green-800 mt-1'>
								{sessionStats.completed} successful visits ·{" "}
								{sessionStats.errors} errors
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function StatCard({ label, value, color }) {
	return (
		<div
			className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg`}>
			<p className='text-sm font-medium text-white/80 mb-2'>{label}</p>
			<p className='text-4xl font-bold'>{value}</p>
		</div>
	);
}
