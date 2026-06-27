import { useEffect, useState, useRef } from "react";

export default function Dashboard({ config }) {
	const [events, setEvents] = useState([]);
	const [stats, setStats] = useState({
		completed: 0,
		errors: 0,
		total: config?.visits || 0,
	});
	const [running, setRunning] = useState(true);
	const logRef = useRef(null);

	useEffect(() => {
		const unsub = window.api.onAutomationEvent(({ event, data }) => {
			if (event === "visit") {
				setEvents((prev) => [data, ...prev].slice(0, 200));
				setStats((prev) => ({
					...prev,
					completed:
						data.status === "ok"
							? prev.completed + 1
							: prev.completed,
					errors:
						data.status === "error" ? prev.errors + 1 : prev.errors,
				}));
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
	const done = stats.completed + stats.errors;
	const pct = Math.min(100, Math.round((done / total) * 100));

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-semibold'>Live dashboard</h1>
					<p className='text-sm text-gray-500 mt-0.5'>
						{running
							? "Automation running..."
							: "Automation complete"}
					</p>
				</div>
				{running && (
					<button
						onClick={stop}
						className='px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 transition'>
						Stop
					</button>
				)}
			</div>

			{/* Progress bar */}
			<div>
				<div className='flex justify-between text-xs text-gray-500 mb-1.5'>
					<span>
						{done} / {total} visits
					</span>
					<span>{pct}%</span>
				</div>
				<div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
					<div
						className='h-full bg-indigo-500 rounded-full transition-all duration-500'
						style={{ width: pct + "%" }}
					/>
				</div>
			</div>

			{/* Stat cards */}
			<div className='grid grid-cols-3 gap-4'>
				<StatCard
					label='Successful'
					value={stats.completed}
					color='text-green-600'
				/>
				<StatCard
					label='Errors'
					value={stats.errors}
					color='text-red-500'
				/>
				<StatCard
					label='Remaining'
					value={Math.max(0, total - done)}
					color='text-gray-600'
				/>
			</div>

			{/* Live log */}
			<div>
				<p className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-2'>
					Live log
				</p>
				<div
					ref={logRef}
					className='bg-gray-900 rounded-xl h-72 overflow-y-auto p-4 space-y-1 font-mono text-xs'>
					{events.length === 0 && (
						<p className='text-gray-500'>
							Waiting for first visit...
						</p>
					)}
					{events.map((e, i) => (
						<div
							key={i}
							className={`flex gap-3 ${e.status === "error" ? "text-red-400" : "text-green-400"}`}>
							<span className='text-gray-500 shrink-0'>
								{new Date().toLocaleTimeString()}
							</span>
							<span className='shrink-0'>
								{e.status === "ok" ? "✓" : "✗"}
							</span>
							<span className='text-gray-300 truncate'>
								{e.url}
							</span>
							{e.error && (
								<span className='text-red-400 truncate'>
									{e.error}
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			{!running && (
				<div className='bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800'>
					Done! {stats.completed} successful visits · {stats.errors}{" "}
					errors.
				</div>
			)}
		</div>
	);
}

function StatCard({ label, value, color }) {
	return (
		<div className='bg-white border rounded-xl px-5 py-4'>
			<p className='text-xs text-gray-400 mb-1'>{label}</p>
			<p className={`text-3xl font-semibold ${color}`}>{value}</p>
		</div>
	);
}
