'use client';

export const runtime = 'edge';

import { VerificationStatusPage } from '@/components/verification-page/status';


export default function Page({ params }: { params: { id: string } }) {
	return <VerificationStatusPage verificationId={params.id} />;
}
