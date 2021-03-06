// Constant values.
const YEARS_HISTORY = 3;
const FORECAST_DAYS = 60;

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
	endDate = new Date().toISOString().slice(0, 10);
	startDate = new Date();
	startDate.setFullYear(startDate.getFullYear() - YEARS_HISTORY);
	startDate = startDate.toISOString().slice(0, 10);

	// fill the search list with the names.
	searchField.disabled = false;
	document.getElementById("searchIcon").style.display = "inline-block";
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

	// Sort trades by date.
	trades = trades.sort((a,b) => {
		if (a.date < b.date)
			return -1;
		else if (a.date > b.date)
			return 1;
		return 0;
	});

	// Remove trades without a ticker.
	for (let i = trades.length - 1; i >= 0; i--) {
		if (trades[i].ticker == "--")
			trades.splice(i, 1);
	}

	// Fetch data for each stock.
	if (trades.length > 0) {
		for (let i = 0; i < stockNames.length; i++) {
			fetch ("https://api.polygon.io/v2/aggs/ticker/" + stockNames[i] + "/range/1/day/" + startDate + "/" + endDate + "?apiKey=GR1YmLVtG0v9RpiVBa4sr84JTBcL6NdT")
				.then(response => response.json())
				.then((responseJson) => {
					stockData.push(responseJson);

					if (stockData.length === stockNames.length)
						stockTrades();
				});
		}
	} else
		stockTrades();
}

// Creates a bio card on the selected person.
function populateBio(name) {
	name = name.split(" ");
    if (name.length > 2)
        name.splice(1, name.length - 2);
    name = name.join("_");
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
				if(data.query.pages[pageID].thumbnail==undefined)
					document.getElementById("portrait").src = "assets/img/StockStalk.png"
					else{var portrait = data.query.pages[pageID].thumbnail.source
						var highResThumb = portrait.replace("thumb/", "")
						var highRestSplit = highResThumb.split("/")
						var finalPortrait = highRestSplit.slice(0,-1).join('/')
						var finalPortrait = highRestSplit.slice(0,-1).join('/')
						document.getElementById("portrait").src = finalPortrait
					}
			var nameOnCardtext = data.query.pages[pageID].title
			console.log(data.query.pages[pageID].title)
			console.log(portrait)

		
			

		


			document.getElementById("nameOnCard").innerHTML = nameOnCardtext
	})

	var summaryParams = {
		action: "query",
		prop: "extracts",
		titles: name,
		format: "json",
		exintro: true,
		exsentences: 6,
	}

	Object.keys(summaryParams).forEach(function(key){url += "&" + key + "=" + summaryParams[key];});
		fetch(url)
		.then(response => response.json())
		.then(function(data) {
			var pageID = Object.keys(data.query.pages)[0]
			var extractsVar = data.query.pages[pageID].extract
			console.log(data)
			console.log(extractsVar)
			document.getElementById("bioCard").innerHTML = extractsVar
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
		let newRow = document.createElement("tr");
		let tickerName = document.createElement("td");
		let purchaseDate = document.createElement("td");
		let purchasePrice = document.createElement("td");
		let saleDate = document.createElement("td");
		let salePrice = document.createElement("td");
		let gainLoss = document.createElement("td");
		let volume = document.createElement("td");
		let forecast = document.createElement("td");

		// Skip extry if exchange or bad data.
		if (trades[i].type !== "purchase" && trades[i].type !== "sale_full" && trades[i].type !== "sale_partial" || trades[i].ticker === "--")
			continue;

		// Add price info for trades.
		trades[i].price = getPrice(trades[i].ticker.replace("$", "-"), trades[i].date);
		trades[i].gainLoss = getGainLoss(trades[i]);
		trades[i].highLow = getStockForecast(trades[i].ticker.replace("$", "-"), trades[i].date);

		// Fill cells with content.
		tickerName.textContent = trades[i].ticker;
		if (trades[i].type === "purchase") {
			purchaseDate.textContent = trades[i].date;
			purchasePrice.textContent = (trades[i].price != "???") ? "$" + trades[i].price : trades[i].price;
		} else if (trades[i].type === "sale_full" || trades[i].type === "sale_partial") {
			saleDate.textContent = trades[i].date;
			salePrice.textContent = (trades[i].price != "???") ? "$" + trades[i].price : trades[i].price;
		}
		if (trades[i].gainLoss.length > 0) {
			gainLoss.textContent = trades[i].gainLoss + "%";
			if (trades[i].gainLoss > 0)
				gainLoss.classList.add("light-green-text", "text-bold");
			else if (trades[i].gainLoss < 0)
				gainLoss.classList.add("red-text", "text-bold");
		}
		volume.textContent = trades[i].volume;
		if (trades[i].highLow[0] != "?") {
			forecast.textContent = "H: $" + trades[i].highLow[0] + "/L: $" + trades[i].highLow[1];
			if (trades[i].type == "purchase") {
				if (parseFloat(trades[i].highLow[1]) > parseFloat(trades[i].price))
					forecast.classList.add("light-green-text", "text-bold");
				else if (parseFloat(trades[i].highLow[0]) < parseFloat(trades[i].price))
					forecast.classList.add("red-text", "text-bold");
			} else {
				if (parseFloat(trades[i].highLow[0]) < parseFloat(trades[i].price))
					forecast.classList.add("light-green-text", "text-bold");
				else if (parseFloat(trades[i].highLow[1]) > parseFloat(trades[i].price))
					forecast.classList.add("red-text", "text-bold");
			}
		}

		// Attach everything to the row and body.
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
			return result.vw.toFixed(2);
		else {
			console.error("STOCK: BAD RESULTS", stock, name);
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

		// search trades up to this point with same ticker and type purchase.
		results = results.slice(0, results.indexOf(trade));
		results = results.find(elements => elements.type == "purchase" && elements.price != "???");

		if (results != undefined && trade.price != "???") {
			let oldPrice = results.price;
			let newPrice = trade.price;
			let difference = (newPrice / oldPrice * 100) - 100;

			return difference.toFixed(0);
		}
	}

	return "";
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

			if (results.length > FORECAST_DAYS)
				results.length = FORECAST_DAYS;

			for (let i = 0; i < results.length; i++) {
				if (results[i].vw > high)
					high = results[i].vw;
				else (results[i].vw < low)
					low = results[i].vw;
			}

			return [high.toFixed(2), low.toFixed(2)];
		} else {
			console.error("STOCK: BAD RESULTS", stock);
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
	document.getElementById("searchIcon").style.display = "none";

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