let CONTINENTS = ["Africa","Asia","Europe","North America","South America","Oceania"]
const OTHERS = ["European Union","High income","International","Low income","Lower middle income","World","Upper middle income","Western Sahara"]
const parseTime = d3.timeParse("%d-%m-%Y")
const xParseTime = d3.timeParse("%b-%Y")
const formatTime = d3.timeFormat("%b-%Y")
const xFormatTime = d3.timeFormat("%b-%Y")

//create formatted tick values
const siFormat = d3.format("~s");
const customTickFormat = function (d){
    return siFormat(d).replace("G", "B");
};

let mapData;
let stackContinents = CONTINENTS
let caseValueData;
let caseMap;
let caseLineChart;
let lineValueData;
let scatterValueData;
let scatterPlot;
let timeline;
let timelineValueData;
let covidData;
let countryFilterOn = false;
let caseMapRect;
let all_countries = [];
let endDate = '05-2022'
let startDate = '06-2021'


Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv('data\\covid_data.csv',function(d){
        if(!all_countries.includes(d.location)){ 
            if(!CONTINENTS.includes(d.location) && !OTHERS.includes(d.location)){
                all_countries.push(d.location) 
            }

        }  
        d.date = formatTime(parseTime(d.date));
        d['total_cases'] = +d['total_cases']
        d['case_per_date'] = +d['case_per_date']
        d['total_deaths'] = +d['total_deaths']
        d['death_per_date'] = +d['death_per_date']
        d['total_cases_million'] = +d['total_cases_million']
        d['case_per_million'] = +d['case_per_million']
        d['death_per_million'] = +d['death_per_million']
        d['total_death_million'] = +d['total_death_million']
        d['total_tests'] = +d['total_tests']
        d['tests_per_date'] = +d['tests_per_date']
        d['tests_per_thousand'] = +d['tests_per_thousand']
        return d;
    })
]).then(
    d => run(null, d[0], d[1])
);

function run(error, map_data, covid_data){
    mapData = map_data
    covidData = covid_data.filter(function(d){
        return !CONTINENTS.includes(d.location) && !OTHERS.includes(d.location)
    })
    
    lineValueData = covidData
    caseValueData = covidData
    scatterValueData = covidData
    timelineValueData = covidData

    caseMap = new MapChart("#case_map")
    caseLineChart = new LineChart("#case_line_chart")
    scatterPlot = new ScatterPlot("#case_scatter_plot")
    timeline = new Timeline("#timeline")
}