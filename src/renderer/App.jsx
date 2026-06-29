import { useState } from "react";
import Setup from "./pages/Setup";
import ProxyVPN from "./pages/ProxyVPN";
import RunConfig from "./pages/RunConfig";
import Dashboard from "./pages/Dashboard";

const STEPS = ["Setup", "Proxy / VPN", "Run Config", "Dashboard"];

export default function App() {
	const [step, setStep] = useState(0);
	const [crawledPages, setCrawledPages] = useState([]);
	const [proxySettings, setProxySettings] = useState({
		proxyConfig: { type: "none" },
		proxyList: [],
	});
	const [runConfig, setRunConfig] = useState(null);

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50'>
			<header className='bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10 shadow-sm'>
				<div className='max-w-6xl mx-auto px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-4'>
							<div className='w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
								<svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
								</svg>
							</div>
							<span className='text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
								TrafficGuru
							</span>
						</div>
						<nav className='flex gap-2'>
							{STEPS.map((s, i) => (
								<button
									key={s}
									onClick={() => setStep(i)}
									className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
										step === i
											? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
											: "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
									}`}
								>
									<span className='text-xs opacity-60 mr-2'>{i + 1}.</span>
									{s}
								</button>
							))}
						</nav>
					</div>
				</div>
			</header>

			<main className='max-w-5xl mx-auto px-6 py-10'>
				{step === 0 && (
					<Setup
						onDone={(pages) => {
							setCrawledPages(pages);
							setStep(1);
						}}
					/>
				)}
				{step === 1 && (
					<ProxyVPN
						onSave={(cfg) => {
							setProxySettings(cfg);
							setStep(2);
						}}
					/>
				)}
				{step === 2 && (
					<RunConfig
						pages={crawledPages}
						proxySettings={proxySettings}
						onStart={(cfg) => {
							setRunConfig(cfg);
							setStep(3);
						}}
					/>
				)}
				{step === 3 && <Dashboard config={runConfig} />}
			</main>
		</div>
	);
}
