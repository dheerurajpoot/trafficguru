import { useState, useEffect } from "react";

export default function ProxyVPN({ onSave }) {
	const [mode, setMode] = useState("none"); // none | http | socks5 | vpn | api
	const [form, setForm] = useState({
		host: "",
		port: "",
		username: "",
		password: "",
		apiKey: "",
		provider: "webshare",
		endpoint: "",
	});
	const [testResult, setTestResult] = useState(null);
	const [proxyList, setProxyList] = useState("");
	const [fetching, setFetching] = useState(false);
	const [savedProxies, setSavedProxies] = useState([]);
	const [selectedSavedProxyIds, setSelectedSavedProxyIds] = useState(new Set());

	useEffect(() => {
		loadSavedProxies();
	}, []);

	async function loadSavedProxies() {
		const proxies = await window.api.getSavedProxies();
		setSavedProxies(proxies);
	}

	const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

	const testProxy = async () => {
		setTestResult({ loading: true });
		const result = await window.api.testProxy({ type: mode, ...form });
		setTestResult(result);
	};

	const fetchProxiesFromApi = async () => {
		setFetching(true);
		const proxies = await window.api.fetchProxiesFromApi(form);
		if (proxies.length > 0) {
			const listText = proxies.map(p => 
				`${p.host}:${p.port}${p.username ? `:${p.username}:${p.password}` : ''}`
			).join('\n');
			setProxyList(listText);
			setMode('http');
			
			// Save fetched proxies
			for (const p of proxies) {
				await window.api.addSavedProxy(p);
			}
			loadSavedProxies();
		}
		setFetching(false);
	};

	const addCurrentProxy = async () => {
		if (!form.host || !form.port) return;
		await window.api.addSavedProxy({
			type: mode,
			host: form.host,
			port: form.port,
			username: form.username,
			password: form.password,
		});
		loadSavedProxies();
	};

	const removeProxy = async (id) => {
		await window.api.deleteSavedProxy(id);
		loadSavedProxies();
	};

	const toggleSavedProxy = (id) => {
		setSelectedSavedProxyIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const useAllSavedProxies = () => {
		setSelectedSavedProxyIds(new Set(savedProxies.map(p => p.id)));
	};

	const clearSavedProxySelection = () => {
		setSelectedSavedProxyIds(new Set());
	};

	const save = () => {
		const config = { type: mode, ...form };
		let list = [];
		
		// First add selected saved proxies
		const selectedProxies = savedProxies.filter(p => selectedSavedProxyIds.has(p.id));
		list = [...selectedProxies];
		
		// Then add proxies from textarea
		const textareaProxies = proxyList
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean)
			.map((l) => {
				const parts = l.split(":");
				return {
					type: mode === "socks5" ? "socks5" : "http",
					host: parts[0],
					port: parts[1],
					username: parts[2],
					password: parts[3],
				};
			});
		list = [...list, ...textareaProxies];
		
		onSave({ proxyConfig: config, proxyList: list });
	};

	return (
		<div className='space-y-8'>
			<div>
				<h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
					Proxy & VPN Settings
				</h1>
				<p className='text-gray-500'>
					Configure your proxies or use system VPN.
				</p>
			</div>

			{/* Saved Proxies Section */}
			{savedProxies.length > 0 && (
				<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-sm font-semibold text-gray-700'>
							Saved Proxies ({selectedSavedProxyIds.size} selected)
						</h3>
						<div className='flex gap-2'>
							<button 
								onClick={useAllSavedProxies}
								className='text-xs text-indigo-600 hover:text-indigo-700 font-medium'
							>
								Select All
							</button>
							<button 
								onClick={clearSavedProxySelection}
								className='text-xs text-gray-500 hover:text-gray-700 font-medium'
							>
								Clear
							</button>
						</div>
					</div>
					<div className='space-y-3 max-h-64 overflow-y-auto'>
						{savedProxies.map((proxy) => (
							<div key={proxy.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100'>
								<div className='flex items-center gap-3'>
									<input 
										type="checkbox"
										checked={selectedSavedProxyIds.has(proxy.id)}
										onChange={() => toggleSavedProxy(proxy.id)}
										className="w-4 h-4 accent-indigo-600 rounded"
									/>
									<span className='px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium uppercase'>
										{proxy.type}
									</span>
									<span className='text-sm text-gray-800'>
										{proxy.host}:{proxy.port}
									</span>
								</div>
								<div className='flex gap-2'>
									<button
										onClick={() => removeProxy(proxy.id)}
										className='px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg'
									>
										Delete
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div>
				<label className='text-sm font-semibold text-gray-700 mb-3 block'>
					Connection Type
				</label>
				<div className='flex gap-2 flex-wrap'>
					{["none", "http", "socks5", "vpn", "api"].map((m) => (
						<button
							key={m}
							onClick={() => setMode(m)}
							className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${mode === m ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-lg" : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"}`}
						>
							{m.toUpperCase()}
						</button>
					))}
				</div>
			</div>

			{(mode === "http" || mode === "socks5") && (
				<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6'>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Host</label>
							<input
								value={form.host}
								onChange={update("host")}
								placeholder='192.168.1.1'
								className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
							/>
						</div>
						<div>
							<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Port</label>
							<input
								value={form.port}
								onChange={update("port")}
								placeholder='8080'
								className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
							/>
						</div>
						<div>
							<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Username (Optional)</label>
							<input
								value={form.username}
								onChange={update("username")}
								className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
							/>
						</div>
						<div>
							<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Password (Optional)</label>
							<input
								type='password'
								value={form.password}
								onChange={update("password")}
								className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
							/>
						</div>
					</div>
					<div className='flex gap-3'>
						<button
							onClick={testProxy}
							className='flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200'
						>
							Test Connection
						</button>
						<button
							onClick={addCurrentProxy}
							className='flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200'
						>
							Save Proxy
						</button>
					</div>
				</div>
			)}

			{mode === "api" && (
				<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4'>
					<div>
						<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Provider</label>
						<select
							value={form.provider}
							onChange={update("provider")}
							className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
						>
							<option value='webshare'>Webshare</option>
							<option value='custom'>Custom API Endpoint</option>
						</select>
					</div>
					{form.provider === 'custom' && (
						<div>
							<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Custom API Endpoint</label>
							<input
								value={form.endpoint}
								onChange={update("endpoint")}
								placeholder='https://api.example.com/proxies'
								className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors font-mono'
							/>
						</div>
					)}
					<div>
						<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>API Key</label>
						<input
							value={form.apiKey}
							onChange={update("apiKey")}
							className='w-full mt-2 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors font-mono'
						/>
					</div>
					<button
						onClick={fetchProxiesFromApi}
						disabled={fetching}
						className='w-full mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg disabled:opacity-50'
					>
						{fetching ? 'Fetching Proxies...' : 'Fetch & Save Proxies'}
					</button>
				</div>
			)}

			{mode === "vpn" && (
				<div className='bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6'>
					<div className='flex items-start gap-3'>
						<div className='text-amber-600 mt-1'>
							<svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
							</svg>
						</div>
						<div className='text-sm text-amber-900'>
							Connect your VPN (OpenVPN, NordVPN, ExpressVPN, etc.) at the system level before starting automation. The browser will automatically use your system's VPN tunnel - no additional configuration needed here.
						</div>
					</div>
				</div>
			)}

			{(mode === "http" || mode === "socks5") && (
				<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
					<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3'>
						Proxy Rotation List (Additional)
					</label>
					<textarea
						value={proxyList}
						onChange={(e) => setProxyList(e.target.value)}
						rows={6}
						placeholder='1.2.3.4:8080:user:pass&#10;5.6.7.8:3128'
						className='w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors font-mono'
					/>
					<p className='text-xs text-gray-400 mt-2'>
						Enter one proxy per line in format: host:port:user:pass or host:port
					</p>
				</div>
			)}

			{testResult && !testResult.loading && (
				<div
					className={`mt-4 text-sm px-5 py-4 rounded-2xl border-2 ${testResult.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
				>
					<div className='flex items-center gap-3'>
						{testResult.ok ? (
							<svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
							</svg>
						) : (
							<svg className='w-6 h-6 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
							</svg>
						)}
						<span className='font-medium'>
							{testResult.ok
								? `Connected Successfully — Your IP: ${testResult.ip}`
								: `Connection Failed: ${testResult.error}`}
						</span>
					</div>
				</div>
			)}

			<div className='pt-4'>
				<button
					onClick={save}
					className='w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg'
				>
					Save & Continue
				</button>
			</div>
		</div>
	);
}
