import * as React from 'react';

const Quotes = [
	'Debugging transactions one walnut at a time.\nPatience, Cairo master!',
	'Just cracking open your transactions like a walnut on a cryptographic mission.',
	'Loading transactions one walnut at a time.',
	"Hold tight! We're peeling back the layers of your simulations.",
	'Simulating transactions faster than a squirrel finds a walnut.',
	"From block to walnut, we're debugging your transactions with a touch of nutty genius.",
	'Just a few more walnuts to crack before we get to the bottom of this transaction.',
	'Cracking blocks and simulating transactions, one walnut at a time.',
	"Hold tight! We're debugging your transactions with a touch of nutty genius.",
	'Breaking down blocks and cracking open transactions, walnut style!'
];

const Loader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(() => (
	<div className="text-center my-16 text-gray-800">
		<h3 className="text-md font-medium max-w-sm mx-auto whitespace-pre-line">
			{Quotes[Math.floor(Math.random() * Quotes.length)]}
		</h3>
		<div className={'flex items-center justify-center mt-4 gap-2'}>
			<span className="h-6 w-6 block rounded-full border-4 border-t-gray-800 animate-spin"></span>
			loading...
		</div>
	</div>
));
Loader.displayName = 'Loader';

export { Loader };
