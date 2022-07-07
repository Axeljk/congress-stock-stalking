// Global variables.
var raw_data = {};
var names = {};

function populateCongress(data) {
	let tempNames = [];
	let searchField = document.getElementById("search");

	// Clear any previous entries in the stock selection
	names.length = 0;
	raw_data = data;

	// Generate list of names from data.
	for (let i = 0; i < raw_data.length; i++) {
		if (!tempNames.includes(raw_data[i].representative)) {
			tempNames.push(raw_data[i].representative);
			names[tempNames[tempNames.length - 1].replace("Hon. ", "")] = null;
		}
	}

	// fill the search list with the names
	document.getElementsByClassName("input-field").item(0).style.display = "block";
	M.Autocomplete.init(searchField,{
		data:names,
		limit:'infinit',
		minLength:1
	});
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

function congressTrades(event) {
	let nameSelected = "";
	// Clear any previous entries in the stock selection

	// Fetch all trades filtered by person selected
	if (event.keyCode === 13) {					// When enter key is pressed...
		event.preventDefault();

		if (document.getElementById("search").value in names)
			nameSelected = document.getElementById("search").value;
	}

	// Populate stock selection with names of stocks they've traded with populateStocks()
	if (nameSelected !== "") {
		alert("Searching for " + document.getElementById("search").value);
		document.getElementById("search").value = "";
	}

	// Fetch photo and bio blurb of congressperson selected with populateBio()
}

function stockTrades() {
	// Clear any info previously entered

	// Loop through trades and filter by selected stock

	// Fetch history of that selected stock

	// Populate main card of page with info or chart.js
}

// Fetch congresspersons' names before searching.
window.onload = () => {
	// API fetch list of all data.
	fetch("https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json")
		.then(response => {
			return response.json();
		})
		.then(data => populateCongress(data));
	document.getElementsByClassName("input-field").item(0).style.display = "none";
}

document.getElementById("search").addEventListener("keydown", congressTrades);
// Event listener for selecting which stock the person traded with stockTrades()