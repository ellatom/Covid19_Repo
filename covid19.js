
//API URL
const proxy = `https://cors-proxy.htmldriven.com/?url=`;
const baseRegion = `https://restcountries.herokuapp.com/api/v1`;
const baseStatistics = ` https://corona-api.com/countries`;
const baseStatisticsExtended = `https://corona-api.com/countries/`;

//used variables
let currentRegion = null;
let temp = null;
let currentCountry = null;
let currentDataType = "deaths";
let currentDataTypeButton = null;
let currentRegionButton = null;
let myChart = null;

//Data fetched from api
let stats = [];

//// Api
async function getRegionAndCountry() {
    try {
        const res = await fetch(`${baseRegion}`); //${proxy}
        const data = await res.json();
        return data;
    } catch (err) {
        console.log("coutries fetching failed" + err);
    }
}

async function getStatistic() {
    try {
        const res = await fetch(`${baseStatistics}`); //${proxy}
        const data = await res.json();
        return data;
    } catch (err) {
        console.log("statistics fetching failed" + err);
    }
}

async function getStatisticExtended(countryCode) {
    try {
        const res = await fetch(`${baseStatisticsExtended}${countryCode}`); //${proxy}
        const json = await res.json();
        return json.data;
    } catch (err) {
        console.log("statistics fetching failed" + err);
    }
}

///////// Data

function setStatistic(statistics) {
    statistics.data.forEach((element) => {
        stats.push({
            country: element.name,
            code: element.code,
            latestData: {
                deaths: element.latest_data.deaths,
                confirmed: element.latest_data.confirmed,
                recovered: element.latest_data.recovered,
                critical: element.latest_data.critical,
            },
        });
    });
}

function setRegionCountryData(regionCountry) {
    regionCountry.forEach((elementCountry) => {
        let statsItem = stats.find(
            (item) => item.code === elementCountry.cca2
        );

        if (!statsItem) {
            console.warn(
                `Country '${elementCountry.name.common}' was not found`
            );
            return;
        }

        statsItem.region = elementCountry.region;
    });
}

///////// Init

async function init() {
    try {
        let statistic = await getStatistic();
        setStatistic(statistic);

        let regionCountry = await getRegionAndCountry();
        setRegionCountryData(regionCountry);
        createUI();

    } catch (err) {
        console.error(err);
    }
}

function createUI() {
    createExtendedStatsButtons();
    createRegionButtons();
}

function createExtendedStatsButtons() {
    let statsExtendedContainer = document.querySelector(
        ".buttonsStatsExtendedData"
    );

    Object.keys(stats[0].latestData).forEach((key) => {
        let button = document.createElement("button");
        button.innerText = key;
        statsExtendedContainer.appendChild(button);
        button.addEventListener("click", onClickDisplayExtendedData);
    });
}

function createRegionButtons() {
    let regions = new Set(stats.map((o) => o.region));
    let sortedRegions = Array.from(new Set(regions)).sort();

    let buttonsRegion = document.querySelector(".buttonsRegionContainer");

    sortedRegions.forEach((region) => {
        if (region == "") return;//

        let buttonRegion = buttonsRegion.appendChild(
            document.createElement("button")
        );

        buttonRegion.innerText = region;
        buttonRegion.addEventListener("click", onRegionClickDisplayCountries);
    });
}

function onClickDisplayExtendedData() {

    colorButton(currentDataTypeButton, this);
    currentDataTypeButton = this;

    currentDataType = this.innerText;
    createChart(stats);
}

function onRegionClickDisplayCountries(e) {

    colorButton(currentRegionButton, this);
    currentRegionButton = this;

    let ctx = document.getElementById("myChart");
    ctx.style.display = "block";

    let countriesExtendedDataContainer = document.querySelector(
        ".countriesExtendedDataContainer"
    );
    countriesExtendedDataContainer.innerHTML = "";

    let buttonsCountry = document.querySelector(".countriesContainer");
    buttonsCountry.innerHTML = "";

    let select = buttonsCountry.appendChild(
        document.createElement("select")
    );

    select.addEventListener("change", onCountryChanged);

    let statsByRegion = stats.filter(
        (element) => element.region === this.innerText
    );

    statsByRegion.sort();

    statsByRegion.unshift({
        country: "Select country for details",
        value: "",
    });
    statsByRegion.forEach((element) => {
        let option = select.appendChild(document.createElement("option"));
        option.value = element.value === "" ? element.value : element.country;
        option.text = element.country;
    });

    currentRegion = this.innerText;

    createChart(stats);
}

async function onCountryChanged(e) {

    currentCountry = this.options[this.selectedIndex].value;

    if (currentCountry === "")
        return;

    if (myChart) myChart.destroy();
    let ctx = document.getElementById("myChart");
    ctx.style.display = "none";

    let statsItem = stats.find((o) => o.country === currentCountry);

    let data = await getStatisticExtended(statsItem.code);

    let dataTotal = [
        { title: "Total cases", value: (data.timeline.length > 0 ? data.timeline[0].confirmed : "0") },//there are some properties which dont exists for country in api and other countries api have
        { title: "New cases", value: (data.timeline.length > 0 ? data.timeline[0].new_confirmed : "0") },
        { title: "Total Deaths", value: (data.timeline.length > 0 ? data.timeline[0].deaths : "0") },
        { title: "Deaths", value: (data.timeline.length > 0 ? data.timeline[0].new_deaths : "0") },
        { title: "Total recovered", value: (data.timeline.length > 0 ? data.timeline[0].recovered : "0") },
        { title: "Critical", value: (data.timeline.length > 0 ? data.timeline[0].active : "0") },
    ];

    let countriesExtendedDataContainer = document.querySelector(
        ".countriesExtendedDataContainer"
    );

    countriesExtendedDataContainer.innerHTML = "";

    dataTotal.forEach((item) => {
        let div = countriesExtendedDataContainer.appendChild(
            document.createElement("div")
        );

        div.innerHTML = `${item.title}<br>${item.value}`;
    });
}

init();

////////// Charts
function createChartContext() {
    var ctx = document.getElementById("myChart").getContext("2d");
    return ctx;
}

function createChart(stats) {
    let filteredByRegion = stats.filter((o) => o.region === currentRegion); //region example:Africa
    let filteredCountryByRegion = filteredByRegion.map((o) => o.country);
    let datasets = [
        {
            label: currentDataType, //label per country
            data: filteredByRegion.map((o) => o.latestData[currentDataType]),
            backgroundColor: filteredByRegion.map((o) => getRandomColor()),
        },
    ];

    createChartCanvas(filteredCountryByRegion, datasets);
}

function createChartCanvas(labels, datasets) {
    let ctx = createChartContext();

    if (myChart) myChart.destroy();
    Chart
    myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [
                    {
                        stacked: false,
                        ticks: { fontSize: 9 },
                    },
                ],
                yAxes: [
                    {
                        stacked: false,
                        ticks: { fontSize: 9 },
                    },
                ],
            },
            legend: {
                display: true,
                labels: {
                    // This more specific font property overrides the global property
                    font: {
                        color: "black",
                        size: 6,
                    },
                },
            },
        },
    });
}
function colorButton(oldButton, newButton) {
    if (oldButton !== null)
        oldButton.classList.remove("clickedButton");
    newButton.classList.add("clickedButton");
}

function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

// function hideCanvas() {}future

// function showCanvas() {}future

// function hideExtendedData(){}future

// function showExtendedData(){}future

/////// Utility of graph
