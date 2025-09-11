import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { SquareArrowOutUpRight } from 'lucide-react';
import { AddressContext } from '@/lib/context/address-context';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { useCallTrace } from '@/lib/context/call-trace-context-provider';

const CONTRACT_COLORS = [
	'#ef4444', // red-500
	'#f97316', // orange-500
	'#eab308', // yellow-500
	'#22c55e', // green-500
	'#3b82f6', // blue-500
	'#a855f7', // purple-500
	'#F5276F'
];

interface AddressLinkProps {
	addressClassName?: string;
	address: string;
	children: React.ReactNode;
	customSettings?: { [key: string]: { name: string | null; color: string | null } };
	updateContractName?: (contractAddress: string, newContractCallName: string) => void;
	updateContractColor?: (contractAddress: string, color: string) => void;
	updateContractSettings?: (
		contractAddress: string,
		settings: { name?: string | null; color?: string | null } | null
	) => void;
	isActiveDropdown?: boolean;
}

const AddressLink = ({
	addressClassName,
	address,
	children,
	customSettings,
	updateContractName,
	updateContractColor,
	updateContractSettings,
	isActiveDropdown = true
}: AddressLinkProps) => {
	const { state, dispatch } = useContext(AddressContext);

	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [editName, setEditName] = useState(children?.toString());
	const [selectedColor, setSelectedColor] = useState<string | null>(null);
	const [copySuccess, setCopySuccess] = useState(false);
	const currentSettings = customSettings?.[address];
	const currentColor = currentSettings?.color;
	const currentName = currentSettings?.name;

	useEffect(() => {
		if (dropdownOpen) {
			setEditName(currentName || children?.toString());
			setSelectedColor(currentColor || null);
		}
	}, [dropdownOpen, currentName, currentColor]);

	const handleMouseEnter = () => {
		dispatch({ type: 'SET_HOVERED_ADDRESS', payload: address });
	};

	const handleMouseLeave = () => {
		dispatch({ type: 'SET_HOVERED_ADDRESS', payload: null });
	};

	const handleSave = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if (updateContractSettings) {
			updateContractSettings(address, {
				name: editName || null,
				color: selectedColor
			});
		} else {
			if (updateContractName && editName) updateContractName(address, editName);
			if (updateContractColor && selectedColor) updateContractColor(address, selectedColor);
		}

		setDropdownOpen(false);
	};
	const handleClear = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if (updateContractSettings) {
			updateContractSettings(address, null);
		}

		setDropdownOpen(false);
	};
	const handleCopyAddress = async (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(address);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		event.stopPropagation();
		setEditName(event.target.value);
	};

	const handleColorSelect = (event: React.MouseEvent, color: string) => {
		event.preventDefault();
		event.stopPropagation();
		setSelectedColor(color);
	};

	const handleDropdownContentClick = (event: React.MouseEvent) => {
		event.stopPropagation();
	};

	const handleContractNameClick = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const shortenAddress = (address: string) => {
		if (!address) return '';
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	if (
		customSettings &&
		(updateContractName || updateContractColor || updateContractSettings) &&
		isActiveDropdown
	) {
		return (
			<DropdownMenu
				open={dropdownOpen}
				onOpenChange={
					(updateContractName || updateContractColor || updateContractSettings) && setDropdownOpen
				}
			>
				<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
					<span
						className={`text-primary dark:hover:brightness-150 hover:brightness-125 cursor-pointer`}
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
						onClick={handleContractNameClick}
					>
						<span
							className={`relative p-1 ${addressClassName} ${currentColor ? 'rounded border' : ''}`}
							style={
								currentColor
									? {
											backgroundColor: `${currentColor}15`,
											borderColor: `${currentColor}60`,
											color: currentColor
									  }
									: {}
							}
						>
							{(updateContractName || updateContractColor || updateContractSettings) && currentName
								? currentName
								: children}
							<span
								className={`pointer-events-none absolute inset-0 rounded border border-dashed border-yellow-900 bg-yellow-900 dark:border-highlight_yellow dark:bg-opacity-5 bg-opacity-5 transition-opacity ${
									state.hoveredAddress === address ? 'opacity-100' : 'opacity-0'
								}`}
							></span>
						</span>
					</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="w-80 p-4 bg-popover text-popover-foreground border-border"
					onClick={handleDropdownContentClick}
				>
					<div className="mb-3">
						<span className="block text-sm font-medium text-foreground mb-1">Contract Address</span>
						<div className="flex items-center justify-between text-sm text-muted-foreground font-mono bg-muted p-2 rounded border border-border">
							<span className="hover:underline cursor-pointer">{shortenAddress(address)}</span>
							<button
								onClick={handleCopyAddress}
								className="flex-shrink-0 p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors ml-2"
								title="Copy address"
							>
								{copySuccess ? (
									<svg
										className="w-4 h-4 text-primary"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
								) : (
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								)}
							</button>
						</div>
					</div>

					<div className="mb-4">
						<span className="block text-sm font-medium text-foreground mb-1">Contract Name</span>
						<input
							type="text"
							value={editName}
							onChange={handleInputChange}
							onClick={(e) => e.stopPropagation()}
							className="w-full p-2 border text-sm border-border rounded-md bg-background text-foreground focus:outline-none "
							placeholder="Enter contract name"
						/>
					</div>
					<div className="mb-4">
						<span className="block text-sm font-medium text-foreground mb-2">Color</span>
						<div className="flex justify-between">
							{CONTRACT_COLORS.map((color) => (
								<button
									key={color}
									onClick={(e) => handleColorSelect(e, color)}
									className={`w-8 h-8 rounded border-2 transition-all ${
										selectedColor === color
											? 'border-primary/20 scale-110'
											: 'border-border hover:border-accent'
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>

					<div className="flex justify-end gap-2">
						{currentSettings && (
							<Button variant="destructive" onClick={handleClear} className="w-full">
								Clear
							</Button>
						)}

						<Button variant="outline" onClick={handleSave} className="w-full">
							Save
						</Button>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	}
	return (
		<span
			className={`text-primary dark:hover:brightness-150 hover:brightness-125 inline-block min-w-0`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<span
				className={`relative p-1 inline-block min-w-0 ${addressClassName} ${
					currentColor ? 'rounded border' : ''
				}`}
				style={
					currentColor
						? {
								backgroundColor: `${currentColor}15`,
								borderColor: `${currentColor}60`,
								color: currentColor
						  }
						: {}
				}
			>
				{(updateContractName || updateContractColor || updateContractSettings) && currentName
					? currentName
					: children}
				<span
					className={`pointer-events-none absolute inset-0 rounded border border-dashed border-yellow-900 bg-yellow-900 dark:border-highlight_yellow dark:bg-opacity-5 bg-opacity-5 transition-opacity ${
						state.hoveredAddress === address ? 'opacity-100' : 'opacity-0'
					}`}
				></span>
			</span>
		</span>
	);
};

export default AddressLink;
