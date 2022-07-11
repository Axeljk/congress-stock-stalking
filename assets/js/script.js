// Global variables.
var names = {};
var rawData = {};
var stockData = [];
var trades = [];
var startDate = "";
var endDate = "";
var welcome = document.querySelector('#welcome')
var loading = document.querySelector('#loading')
var results = document.querySelector('#results')

// Creates a list of names from the raw congress data.
function populateCongress(data) {
	let tempNames = [];
	let searchField = document.getElementById("search");

	// Clear any previous entries in the stock selection.
	names.length = 0;
	rawData = data;

	// Generate list of names from data.
	for (let i = 0; i < rawData.length; i++) {
		if (!tempNames.includes(rawData[i].representative)) {
			tempNames.push(rawData[i].representative);
			names[tempNames[tempNames.length - 1].replace("Hon. ", "")] = null;
		}
	}

	// Set time period of available data.
	startDate = rawData[0].transaction_date;
	endDate = new Date().toISOString().slice(0, 10);

	// fill the search list with the names.
	document.getElementsByClassName("input-field").item(0).style.display = "block";
	M.Autocomplete.init(searchField, {
		data: names,
		limit: 10,
		minLength: 1,
		onAutocomplete: () => {
			congressTrades();
		}
	});
}

// Filters all data on person and fetches data on all of their stocks.
function populateStocks(name) {
	let stockNames = [];

	stockData.length = 0;
	trades.length = 0;

	// loop through trades of person and add each new one to array.
	for (let i = 0; i < rawData.length; i++) {
		if (rawData[i].representative === name) {
			if (!stockNames.includes(rawData[i].ticker) && rawData[i].ticker !== "--") {
				stockNames.push(rawData[i].ticker.replace("$", "-"));
			}
			 trades.push({
				ticker: rawData[i].ticker,
				type: rawData[i].type,
				date: rawData[i].transaction_date,
				volume: rawData[i].amount
			});
		}
	}

	// Fetch data for each stock.
	for (let i = 0; i < stockNames.length; i++) {
		fetch ("https://api.polygon.io/v2/aggs/ticker/" + stockNames[i] + "/range/1/day/" + startDate + "/" + endDate + "?apiKey=GR1YmLVtG0v9RpiVBa4sr84JTBcL6NdT")
			.then(response => response.json())
			.then((responseJson) => {
				stockData.push(responseJson);

				if (stockData.length === stockNames.length)
					stockTrades();
			});
	}
}

// Creates a bio card on the selected person.
function populateBio(name) {
	let url = "https://en.wikipedia.org/w/api.php";
	// wikipedia image api

	document.getElementById("linkToWiki").href = "https://en.wikipedia.org/wiki/"+name

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
			var nameOnCardtext = data.query.pages[pageID].title
			console.log(data.query.pages[pageID].title)
			document.getElementById("portrait").src = portrait
			document.getElementById("nameOnCard").innerHTML = nameOnCardtext
	})

}

// Handles calling other functions when a congressperson is selected.
function congressTrades() {
	if (document.getElementById("search").value in names) {
		let nameSelected = document.getElementById("search").value;
		welcome.setAttribute("style", "display:none");
		loading.setAttribute("style", "display:none");
		results.setAttribute("style", "display:block");

		// Populate stock selection with names of stocks they've traded with populateStocks().
		populateStocks("Hon. " + nameSelected);

		// Fetch photo and bio blurb of congressperson selected with populateBio().
		populateBio(nameSelected);
	}
}

// Creates a table of the person's trades.
function stockTrades() {
	let tableBody = document.createElement("tbody");
	let tradeTable = document.getElementsByTagName("table").item(0);

	// First remove the old table.
	tradeTable.removeChild(tradeTable.children[1]);

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

		// Skip entry if there is bad data.
		if (trades[i].ticker === "--")
			continue;

		tickerName.textContent = trades[i].ticker;

		if (tradeType === "purchase") {
			purchaseDate.textContent = trades[i].date;
			purchasePrice.textContent = getPrice(trades[i].ticker.replace("$", "-"), trades[i].date);
		} else if (tradeType === "sale_full" || tradeType === "sale_partial") {
			saleDate.textContent = trades[i].date;
			salePrice.textContent = getPrice(trades[i].ticker.replace("$", "-"), trades[i].date);
		} else
			console.warn(trades[i].type + "s are not included.", trades[i]);
		gainLoss.textContent = getGainLoss(trades[i]);
		volume.textContent = trades[i].volume;
		forecast.textContent = getStockForecast(trades[i].ticker.replace("$", "-"), trades[i].date);

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

	// Attach new table body to the table.
	tradeTable.appendChild(tableBody);
}

// Searches for the weighted average (vw) price for the stock on the day given.
function getPrice(name, date) {
	let stock = stockData.find(element => element.ticker == name);
	let day = new Date(date).getTime();
	let result;

	if (stock == undefined) {
		console.error("STOCK: UNDEFINED", stock, name);
		return "???";
	}

	if ("results" in stock) {
		result = stock.results.find(elements => elements.t > day);
		if (result != undefined)
			return "$" + result.vw.toFixed(2);
		else {
			console.error("STOCK: BAD RESULTS", stock, result);
			return "???";
		}
	} else {
		console.error("STOCK: NO RESULTS", stock);
		return "???";
	}
}

// Get a gain/loss value *if the data exists*.
function getGainLoss(trade) {
	if (trade.type === "sale_full" || trade.type === "sale_partial") {
		// Filter the data down to trades before this one.
		let results = trades.filter(elements => elements.ticker == trade.ticker);
		results = results.slice(0, results.indexOf(trade));

		for (let i = 0; i < results.length; i++) {
			if (results[i].type == "purchase") {
				let oldPrice = getPrice(results[i].ticker.replace("$", "-"), results[i].date).slice(1);
				let newPrice = getPrice(trade.ticker.replace("$", "-"), trade.date).slice(1);
				let difference = "";

				if (newPrice < oldPrice)
					difference += "-";
				difference += "$" + Math.abs(parseFloat(newPrice) - parseFloat(oldPrice)).toFixed(2);

				return difference;
			}
		}
		return "---";
		// search trades up to this point with same ticker and type purchase
	} else
		return "---"
}

// Gets the forecast of the stock after the trade.
function getStockForecast(name, date) {
	let stock = stockData.find(element => element.ticker == name);
	let day = new Date(date).getTime();
	let results;

	if (stock == undefined) {
		console.error("STOCK: UNDEFINED", stock, name);
		return "???";
	}

	if ("results" in stock) {
		results = stock.results.filter(elements => elements.t > day);

		if (results.length > 0) {
			let high = results[0].vw;
			let low = results[0].vw;

			if (results.length > 60)
				results.length = 60;

			for (let i = 0; i < results.length; i++) {
				if (results[i].vw > high)
					high = results[i].vw;
				else (results[i].vw < low)
					low = results[i].vw;
			}

			return "H: $" + high.toFixed(2) + "/L: $" + low.toFixed(2);
		} else {
			console.error("STOCK: BAD RESULTS", stock, results);
			return "???";
		}
	} else {
		console.error("STOCK: NO RESULTS", stock);
		return "???";
	}
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

document.getElementById("search").addEventListener("keydown", (event) => {
	// When enter is pressed...
	if (event.keyCode === 13) {
		event.preventDefault();
		congressTrades();
	}
});
// Event listener for selecting which stock the person traded with stockTrades()