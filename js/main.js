$("#select-data").on("change", () => {
    caseMap.wrangleData()
    caseLineChart.wrangleData()
})
$("#select-continent").on("change", () => {
    const continent = $("#select-continent").val()
    
    if(continent!="World"){
        lineValueData = covidData.filter(function(d){
            return d.continent == continent
        })
        caseValueData = lineValueData
    }else{
        lineValueData = covidData
        caseValueData = covidData
    }
    caseMap.wrangleData()
    caseLineChart.wrangleData()
})
$("#sort-descending").on("change",()=>{
    console.log("TOP DOWN")
})
$("#sort-ascending").on("change",()=>{
    console.log("BOTTOM UP")
})
function filterByCountry(country_list) {
    countryFilterOn = true
    //Filter if required
    caseValueData = covidData.filter(function (d) {
        return !country_list.includes(d.iso_code) && !country_list.includes(d.iso_code)
    });
    lineValueData = caseValueData
    //Update Chart
    caseMap.wrangleData()
    caseLineChart.wrangleData()
}

function filterByDate() {

}
function clearCountryFilters() {
    if (countryFilterOn == true) {
        //Clear and update filter related data
        caseMapRect = NaN
        caseValueData = covidData
        lineValueData = covidData.filter(function(d){
            return d.continent == "World"
        })
        countryFilterOn = false

        //Update Chart
        caseMap.wrangleData()
        caseLineChart.wrangleData()
    }
}