/*
*   Multi-series Line Chart
*   Hisham Unniyankal
*   S5049651
*   Universita di Genova
*   Data Visualization Project
*/

class ScatterPlot {
    constructor(_parentElement) {
        this.parentElement = _parentElement

        this.initVis()
    }

    initVis() {
        const vis = this

        //Setting Layout
        vis.MARGIN = { LEFT: 80, RIGHT: 10, TOP: 10, BOTTOM: 60 }
        vis.WIDTH = 500 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 300 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM

        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)
            .append("g").attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)

        vis.xColumn = "tests_per_thousand"
        vis.yColumn = "case_per_million"
        vis.sizeColumn = "death_per_million"

        vis.headings = {
            tests_per_thousand: 'Total Tests per Thousand',
            case_per_million: 'Total Case per Million',
            death_per_million: 'Total Death per Million'
        }

        // axis labels
        vis.xLabel = vis.svg
            .append("text")
            .attr("class", "x axisLabel")
            .attr("y", vis.HEIGHT + 55)
            .attr("x", vis.WIDTH / 2)
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")
            .text("Tests conducted(per thousands)")

        vis.yLabel = vis.svg
            .append("text")
            .attr("class", "y axisLabel")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -130)
            .attr("font-size", "16px")
            .attr("text-anchor", "middle")
            .text("Total Cases (per million)")

        //For Scales
        vis.x = d3.scaleLog().range([0, vis.WIDTH]).domain([.1, 40000])
        vis.y = d3.scaleLinear().range([vis.HEIGHT, 0])
        vis.area = d3.scaleLinear().range([10 * Math.PI, 100 * Math.PI])
        vis.colorScale = d3.scaleOrdinal().domain(CONTINENTS).range(d3.schemeCategory10);;

        //For Axis
        vis.xAxisCall = d3.axisBottom()
            .tickValues([1, 10, 100, 1000, 10000, 40000])
            .tickFormat(customTickFormat)
            .scale(vis.x)

        vis.yAxisCall = d3.axisLeft().ticks(6).tickFormat(customTickFormat)

        vis.xAxis = vis.svg.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`)
            .transition(vis.t)
            .call(vis.xAxisCall)


        vis.yAxis = vis.svg.append("g")
            .attr("class", "y axis")

        //for transition
        vis.t = d3.transition().duration(500)

        //For Legend

        //For Tooltip
        //Create tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);


        vis.wrangleData()
    }
    wrangleData() {
        const vis = this

        vis.covidData = d3.nest()
            .key(function (d) {
                return d.location
            })
            .rollup(function (data) {
                var new_data = {}

                new_data.iso_code = data[0].iso_code
                new_data.continent = data[0].continent
                new_data[vis.xColumn] = d3.sum(data, function (d) {
                    return d[vis.xColumn]
                })
                new_data[vis.yColumn] = d3.sum(data, function (d) {
                    return d[vis.yColumn]
                })
                new_data[vis.sizeColumn] = d3.sum(data, function (d) {
                    return d[vis.sizeColumn]
                })
                return new_data
            }).entries(scatterValueData)
            .map(function (d) {
                return { iso_code: d.value.iso_code, location: d.key, continent: d.value.continent, case_per_million: d.value.case_per_million, tests_per_thousand: d.value.tests_per_thousand, death_per_million: d.value.death_per_million }
            })
        vis.addLegend()
        vis.updateVis()
    }
    updateVis() {
        const vis = this

        //Update X and Y scale

        vis.y.domain([0, d3.max(vis.covidData, function (d) {
            return d[vis.yColumn]
        })
        ]).nice();

        vis.area.domain([0, d3.max(vis.covidData, function (d) {
            return d[vis.sizeColumn]
        })
        ]);

        // update axes

        vis.yAxisCall.scale(vis.y)
        vis.yAxis.transition(vis.t).call(vis.yAxisCall)

        vis.svg.selectAll(".dot")
            .data(vis.covidData)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r",
                function (d) {
                    return Math.sqrt(vis.area(d[vis.sizeColumn]) / Math.PI)
                }
            )
            .attr("cx", function (d) {
                return vis.x(d[vis.xColumn]) || 0
            })
            .attr("cy", function (d) {
                return vis.y(d[vis.yColumn]) || 0
            })
            .style("fill", function (d) { return vis.colorScale(d.continent); })
            .style("opacity", .8)
            .on("mouseover", function (d) {
                vis.tooltip.transition().duration(200).style("opacity", .9);
                vis.tooltip.html(
                    "<h3>" + d.location + " - " + d.continent + "</h3>"
                    + "<p>" + vis.headings[vis.xColumn] + " : " + customTickFormat(d[vis.xColumn]) + "</p>"
                    + "<p>" + vis.headings[vis.yColumn] + " : " + customTickFormat(d[vis.yColumn]) + "</p>"
                    + "<p>" + vis.headings[vis.sizeColumn] + " : " + customTickFormat(d[vis.sizeColumn]) + "</p>"
                )
                vis.tooltip.style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
            })
            .on("mouseout", function (d) {
                vis.tooltip.transition(vis.t)
                    .duration(200)
                    .style("opacity", 0);
            });
    }
    addLegend() {
        const vis = this
        vis.legend = vis.svg.selectAll(".legend")
            .data(vis.colorScale.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

        // draw legend colored rectangles
        vis.legend.append("rect")
            .attr("x", vis.WIDTH - vis.WIDTH*9.5/10)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", this.colorScale);

        // draw legend text
        vis.legend.append("text")
            .attr("x", vis.WIDTH - vis.WIDTH*9.5/10+24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function (d) { return d; })
    }
}
