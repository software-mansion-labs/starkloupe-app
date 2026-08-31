export const generateMetadata = (title: string, description: string, pageUrl: string) => {
	return {
		title: title,
		description: description,
		keywords: [
			'Starknet',
			'Debugger',
			'Cairo',
			'Transaction',
			'Gas profiler',
			'Stack trace',
			'Debugging'
		],
		metadataBase: new URL('https://starkloupe.co/'),
		openGraph: {
			title: title,
			description: description,
			locale: 'en_US',
			type: 'website',
			url: pageUrl
		},
		twitter: {
			card: 'summary_large_image',
			title: title,
			description: description
		}
	};
};
