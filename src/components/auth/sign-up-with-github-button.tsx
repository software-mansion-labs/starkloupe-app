'use client';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

const previewAuthProxyUrl = process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY_URL;

export function SignUpWithGithubButton() {
	const handleGitHubLogin = () => {
		if (previewAuthProxyUrl) {
			const origin = window.location.origin;
			const returnUrl = `${origin}/login?auto_signin=github`;
			window.location.href = `${previewAuthProxyUrl}/api/auth-proxy/set-origin?origin=${encodeURIComponent(origin)}&return=${encodeURIComponent(returnUrl)}`;
		} else {
			authClient.signIn.social({
				provider: 'github'
			});
		}
	};

	return (
		<Button onClick={handleGitHubLogin} variant="outline">
			Sign up with GitHub
		</Button>
	);
}
