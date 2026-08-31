import { useEffect, useState, forwardRef, HTMLAttributes } from 'react';

const Quotes = [
  'Debugging transactions one lens at a time.\nPatience, Cairo master!',
  'Just holding your transactions up to the light, loupe in hand.',
  'Loading transactions one magnification at a time.',
  "Hold tight! We're focusing the lens on your simulations.",
  'Simulating transactions faster than a jeweler spots a flaw.',
  "From block to lens, we're debugging your transactions with a touch of sharp-eyed genius.",
  'Just a few more facets to inspect before we get to the bottom of this transaction.',
  'Zooming into blocks and simulating transactions, one close-up at a time.',
  "Hold tight! We're debugging your transactions at 10x magnification.",
  'Breaking down blocks and inspecting transactions, loupe style!'
];

const Loader = forwardRef<
	HTMLDivElement,
	HTMLAttributes<HTMLDivElement> & { randomQuote?: boolean; text?: string }
>(({ randomQuote = true, text }) => {
	const [quote, setQuote] = useState('');

	useEffect(() => {
		setQuote(Quotes[Math.floor(Math.random() * Quotes.length)]);
	}, []);

	return (
		<div className="text-center my-16">
			{randomQuote && (
				<h3 className="text-md font-medium max-w-sm mx-auto whitespace-pre-line">{quote}</h3>
			)}

			<div className={'flex items-center justify-center mt-4 gap-2'}>
				<span className="h-6 w-6 block rounded-full border-4 dark:border-t-accent_2 border-t-gray-800 animate-spin"></span>
				{text ?? 'loading...'}
			</div>
		</div>
	);
});
Loader.displayName = 'Loader';

export { Loader };
