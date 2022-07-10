// Global variables.
var raw_data = {};
var names = {};
var stockData = [];
var trades = [];
var welcome = document.querySelector('#welcome')
var loading = document.querySelector('#loading')
var results = document.querySelector('#results')

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
	M.Autocomplete.init(searchField, {
		data:names,
		limit:'infinit',
		minLength:1
	});
}
function populateStocks(name) {
	let stockNames = [];

	// loop through trades of person and add each new one to array
	for (let i = 0; i < raw_data.length; i++) {
		if (raw_data[i].representative === name) {
			if (!stockNames.includes(raw_data[i].ticker)) {
				stockNames.push(raw_data[i].ticker);
			}
			 trades.push({
				ticker: raw_data[i].ticker,
				type: raw_data[i].type,
				date: raw_data[i].transaction_date,
				volume: raw_data[i].amount
			});
		}
	}

	for (let i = 0; i < stockNames.length; i++) {
		fetch ("https://api.polygon.io/v2/aggs/ticker/" + stockNames[i] + "/range/1/day/2020-06-01/2022-07-09?apiKey=GR1YmLVtG0v9RpiVBa4sr84JTBcL6NdT")
			.then(response => response.json())
			.then((responseJson) => {
				console.log("stock:", responseJson)
				stockData.push(responseJson);

				if (stockData.length === stockNames.length)
					stockTrades();
			});
	}
}

function populateBio(name) {
	let url = "https://en.wikipedia.org/w/api.php";
	// wikipedia image api

	// paramas. title refernces the search input from the user
	var params = {
		action: "query",
		prop: "pageimages",
		titles: name,
		format: "json"
	};
	// API key
	url = url + "?origin=*";
	Object.keys(params).forEach(function(key){url += "&" + key + "=" + params[key];});
		// fetches image thumbnail from wikipedia based on user search input
		fetch(url)
		.then(response => response.json())
		.then(function(data) {
			var pageID = Object.keys(data.query.pages)[0]
			var portrait = data.query.pages[pageID].thumbnail.source
			console.log(data.query.pages[pageID].thumbnail.source)
			document.getElementById("portrait").src = portrait
	})

}

function congressTrades(event) {
	let nameSelected = "";
	// Clear any previous entries in the stock selection

	// Fetch all trades filtered by person selected
	if (event.keyCode === 13) {					// When enter key is pressed...
		event.preventDefault();

		if (document.getElementById("search").value in names)
			nameSelected = document.getElementById("search").value;
			welcome.setAttribute("style", "display:none");
			loading.setAttribute("style", "display:none");
			results.setAttribute("style", "display:block");
	}

	// Populate stock selection with names of stocks they've traded with populateStocks()
	if (nameSelected !== "") {
		populateStocks("Hon. " + nameSelected);

		// Fetch photo and bio blurb of congressperson selected with populateBio()
		populateBio(nameSelected);
	}
}

function stockTrades() {
	let tableBody = document.createElement("tbody");
	let oldBody = document.getElementsByTagName("tbody").item(0);

	// Populate main card of page with info or chart.js
	for (let i = 0; i < trades.length; i++) {
		let tradeType = trades[i].type;
		let newRow = document.createElement("tr");
		let tickerName = document.createElement("td");
		let purchaseDate = document.createElement("td");
		let purchasePrice = document.createElement("td");
		let saleDate = document.createElement("td");
		let salePrice = document.createElement("td");
		let gainLoss = document.createElement("td");
		let volume = document.createElement("td");
		let forecast = document.createElement("td");

		tickerName.textContent = trades[i].ticker;

		if (tradeType === "purchase") {
			purchaseDate.textContent = trades[i].date;
			purchasePrice.textContent = getPrice(trades[i].ticker, trades[i].date);
		} else if (tradeType === "sale_full" || tradeType === "sale_partial") {
			saleDate.textContent = trades[i].date;
			salePrice.textContent = getPrice(trades[i].ticker, trades[i].date);
		} else
			console.log(trades[i]);
		gainLoss.textContent = "";
		volume.textContent = trades[i].volume;
		forecast.textContent = "";

		newRow.appendChild(tickerName);
		newRow.appendChild(purchaseDate);
		newRow.appendChild(purchasePrice);
		newRow.appendChild(saleDate);
		newRow.appendChild(salePrice);
		newRow.appendChild(gainLoss);
		newRow.appendChild(volume);
		newRow.appendChild(forecast);
		tableBody.appendChild(newRow);
	}

	// Clear any info previously entered by replacing it with the new data.
	document.getElementsByTagName("table").item(0).replaceChild(tableBody, oldBody);
}

// Searches for the weighted average (vw) price for the stock on the day given.
function getPrice(name, date) {
	let stock = stockData.find(element => element.ticker == name);
	let day = new Date(date).getTime();
	let result;

	if (stock.results != undefined) {
		result = stock.results.find(elements => elements.t > day);
		if (result != undefined)
			return "$" + result.vw.toFixed(2);
		else
			console.log("BAD RESULT?", stock, result);
	} else
		return "";
}

// Fetch congresspersons' names before searching.
window.onload = () => {
	// Magnifying glass is hidden until fetched data is finished.
	document.getElementsByClassName("input-field").item(0).style.display = "none";

	// API fetch list of all data.
	fetch("https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json")
		.then(response => response.json())
		.then(data => populateCongress(data));
}

document.getElementById("search").addEventListener("keydown", congressTrades);
// Event listener for selecting which stock the person traded with stockTrades()