import { useState } from "react";

export default function Setup({ onDone }) {
	const [url, setUrl] = useState("");
	const [maxPages, setMaxPages] = useState(20);
	const [loading, setLoading] = useState(false);
	const [pages, setPages] = useState([]);
	const [selected, setSelected] = useState(new Set());
	const [error, setError] = useState("");

	const crawl = async () => {
		setError("");
		if (!url) return setError("Please enter a URL");
		let target = url.trim();
		if (!/^https?:\/\//.test(target)) target = "https://" + target;
		setLoading(true);
		setPages([]);
		setSelected(new Set());
		try {
			const result = await window.api.crawlPages({
				url: target,
				maxPages,
			});
			if (!result.length)
				setError(
					"No pages found. Try a different URL or increase the limit.",
				);
			setPages(result);
			setSelected(new Set(result));
		} catch (e) {
			setError("Crawl failed: " + e.message);
		}
		setLoading(false);
	};

	const toggle = (p) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(p) ? next.delete(p) : next.add(p);
			return next;
		});
	};

	const toggleAll = () => {
		selected.size === pages.length
			? setSelected(new Set())
			: setSelected(new Set(pages));
	};

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-xl font-semibold mb-1'>Website setup</h1>
				<p className='text-sm text-gray-500'>
					Enter the target URL. The app will auto-detect pages via
					sitemap or link crawling.
				</p>
			</div>

			<div className='flex gap-3'>
				<input
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && crawl()}
					placeholder='https://example.com'
					className='flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
				/>
				<div className='flex items-center gap-2 border rounded-lg px-3 text-sm bg-white'>
					<span className='text-gray-500 whitespace-nowrap'>
						Max pages
					</span>
					<input
						type='number'
						value={maxPages}
						onChange={(e) =>
							setMaxPages(parseInt(e.target.value) || 20)
						}
						className='w-16 text-center focus:outline-none'
						min={1}
						max={200}
					/>
				</div>
				<button
					onClick={crawl}
					disabled={loading}
					className='px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition'>
					{loading ? "Crawling..." : "Detect pages"}
				</button>
			</div>

			{error && <p className='text-sm text-red-500'>{error}</p>}

			{loading && (
				<div className='flex items-center gap-3 text-sm text-gray-500 py-4'>
					<div className='w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin' />
					Scanning {url} for pages...
				</div>
			)}

			{pages.length > 0 && (
				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium text-gray-700'>
							Found {pages.length} pages — {selected.size}{" "}
							selected
						</span>
						<button
							onClick={toggleAll}
							className='text-xs text-indigo-600 hover:underline'>
							{selected.size === pages.length
								? "Deselect all"
								: "Select all"}
						</button>
					</div>
					<div className='border rounded-lg divide-y max-h-72 overflow-y-auto'>
						{pages.map((p) => (
							<label
								key={p}
								className='flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer'>
								<input
									type='checkbox'
									checked={selected.has(p)}
									onChange={() => toggle(p)}
									className='accent-indigo-600'
								/>
								<span className='text-sm text-gray-700 truncate'>
									{p}
								</span>
							</label>
						))}
					</div>

					<button
						onClick={() => onDone([...selected])}
						disabled={selected.size === 0}
						className='w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition'>
						Continue with {selected.size} pages →
					</button>
				</div>
			)}
		</div>
	);
}
