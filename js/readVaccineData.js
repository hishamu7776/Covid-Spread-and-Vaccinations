let CONTINENTS = ["Africa","Asia","Europe","North America","South America","Oceania"]
const OTHERS = ["European Union","High income","International","Low income","Lower middle income","World","Upper middle income","Western Sahara"]
const parseTime = d3.timeParse("%Y-%m")
const formatTime = d3.timeFormat("%b-%Y")
//create formatted tick values
const siFormat = d3.format("~s");
const customTickFormat = function (d){
    return siFormat(d).replace("G", "B");
};

let vaccineData;
let barData;
let iso_map = {}
let packData;
let packLayout;
let stackedBarChart;
let firstBarChart;
let secondBarChart;
let boosterBarChart;
let vaccineFilterOn = false;
let all_countries = [];


Promise.all([
    d3.csv('data\\vaccineData.csv',function(d){
        iso_map[d.iso_code] = d.location
        d['population'] = +d['population']
        d['first_dose'] = +d['first_dose']
        d['last_dose'] = +d['last_dose']
        d['booster_dose'] = +d['booster_dose']
        d['total_vaccinations'] = +d['total_vaccinations']
        d['partially_vaccinated'] = +d['partially_vaccinated']
        d['total_vaccinations_per_million'] = +d['total_vaccinations_per_million']
        d['partially_vaccinated_per_million'] = +d['partially_vaccinated_per_million']
        d['fully_vaccinated_per_million'] = +d['fully_vaccinated_per_million']
        d['first_dose_per_million'] = +d['first_dose_per_million']
        d['last_dose_per_million'] = +d['last_dose_per_million']
        d['booster_per_million'] = +d['booster_per_million']
        
        return d
    })
]).then(
    d => run(null, d[0])
);

function run(error, vaccine_data){
    vaccineData = vaccine_data.filter(function(d){
        return !CONTINENTS.includes(d.location) && !OTHERS.includes(d.location)
    })
    packData = vaccineData
    barData = vaccineData
    packLayout = new PackLayout("#pack_layout")
    stackedBarChart = new StackedBarChart("#stacked_bar")
    firstBarChart = new BarChart("#first_bar",'first_dose','First Dose Taken',"#ff9da7")
    secondBarChart = new BarChart("#second_bar",'last_dose','Last Dose Taken',"#9c755f")
    boosterBarChart = new BarChart("#booster_bar",'booster_dose','Booster Dose Taken',"#bab0ab")
}

