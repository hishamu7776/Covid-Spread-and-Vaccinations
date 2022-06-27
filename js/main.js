$("#select-data").on("change", () => {
    caseMap.wrangleData()
    caseLineChart.wrangleData()
    timeline.wrangleData()

    const titles = {
        case: 'Total covid cases reported',
        case_million: 'Covid cases per million people',
        death: 'Total deaths reported due to covid',
        death_million: 'Deaths reported per million people'
    }

    const col_name = $("#select-data").val()
    const heading = titles[col_name]
    $('#map_title').fadeOut(200, function () {
        $(this).text(heading).fadeIn(200);
    });
})
$("#select-vaccine-data").on("change", () => {
    packLayout.wrangleData()
    stackedBarChart.wrangleData()
    firstBarChart.wrangleData()
    secondBarChart.wrangleData()
    boosterBarChart.wrangleData()
})
$("#top-selector").on("change", () => {
    stackedBarChart.wrangleData()
    firstBarChart.wrangleData()
    secondBarChart.wrangleData()
    boosterBarChart.wrangleData()
})
$("#sort-vaccine").on("change", () => {
    stackedBarChart.wrangleData()
    firstBarChart.wrangleData()
    secondBarChart.wrangleData()
    boosterBarChart.wrangleData()
})
$("#select-continent").on("change", () => {
    const continent = $("#select-continent").val()
    countryFilterOn = true
    if (continent != "World") {
        lineValueData = covidData.filter(function (d) {
            return d.continent == continent
        })
        caseValueData = lineValueData
        timelineValueData = lineValueData
        scatterValueData = lineValueData
    } else {
        lineValueData = covidData
        caseValueData = covidData
        timelineValueData = covidData
        scatterValueData = covidData
    }
    caseMap.wrangleData()
    caseLineChart.wrangleData()
    scatterPlot.wrangleData()
    timeline.wrangleData()
})

$('input[type=radio][name=sortLine]').change(function() {
    caseLineChart.wrangleData()
});

function filterByCountry(country_list) {
    countryFilterOn = true
    //Filter if required
    caseValueData = covidData.filter(function (d) {
        return !country_list.includes(d.iso_code) && !country_list.includes(d.iso_code)
    });
    lineValueData = caseValueData
    scatterValueData = caseValueData
    timelineValueData = caseValueData
    //Update Chart

    caseMap.wrangleData()
    caseLineChart.wrangleData()
    scatterPlot.wrangleData()
    timeline.wrangleData()
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
        timelineValueData = covidData
        scatterValueData = covidData
        countryFilterOn = false

        //Update Chart
        caseMap.wrangleData()
        caseLineChart.wrangleData()
        scatterPlot.wrangleData()
        timeline.wrangleData()
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

function brushed() {
    const selection = d3.event.selection || timeline.x.range()
    const newValues = selection.map(timeline.x.invert)
    changeDates(newValues)
}

function changeDates(values) {

    newCovidData = covidData.filter(d => ((xParseTime(d.date) > values[0]) && (xParseTime(d.date) < values[1])))

    $("#dateLabel1").text(formatTime(values[0]))
    $("#dateLabel2").text(formatTime(values[1]))

    lineValueData = newCovidData
    caseValueData = newCovidData
    scatterValueData = newCovidData

    caseMap.wrangleData()
    caseLineChart.wrangleData()
    scatterPlot.wrangleData()

}