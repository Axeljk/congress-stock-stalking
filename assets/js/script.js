// Global variables.
var raw_data = {};
var names = {};
var stockNames = [];
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
	let tableBody = document.createElement("tbody");
	let oldBody = document.getElementsByTagName("tbody").item(0);

	// loop through trades of person and add each new one to array
	for (let i = 0; i < raw_data.length; i++) {
		if (raw_data[i].representative === name) {
			let tradeType = raw_data[i].type;
			let newRow = document.createElement("tr");
			let tickerName = document.createElement("td");
			let purchaseDate = document.createElement("td");
			let purchasePrice = document.createElement("td");
			let saleDate = document.createElement("td");
			let salePrice = document.createElement("td");
			let gainLoss = document.createElement("td");
			
			let transactionDate = raw_data[i].transaction_date;
			let polygonAPIurl = 'https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json';
			let polygonAPIkey = '?adjusted=true&apiKey=CsDKqvk0mc4F35tmdksdYVV0lfK_QZF2';
			



			// fetch(polygonAPIurl+transactionDate+polygonAPIkey)
  			// .then(response => response.json())
  			// .then(data => console.log(data));


			tickerName.textContent = raw_data[i].ticker;
			if (tradeType === "purchase") {
				purchaseDate.textContent = raw_data[i].transaction_date;
				purchasePrice.textContent = "$1.00"; // polygon.io data here
			} else if (tradeType === "sale_full" || tradeType === "sale_partial") {
				saleDate.textContent = raw_data[i].transaction_date;
				salePrice.textContent = "$1.00"; // polygon.io data here
			} else
				console.log(raw_data[i]);
			gainLoss.textContent = raw_data[i].amount;

			newRow.appendChild(tickerName);
			newRow.appendChild(purchaseDate);
			newRow.appendChild(purchasePrice);
			newRow.appendChild(saleDate);
			newRow.appendChild(salePrice);
			newRow.appendChild(gainLoss);
			tableBody.appendChild(newRow);
			console.log()
		}
	}
	document.getElementsByTagName("table").item(0).replaceChild(tableBody, oldBody);

	// Add array of stock names to the selection of stocks
	stockNames.length = 0;
	for (let i = 0; i < raw_data.length; i++) {
		if (raw_data[i].representative === name && !stockNames.includes(raw_data[i].ticker)) {
			stockNames.push(raw_data[i].ticker);
		}
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
			var nameOnCardtext = data.query.pages[pageID].title 
			console.log(data.query.pages[pageID].title)
			document.getElementById("portrait").src = portrait
			document.getElementById("nameOnCard").innerHTML = nameOnCardtext
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





// console.log(polygonAPIurl)

// fetch(polygonAPIurl)
//   .then(response => response.json())
//   .then(data => console.log(data));