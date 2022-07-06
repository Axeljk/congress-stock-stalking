function populateCongress() {
	// Clear any previous entries in the stock selection

	// API fetch list of names of the people in congress

	// fill the search list with the names
}
function populateStocks() {
	// loop through trades of person and add each new one to array

	// Add array of stock names to the selection of stocks
}

function populateBio() {
	// Fetch data on person from MediaWiki

	// Add photo to bio card

	// Add name, party, district, dates in office to bio card
}

function congressTrades() {
	// Clear any previous entries in the stock selection

	// Fetch all trades filtered by person selected

	// Populate stock selection with names of stocks they've traded with populateStocks()

	// Fetch photo and bio blurb of congressperson selected with populateBio()
}

function stockTrades() {
	// Clear any info previously entered

	// Loop through trades and filter by selected stock

	// Fetch history of that selected stock

	// Populate main card of page with info or chart.js
}

// Event listener for selecting a congressperson calling congressTrades()
// Event listener for selecting which stock the person traded with stockTrades()