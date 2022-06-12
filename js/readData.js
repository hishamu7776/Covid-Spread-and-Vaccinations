const CONTINENTS = ["Africa","Asia","Europe","North America","South America","Oceania"]
const OTHERS = ["European Union","High income","International","Low income","Lower middle income","World","Upper middle income","Western Sahara"]
var parseTime = d3.timeParse("%d-%m-%Y")

let mapData;
let mapValueData;
let caseMap;
let covidData;
let countryFilterOn = false;
let filter_country_list = [];
let caseMapRect;


Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv('data\\covid_data.csv',function(d){
        d.date = +parseTime(d.date);
        d['total_cases'] = +parseInt(d['total_cases'])
        d['case_per_date'] = +parseInt(d['case_per_date'])
        d['total_deaths'] = +parseInt(d['total_deaths'])
        d['death_per_date'] = +parseInt(d['death_per_date'])
        d['total_cases_million'] = +parseInt(d['total_cases_million'])
        d['case_per_million'] = +parseInt(d['case_per_million'])
        d['death_per_million'] = +parseInt(d['death_per_million'])
        d['total_death_million'] = +parseInt(d['total_death_million'])
        return d;
    })
]).then(
    d => run(null, d[0], d[1])
);

function run(error, map_data, covid_data){
    mapData = map_data
    covidData = covid_data.filter(function(d) {
        return !CONTINENTS.includes(d.location) && !OTHERS.includes(d.location)
    });
    mapValueData = covidData
    caseMap = new MapChart("#case_map")
    $("#select-data").on("change", () => {
        caseMap.wrangleData()
    })
}