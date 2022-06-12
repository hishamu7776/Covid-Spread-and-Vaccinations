function filterByCountry(){
    if(countryFilterOn==true){ clearFilters() }
    else{
        countryFilterOn = true
        mapValueData = covidData.filter(function(d) {
            return !filter_country_list.includes(d.iso_code) && !filter_country_list.includes(d.iso_code)
        });
    }
    caseMap.wrangleData()
}

function clearFilters(){
    if(countryFilterOn==true){
        caseMapRect = NaN
        mapValueData = covidData
        countryFilterOn = false
        filter_country_list = []
        caseMap.wrangleData()
    }
}