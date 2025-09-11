import { memo, useContext, useEffect } from 'react';
import { DebuggerPayload } from '@/lib/debugger';
import {
	DebuggerContext,
	DebuggerContextProvider,
	useDebugger
} from '@/lib/context/debugger-context-provider';
import { Loader } from '@/components/ui/loader';
import { DebuggerView } from './view';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { WALNUT_VERIFY_DOCS_URL } from '@/lib/config';

export const Debugger = memo(function Debugger({
	debuggerPayload
}: {
	debuggerPayload: DebuggerPayload | null;
}) {
	const context = useContext(DebuggerContext);

	useEffect(() => {
		if (context) context.setIsClickedDebuggerTab(true);
	}, []);

	return <DebuggerView />;
});
