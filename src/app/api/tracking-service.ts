export const isTrackingActive = () => {
	if (typeof window === 'undefined') {
		return true;
	}
	// Check if the URL has skip_tracking=true in the query params
	const urlParams = new URLSearchParams(window.location.search);
	const shouldSkipBasedOnQueryParam = urlParams.get('skip_tracking') === 'true';

	// Also to disable tracking on client - set 'skip_tracking_pls=true' cookie
	const cookies = document.cookie.split(';');
	const shouldSkipBasedOnCookie = cookies.some((cookie) =>
		cookie.trim().startsWith('skip_tracking_pls=true')
	);

	// Tracking is on only if NEXT_PUBLIC_USE_TRACKING was 'true' at build time
	const isTrackingBuild = process.env.NEXT_PUBLIC_USE_TRACKING === 'true';
	return !shouldSkipBasedOnCookie && !shouldSkipBasedOnQueryParam && isTrackingBuild;
};
