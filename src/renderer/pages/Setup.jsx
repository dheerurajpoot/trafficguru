import { useState, useEffect } from "react";

export default function Setup({ onDone }) {
	const [url, setUrl] = useState("");
	const [maxPages, setMaxPages] = useState(20);
	const [loading, setLoading] = useState(false);
	const [pages, setPages] = useState([]);
	const [savedPages, setSavedPages] = useState([]);
	const [selected, setSelected] = useState(new Set());
	const [error, setError] = useState("");
	const [newPageUrl, setNewPageUrl] = useState("");

	useEffect(() => {
		loadSavedPages();
	}, []);

	async function loadSavedPages() {
		const pages = await window.api.getSavedPages();
		setSavedPages(pages);
		setSelected(new Set(pages.map((p) => p.url)));
	}

	async function addNewPage() {
		if (!newPageUrl.trim()) return;
		let targetUrl = newPageUrl.trim();
		if (!/^https?:\/\//.test(targetUrl)) targetUrl = "https://" + targetUrl;

		const result = await window.api.addSavedPage(targetUrl);
		if (result.success) {
			setNewPageUrl("");
			loadSavedPages();
		} else {
			setError(result.error);
		}
	}

	async function removePage(id) {
		await window.api.deleteSavedPage(id);
		loadSavedPages();
	}

	const crawl = async () => {
		setError("");
		if (!url) return setError("Please enter a URL");
		let target = url.trim();
		if (!/^https?:\/\//.test(target)) target = "https://" + target;
		setLoading(true);
		setPages([]);
		try {
			const result = await window.api.crawlPages({
				url: target,
				maxPages,
			});
			if (!result.length)
				setError(
					"No pages found. Try a different URL or increase the limit.",
				);

			// Add crawled pages to saved pages
			for (const pageUrl of result) {
				await window.api.addSavedPage(pageUrl);
			}

			await loadSavedPages();
		} catch (e) {
			setError("Crawl failed: " + e.message);
		}
		setLoading(false);
	};

	const toggle = (url) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(url) ? next.delete(url) : next.add(url);
			return next;
		});
	};

	const toggleAll = () => {
		const allUrls = savedPages.map((p) => p.url);
		selected.size === allUrls.length
			? setSelected(new Set())
			: setSelected(new Set(allUrls));
	};

	return (
		<div className='space-y-8'>
			<div>
				<h1 className='text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2'>
					Website Setup
				</h1>
				<p className='text-gray-500'>
					Manage your saved pages and add new ones.
				</p>
			</div>

			<div className='bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6'>
				<div>
					<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2'>
						Add Single Page
					</label>
					<div className='flex gap-3'>
						<input
							value={newPageUrl}
							onChange={(e) => setNewPageUrl(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && addNewPage()}
							placeholder='https://example.com/page'
							className='flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
						/>
						<button
							onClick={addNewPage}
							className='px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg'>
							Add Page
						</button>
					</div>
				</div>

				<div className='border-t border-gray-100 pt-6'>
					<label className='text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3'>
						Crawl Pages from Site
					</label>
					<div className='flex gap-3'>
						<input
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && crawl()}
							placeholder='https://example.com'
							className='flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors'
						/>
						<div className='flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 text-sm bg-white'>
							<span className='text-gray-500 whitespace-nowrap'>
								Max Pages:
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
							className='px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 shadow-lg'>
							{loading ? (
								<div className='flex items-center justify-center gap-2'>
									<div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
									Crawling...
								</div>
							) : (
								"Crawl Pages"
							)}
						</button>
					</div>
				</div>

				{error && (
					<div className='bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3'>
						<svg
							className='w-5 h-5 text-red-500'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
						<p className='text-sm text-red-700'>{error}</p>
					</div>
				)}
			</div>

			{savedPages.length > 0 && (
				<div className='space-y-6'>
					<div className='flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-6 shadow-sm'>
						<div>
							<span className='text-lg font-bold text-gray-800'>
								Saved Pages ({savedPages.length})
							</span>
							<span className='text-gray-500 ml-2'>
								({selected.size} selected)
							</span>
						</div>
						<button
							onClick={toggleAll}
							className='text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors'>
							{selected.size === savedPages.length
								? "Deselect All"
								: "Select All"}
						</button>
					</div>

					<div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
						<div className='max-h-96 overflow-y-auto divide-y divide-gray-100'>
							{savedPages.map((page) => (
								<div
									key={page.id}
									className='flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors'>
									<input
										type='checkbox'
										checked={selected.has(page.url)}
										onChange={() => toggle(page.url)}
										className='w-5 h-5 accent-indigo-600 rounded'
									/>
									<span className='text-sm text-gray-800 truncate flex-1'>
										{page.url}
									</span>
									<button
										onClick={() => removePage(page.id)}
										className='p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors'>
										<svg
											className='w-5 h-5'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
											/>
										</svg>
									</button>
								</div>
							))}
						</div>
					</div>

					<button
						onClick={() => onDone([...selected])}
						disabled={selected.size === 0}
						className='w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg'>
						Continue with {selected.size} Pages →
					</button>
				</div>
			)}
		</div>
	);
}
