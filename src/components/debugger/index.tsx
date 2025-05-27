import { memo } from 'react';
import { DebuggerPayload } from '@/lib/debugger';
import { DebuggerContextProvider } from '@/lib/context/debugger-context-provider';
import { DebuggerWithContext } from './with-context';

export const Debugger = memo(function Debugger({
	debuggerPayload
}: {
	debuggerPayload: DebuggerPayload | null;
}) {
	if (!debuggerPayload) return null;

	return (
		<DebuggerContextProvider debuggerPayload={debuggerPayload}>
			<DebuggerWithContext />
		</DebuggerContextProvider>
	);
});
