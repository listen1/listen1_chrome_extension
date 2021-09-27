const isDev =
	process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath)

export default isDev
