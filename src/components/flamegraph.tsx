import React, { useState, useRef, useEffect } from 'react';
import FlameNode from '@lib/simulation';

type FlameRect = {
	x: number;
	y: number;
	width: number;
	height: number;
	name: string;
	value: number;
	children?: FlameNode[];
	node: FlameNode;
};

const MIN_WIDTH = 1;

const colors = [
	'#e1bee7', // light lavender
	'#ce93d8',
	'#ba68c8',
	'#ab47bc',
	'#9c27b0',
	'#8e24aa',
	'#7b1fa2',
	'#6a1b9a',
	'#4a148c',
	'#f48fb1' // pink accent
];

const computeFlameRects = (
	node: FlameNode,
	x: number,
	y: number,
	width: number,
	height: number
): FlameRect[] => {
	const rects: FlameRect[] = [];
	const children = node.children || [];
	const total = children.reduce((acc, c) => acc + c.value, 0);
	const safeTotal = total > 0 ? total : 1;

	rects.push({
		x,
		y,
		width,
		height,
		name: node.name,
		value: node.value,
		children: node.children,
		node
	});

	if (children.length > 0) {
		let currentX = x;
		for (const child of children) {
			let childWidth = (child.value / safeTotal) * width;
			if (childWidth < MIN_WIDTH) childWidth = MIN_WIDTH;
			rects.push(...computeFlameRects(child, currentX, y + height, childWidth, height));
			currentX += childWidth;
		}
	}

	return rects;
};

type FlameGraphProps = {
	data: FlameNode;
	height?: number;
};

const FlameGraph: React.FC<FlameGraphProps> = ({ data, height = 24 }) => {
	const [focusNode, setFocusNode] = useState<FlameNode | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState<number>(0);

	useEffect(() => {
		const observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				if (entry.contentRect.width) {
					setWidth(entry.contentRect.width);
				}
			}
		});
		if (containerRef.current) {
			observer.observe(containerRef.current);
		}
		return () => observer.disconnect();
	}, []);

	const displayedNode = focusNode || data;
	const rectHeight = height;
	const rects = computeFlameRects(displayedNode, 0, 0, width, rectHeight);
	const totalHeight = Math.max(...rects.map((r) => r.y)) + rectHeight;

	const handleClick = (node: FlameNode) => {
		if (node.children && node.children.length > 0) {
			setFocusNode(node);
		}
	};

	const handleReset = () => {
		setFocusNode(null);
	};

	const getColor = (depth: number) => {
		const colors = ['#d4b5ff', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'];
		return colors[depth % colors.length];
	};

	const truncateText = (text: string, width: number): string => {
		const charWidth = 7; // approx width of a character in px
		const maxChars = Math.floor((width - 10) / charWidth); // padding
		if (maxChars <= 3) return '';
		if (text.length > maxChars) {
			return text.slice(0, maxChars - 3) + '...';
		}
		return text;
	};

	const textFit = (text: string, width: number): boolean => {
		const charWidth = 7; // average char width in px
		return width > charWidth * 3; // only if it can show at least 3 chars
	};

	return (
		<div ref={containerRef} style={{ width: '100%' }}>
			{focusNode && (
				<button onClick={handleReset} style={{ marginBottom: 10 }}>
					Reset Zoom
				</button>
			)}
			<svg width={width} height={totalHeight}>
				{rects.map((rect, i) => {
					const depth = rect.y / rectHeight;
					return (
						<g key={i} onClick={() => handleClick(rect.node)} cursor="pointer">
							<rect
								x={rect.x}
								y={rect.y}
								width={rect.width}
								height={rect.height}
								fill={getColor(depth)}
								stroke="#fff"
							/>
							<title>{`${rect.name}: ${rect.value}`}</title>
							{textFit(rect.name, rect.width) && (
								<text
									x={rect.x + 5}
									y={rect.y + rect.height / 2 + 4}
									fontSize="12"
									fill="#000"
									pointerEvents="none"
								>
									{truncateText(rect.name, rect.width)}
								</text>
							)}{' '}
						</g>
					);
				})}
			</svg>
		</div>
	);
};
export default FlameGraph;
