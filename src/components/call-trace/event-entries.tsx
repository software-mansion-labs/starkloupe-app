import React, { memo, useState } from 'react';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';
import { CALL_NESTING_SPACE_BUMP, CallTypeChip, TraceLine } from '.';
import { shortenHash } from '@/lib/utils';
import { InfoBox } from '@/components/ui/info-box';
import { DataType, ContractCallEvent, DecodedItem } from '@/lib/simulation';
import { DecodeDataTable } from '../decode-data-table';
import AddressLink from '../address-link';
import { useSettings } from '@/lib/context/settings-context-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ValueWithTooltip from '../ui/value-with-tooltip';

export function EventsList({ events }: { events: ContractCallEvent[] }) {
	const { toggleCallExpand, traceLineElementRefs, expandedCalls } = useCallTrace();

	const { customSettings, updateContractName, updateContractColor, updateContractSettings } =
		useSettings();

	if (events.length === 0) {
		return (
			<Alert className="mx-4 mt-2 w-fit">
				<ExclamationTriangleIcon className="h-5 w-5" />
				<AlertTitle>No events.</AlertTitle>
				<AlertDescription>No events emitted during this transaction.</AlertDescription>
			</Alert>
		);
	}

	return events.map((event, index) => {
		const key: any = `event-${index}`;
		if (!traceLineElementRefs.current[key]) {
			traceLineElementRefs.current[key] = React.createRef<HTMLDivElement>();
		}

		function ArgsWithTooltips() {
			if (event.datas) {
				return (
					<>
						{event.datas?.map((decoded, i) => {
							if (decoded == null) return <React.Fragment key={i}>,&nbsp;</React.Fragment>;

							return (
								<React.Fragment key={i}>
									<span className="relative inline-block whitespace-nowrap">
										<span>{decoded.name}: </span>
										<span className="text-typeColor">{decoded.typeName}</span>
										<span> = </span>
										<ValueWithTooltip
											value={decoded}
											fullObject={decoded}
											typeName={decoded.typeName}
											functionName={decoded.name ?? ''}
											isContract
										/>
										{i < (event.datas?.length ?? 0) - 1 && ',\u00A0'}
									</span>
								</React.Fragment>
							);
						})}
					</>
				);
			}
		}

		const contractName = event.contractName?.startsWith('0x')
			? shortenHash(event.contractName)
			: event.contractName;

		return (
			<React.Fragment key={key}>
				<TraceLine
					className="py-0.5"
					isActive={expandedCalls[key]}
					onClick={() => {
						toggleCallExpand(key);
					}}
					ref={traceLineElementRefs.current[key]}
				>
					{CallTypeChip('Event')}
					<div
						style={{ marginLeft: CALL_NESTING_SPACE_BUMP }}
						className="flex flex-row items-center trace-line_content"
					>
						{event.contractName && (
							<AddressLink
								addressClassName="text-classGreen whitespace-nowrap"
								address={event?.contractAddress}
								customSettings={customSettings}
								updateContractName={updateContractName}
								updateContractColor={updateContractColor}
								updateContractSettings={updateContractSettings}
							>
								{contractName}
							</AddressLink>
						)}
						{'.'}
						<span className="text-function_purple">{event.name}</span>
						<span className="text-highlight_yellow">{'('}</span>

						<ArgsWithTooltips />
						<span className="text-highlight_yellow">{')'}</span>
					</div>
				</TraceLine>
				{expandedCalls[key] && <EventDetails call={event} />}
			</React.Fragment>
		);
	});
}

const EventDetails = memo(function EventCallDetails({ call }: { call: ContractCallEvent }) {
	const [displayFormat, setDisplayFormat] = useState<'auto' | 'raw'>('auto');
	const details: {
		name: string;
		value: string;
		isCopyable?: boolean;
		valueToCopy?: string;
		linkHref?: string;
	}[] = [];

	details.push(
		{
			name: 'Contract Address',
			value: call.contractAddress,
			isCopyable: true,
			linkHref: `/contracts/${call.contractAddress}`
		},
		{ name: 'Event Selector', value: call.selector }
	);

	return (
		<div className="flex flex-col bg-sky-50 border-y dark:bg-background border-blue-400 py-2 px-4 ">
			<div className="w-[calc(100vw-4rem)] sm:w-[calc(100vw-7rem)]">
				<div className=""></div>
				<InfoBox details={details} />
				{call.datas && (
					<DecodeDataTable
						decodeData={call.datas}
						type={DataType.DATA}
						displayFormat={displayFormat}
						setDisplayFormat={setDisplayFormat}
					/>
				)}
			</div>
		</div>
	);
});
