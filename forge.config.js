module.exports = {
	packagerConfig: {
		asar: true,
		asarUnpack: [
			"node_modules/playwright/**",
			"node_modules/playwright-core/**",
		],
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin", "linux"],
		},
		{
			name: "@electron-forge/maker-dmg",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-squirrel",
			platforms: ["win32"],
		},
	],
	plugins: [
		{
			name: "@electron-forge/plugin-vite",
			config: {
				build: [
					{
						entry: "src/main/index.js",
						config: "vite.main.config.js",
						target: "main",
					},
					{
						entry: "src/main/preload.js",
						config: "vite.preload.config.js",
						target: "preload",
					},
				],
				renderer: [
					{
						name: "main_window",
						config: "vite.renderer.config.js",
					},
				],
			},
		},
	],
};
