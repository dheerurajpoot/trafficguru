import { useState } from "react";
import Setup from "./pages/Setup";
import ProxyVPN from "./pages/ProxyVPN";
import RunConfig from "./pages/RunConfig";
import Dashboard from "./pages/Dashboard";

const STEPS = ["Setup", "Proxy / VPN", "Run config", "Dashboard"];

export default function App() {
	const [step, setStep] = useState(0);
	const [crawledPages, setCrawledPages] = useState([]);
	const [proxySettings, setProxySettings] = useState({
		proxyConfig: { type: "none" },
		proxyList: [],
	});
	const [runConfig, setRunConfig] = useState(null);

	return (
		<div className='min-h-screen flex flex-col'>
			{/* Top nav */}
			<header className='bg-white border-b px-6 py-3 flex items-center gap-8'>
				<span className='font-semibold text-indigo-600 text-lg tracking-tight'>
					TrafficGuru
				</span>
				<nav className='flex gap-1'>
					{STEPS.map((s, i) => (
						<button
							key={s}
							onClick={() => setStep(i)}
							className={`px-4 py-1.5 rounded-full text-sm transition ${
								step === i
									? "bg-indigo-50 text-indigo-700 font-medium"
									: "text-gray-500 hover:text-gray-800"
							}`}>
							{i + 1}. {s}
						</button>
					))}
				</nav>
			</header>

			{/* Page content */}
			<main className='flex-1 max-w-3xl w-full mx-auto px-6 py-8'>
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
