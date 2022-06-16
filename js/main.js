$("#select-data").on("change", () => {
    caseMap.wrangleData()
    caseLineChart.wrangleData()
})
$("#select-continent").on("change", () => {
    const continent = $("#select-continent").val()
    countryFilterOn = true
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
$("#sortByValue").button().click(function(){
    if($("#sortByValue").val()=="sortMax"){
        $(this).text('Show highest to lowest');
        this.value = "sortMin"
    }else{
        $(this).text('Show lowest to highest');  
        this.value = "sortMax"
    }
    caseLineChart.wrangleData()
});    


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
        $("#select-continent option[value=World]").attr('selected', 'selected');
        //Clear and update filter related data
        caseMapRect = NaN
        caseValueData = covidData
        lineValueData = covidData
        countryFilterOn = false

        //Update Chart
        caseMap.wrangleData()
        caseLineChart.wrangleData()
    }
}

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = 0, //parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}