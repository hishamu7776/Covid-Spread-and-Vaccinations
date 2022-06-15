/*
*   Multi-series Line Chart
*   Hisham Unniyankal
*   S5049651
*   Universita di Genova
*   Data Visualization Project
*/

class LineChart {
    constructor(_parentElement) {
        this.parentElement = _parentElement
        this.initVis()
    }

    initVis() {
        const vis = this
        vis.MARGIN = { LEFT: 80, RIGHT: 120, TOP: 10, BOTTOM: 60 }
        vis.WIDTH = 600 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 400 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM

        vis.headings = {
            total_cases: 'Total Cases',
            total_cases_million: 'Total Case (per million)',
            total_deaths: 'Total Deaths',
            total_death_million: 'Total Death (per million)'
        }
        vis.ranges = {
            total_cases: [3000, 30000, 300000, 3000000, 10000000, 50000000, 100000000],
            total_cases_million: [1000, 5000, 10000, 50000, 100000, 200000, 300000],
            total_deaths: [1000, 5000, 10000, 50000, 100000, 500000, 1100000],
            total_death_million: [10, 50, 100, 500, 1000, 5000, 10000]
        }

        vis.variables = {
            case: 'total_cases',
            case_million: 'total_cases_million',
            death: 'total_deaths',
            death_million: 'total_death_million'
        }


        vis.parent_div = d3.select(vis.parentElement);

        vis.svg = vis.parent_div.append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)

        vis.g = vis.svg.append("g").attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)

        vis.xColumn = "date"
        vis.lineColumn = "location"


        //for tooltip
        vis.bisectDate = d3.bisector(d => d.date).left
        //For Legend
        vis.legend = vis.svg.append("g")
            .attr("id", "line_legend");


        // axis labels
        vis.xLabel = vis.g.append("text")
            .attr("class", "x axisLabel")
            .attr("y", vis.HEIGHT + 55)
            .attr("x", vis.WIDTH / 2)
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")
            .text("Time")

        vis.yLabel = vis.g.append("text")
            .attr("class", "y axisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -130)
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")

        // scales
        vis.x = d3.scaleTime().range([0, vis.WIDTH])
        vis.y = d3.scaleLinear().range([vis.HEIGHT, 0])

        vis.colorScale = d3.scaleOrdinal();

        // axis generators
        vis.xAxisCall = d3.axisBottom().ticks(6).tickFormat(d3.timeFormat("%b-%y"));
        vis.yAxisCall = d3.axisLeft().ticks(6).tickFormat(customTickFormat)

        // axis groups
        vis.xAxis = vis.g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`)

        vis.yAxis = vis.g.append("g")
            .attr("class", "y axis")

        vis.line = d3.line()
            .x(function (d) { return vis.x(xParseTime(d.date)); })
            .y(function (d) { return vis.y(d[vis.yColumn]); });
        //for transition
        vis.t = d3.transition().duration(500)
        vis.addLegend()
        vis.wrangleData()
    }
    wrangleData() {
        const vis = this
        //Column_names
        vis.yColumn = vis.variables[$("#select-data").val()]

        vis.covidData = d3.nest()
            .key(d => d.location)
            .rollup(function (values) {
                const dateCountryData = d3.nest()
                    .key(d => d.date)
                    .entries(values)
                    .map(day => day.values.reduce(
                        (maxValue, current) => {
                            maxValue.date = day.key
                            maxValue["total_cases"] = d3.max([maxValue["total_cases"], current["total_cases"]])
                            maxValue["total_cases_million"] = d3.max([maxValue["total_cases_million"], current["total_cases_million"]])
                            maxValue["total_deaths"] = d3.max([maxValue["total_deaths"], current["total_deaths"]])
                            maxValue["total_death_million"] = d3.max([maxValue["total_death_million"], current["total_death_million"]])
                            return maxValue
                        }, {
                        "total_cases": 0,
                        "total_cases_million": 0,
                        "total_deaths": 0,
                        "total_death_million": 0
                    }
                    ))
                return dateCountryData
            })
            .entries(lineValueData)

        vis.maxValueByCountry = []
        d3.map(vis.covidData, function (data) {
            const max_val = d3.max(data.value, d => d[vis.yColumn])
            vis.maxValueByCountry.push([data.key, max_val])
        })
        vis.operation = $('input[name=sortCountryByValue]:checked').val()
        if (vis.operation == "sortMax") {
            vis.maxValueByCountry.sort(function (a, b) {
                return b[1] - a[1];
            });
        } else {
            vis.maxValueByCountry.sort(function (a, b) {
                return a[1] - b[1];
            });
        }

        vis.countryList = []
        for (var i = 0; i < 5; i++) {
            vis.countryList.push(vis.maxValueByCountry[i][0])
        }
        vis.covidData = vis.covidData.filter(function (d) {
            return vis.countryList.includes(d.key)
        })

        vis.updateVis()
    }
    updateVis() {
        const vis = this

        // update scales
        vis.x.domain(d3.extent(covidData, function (d) {
            return xParseTime(d.date);
        }))


        vis.y.domain([
            d3.min(vis.covidData, d => d3.min(d.value, c => c[vis.yColumn])),
            d3.max(vis.covidData, d => d3.max(d.value, c => c[vis.yColumn]))
        ]).nice();

        vis.colorScale.domain(vis.countryList).range(d3.schemeCategory10);
        vis.colorMap = {}
        vis.countryList.forEach(function(d){
            vis.colorMap[d] = vis.colorScale(d);
        })
        // update axes
        vis.xAxisCall.scale(vis.x)

        vis.xAxis.transition(vis.t).call(vis.xAxisCall)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-1em")
            .attr("dy", "-0.5em")
            .attr("transform", "rotate(-60)");


        vis.yAxisCall.scale(vis.y)
        vis.yAxis.transition(vis.t).call(vis.yAxisCall)
        vis.yLabel.text(vis.headings[vis.yColumn])
        vis.country = vis.g.selectAll(".countries")
            .data(vis.covidData);

        vis.country.exit().remove();

        vis.country.enter()
            .append("path")
            .attr("class", "countries")
            .style("stroke", d => vis.colorMap[d.key])
            .style("stroke-width", 3)
            .style("fill", "none")
            .merge(vis.country)
            .transition(vis.t)
            .attr("d", d => vis.line(d.value))

        d3.selectAll(".line_legend_entry").remove();
        const ls_h = 25
        const ls_w = 25
        var y_pos = 50
        var y_text_pos = 65
        
        vis.legend_entry = vis.legend.selectAll("#line_legend")
            .data(vis.countryList)
            .enter().append("g")
            .attr("class", "line_legend_entry");

        vis.rect = vis.legend_entry.append("rect")
            .attr("x", vis.WIDTH+70)
            .attr("y", function(d){
                y_pos = y_pos+30
                return y_pos
            })
            .attr("id", function (d) {
                return d
            })
            .attr("width", ls_w)
            .attr("height", ls_h)
            .attr("opacity", .8)
            .attr("cursor", "pointer")
            .style("fill", function (d) {
                return vis.colorMap[d];
            })
            .style("transition",".5s")
            .append('text')
            .text(function (d) {
                return d
            })
        vis.text = vis.legend_entry.append("text")
            .attr("x", vis.WIDTH+105)
            .attr("y", function(d){
                y_text_pos = y_text_pos+30
                return y_text_pos
            })
            .attr("font-size", ".9em")
            .text(function (d) {
                return d
            })          
    }
    addLegend() {
        const vis = this
    }
}
