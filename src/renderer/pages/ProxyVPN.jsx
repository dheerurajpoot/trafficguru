import { useState } from "react";

export default function ProxyVPN({ onSave }) {
	const [mode, setMode] = useState("none"); // none | http | socks5 | vpn | api
	const [form, setForm] = useState({
		host: "",
		port: "",
		username: "",
		password: "",
		apiKey: "",
		provider: "webshare",
	});
	const [testResult, setTestResult] = useState(null);
	const [proxyList, setProxyList] = useState("");

	const update = (k) => (e) =>
		setForm((f) => ({ ...f, [k]: e.target.value }));

	const testProxy = async () => {
		setTestResult({ loading: true });
		const result = await window.api.testProxy({ type: mode, ...form });
		setTestResult(result);
	};

	const save = () => {
		const config = { type: mode, ...form };
		const list = proxyList
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean)
			.map((l) => {
				// format: host:port:user:pass or host:port
				const parts = l.split(":");
				return {
					type: mode === "socks5" ? "socks5" : "http",
					host: parts[0],
					port: parts[1],
					username: parts[2],
					password: parts[3],
				};
			});
		onSave({ proxyConfig: config, proxyList: list });
	};

	return (
		<div className='space-y-5'>
			<div>
				<label className='text-sm text-gray-500 mb-1 block'>
					Connection type
				</label>
				<div className='flex gap-2 flex-wrap'>
					{["none", "http", "socks5", "vpn", "api"].map((m) => (
						<button
							key={m}
							onClick={() => setMode(m)}
							className={`px-4 py-1.5 rounded-full text-sm border transition ${mode === m ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"}`}>
							{m.toUpperCase()}
						</button>
					))}
				</div>
			</div>

			{(mode === "http" || mode === "socks5") && (
				<div className='grid grid-cols-2 gap-3'>
					<div>
						<label className='text-xs text-gray-500'>Host</label>
						<input
							value={form.host}
							onChange={update("host")}
							placeholder='192.168.1.1'
							className='w-full mt-1 border rounded px-3 py-2 text-sm'
						/>
					</div>
					<div>
						<label className='text-xs text-gray-500'>Port</label>
						<input
							value={form.port}
							onChange={update("port")}
							placeholder='8080'
							className='w-full mt-1 border rounded px-3 py-2 text-sm'
						/>
					</div>
					<div>
						<label className='text-xs text-gray-500'>
							Username (optional)
						</label>
						<input
							value={form.username}
							onChange={update("username")}
							className='w-full mt-1 border rounded px-3 py-2 text-sm'
						/>
					</div>
					<div>
						<label className='text-xs text-gray-500'>
							Password (optional)
						</label>
						<input
							type='password'
							value={form.password}
							onChange={update("password")}
							className='w-full mt-1 border rounded px-3 py-2 text-sm'
						/>
					</div>
				</div>
			)}

			{mode === "api" && (
				<div className='space-y-3'>
					<div>
						<label className='text-xs text-gray-500'>
							Provider
						</label>
						<select
							value={form.provider}
							onChange={update("provider")}
							className='w-full mt-1 border rounded px-3 py-2 text-sm'>
							<option value='webshare'>Webshare</option>
							<option value='custom'>Custom API endpoint</option>
						</select>
					</div>
					<div>
						<label className='text-xs text-gray-500'>API key</label>
						<input
							value={form.apiKey}
							onChange={update("apiKey")}
							className='w-full mt-1 border rounded px-3 py-2 text-sm font-mono'
						/>
					</div>
				</div>
			)}

			{mode === "vpn" && (
				<div className='bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800'>
					Connect your VPN (OpenVPN, NordVPN, ExpressVPN etc.) at the
					system level before starting automation. The browser will
					use your system's VPN tunnel automatically. No config needed
					here.
				</div>
			)}

			{(mode === "http" || mode === "socks5") && (
				<div>
					<label className='text-xs text-gray-500'>
						Proxy rotation list (one per line: host:port:user:pass)
					</label>
					<textarea
						value={proxyList}
						onChange={(e) => setProxyList(e.target.value)}
						rows={5}
						placeholder='1.2.3.4:8080:user:pass&#10;5.6.7.8:3128'
						className='w-full mt-1 border rounded px-3 py-2 text-sm font-mono'
					/>
					<p className='text-xs text-gray-400 mt-1'>
						Each session picks the next proxy in rotation
					</p>
				</div>
			)}

			<div className='flex gap-3'>
				{mode !== "none" && mode !== "vpn" && (
					<button
						onClick={testProxy}
						className='px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50'>
						Test connection
					</button>
				)}
				<button
					onClick={save}
					className='px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700'>
					Save & continue
				</button>
			</div>

			{testResult && !testResult.loading && (
				<div
					className={`text-sm px-3 py-2 rounded ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
					{testResult.ok
						? `Connected — your IP: ${testResult.ip}`
						: `Failed: ${testResult.error}`}
				</div>
			)}
		</div>
	);
}
