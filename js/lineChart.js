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
        vis.MARGIN = { LEFT: 80, RIGHT: 10, TOP: 10, BOTTOM: 60 }
        vis.WIDTH = 400 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 250 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM
        vis.lineStroke = "2px"

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
            .attr("x", -80)
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
        //For tooltip
        vis.tooltip = d3.select("#line-tooltip")
        vis.tooltipLocator = vis.g.append('line');



        //for transition
        vis.t = d3.transition().duration(1000)
        vis.addLegend()
        vis.wrangleData()
    }
    wrangleData() {
        const vis = this
        //Column_names
        vis.yColumn = vis.variables[$("#select-data").val()]
        vis.operation = $('input:radio[name=sortLine]:checked').val();
        vis.all_date = []
        vis.covidData = d3.nest()
            .key(d => d.location)
            .rollup(function (values) {
                const dateCountryData = d3.nest()
                    .key(d => d.date)
                    .entries(values)
                    .map(day => day.values.reduce(
                        (maxValue, current) => {
                            vis.all_date.push(day.key)
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
        
        if (vis.operation == "sortMax") {
            vis.covidData = vis.covidData.sort(function(a,b){
                return d3.descending(d3.max(a.value,d => d[vis.yColumn]),d3.max(b.value,d => d[vis.yColumn]))
            })
        }else if(vis.operation == "sortMin"){
            vis.covidData = vis.covidData.sort(function(a,b){
                return d3.ascending(d3.min(a.value,d => d[vis.yColumn]),d3.min(b.value,d => d[vis.yColumn]))
            })
        }

        vis.covidData = vis.covidData.slice(0,5)
        vis.updateVis()
    }
    updateVis() {
        const vis = this
        vis.all_date = [...new Set(vis.all_date)]
        // update scales
        vis.x.domain(d3.extent(vis.all_date, function (d) {
            return xParseTime(d);
        }))

        vis.y.domain([
            d3.min(vis.covidData, d => d3.min(d.value, c => c[vis.yColumn])),
            d3.max(vis.covidData, d => d3.max(d.value, c => c[vis.yColumn]))
        ]).nice();

        vis.colorScale.domain(vis.covidData,d => d.key).range(["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"]);
        vis.colorMap = {}
        vis.covidData.forEach(function(d){
            vis.colorMap[d.key] = vis.colorScale(d.key);
        })
        // update axes
        vis.xAxisCall.scale(vis.x)
        
        vis.xAxis.transition()
            .duration(500)
            .call(vis.xAxisCall)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-1em")
            .attr("dy", "-0.5em")
            .attr("transform", "rotate(-60)");


        vis.yAxisCall.scale(vis.y)
        vis.yAxis.transition().duration(500).call(vis.yAxisCall)
        vis.yLabel.text(vis.headings[vis.yColumn])
        
        vis.country = vis.g.selectAll(".countries")
            .data(vis.covidData);

        vis.country.exit().remove()
            .style("stroke", d => vis.colorMap[d.key])
            .style("stroke-width", 3)
            .style("fill", "none")
            .merge(vis.country)
            .transition().duration(500)
            .attr("d", d => vis.line(d.value))
            .text("sadsad")

        vis.country.enter()
            .append("path")
            .attr("class", "countries")
            .style("stroke", d => vis.colorMap[d.key])
            .style("stroke-width", 3)
            .style("fill", "none")
            .merge(vis.country)
            .transition().duration(500)
            .attr("d", d => vis.line(d.value))
            .text("sadsad")
            

        d3.selectAll(".line_legend_entry").remove();
        const ls_h = 20
        const ls_w = 20
        vis.y_pos = 0
        vis.x_pos = 90
        vis.x_text_pos = 115
        vis.y_text_pos = 15

        
        vis.legend_entry = vis.legend.selectAll("#line_legend")
            .data(vis.covidData)
            .enter().append("g")
            .attr("class", "line_legend_entry");
        vis.tip = vis.g.append('rect')
            .attr('height', vis.HEIGHT)    
            .attr('width', vis.WIDTH)
            .attr('opacity', 0)
            .on('mousemove', function(d){
                const mouse_location = d3.mouse(vis.tip.node())
                const tooltipDate =  vis.x.invert(mouse_location[0])
                const strDate = xFormatTime(tooltipDate)

                vis.tooltipLocator.attr('stroke','#000')
                    .style("opacity",1)
                    .attr('x1', vis.x(tooltipDate))
                    .attr('x2', vis.x(tooltipDate))
                    .attr('y1', 0)
                    .attr('y2', vis.HEIGHT);

                vis.tooltip.html(strDate)
                    .style('display','block')
                    .style("opacity",.9)
                    .style("width","200px")
                    .style('left', d3.mouse(this)[0] - 80+"px")
                    .style('top', d3.mouse(this)[1] - 80 +"px")
                    .attr('left', 200)
                    .attr('top', 50)
                    .selectAll()
                    .data(vis.covidData).enter()
                    .append('div')
                    .style('color', d => vis.colorMap[d.key])
                    .html(function(data){    
                        var axis_value = 0;
                        if(data.value.find(d => d.date == strDate)!=undefined){
                            axis_value=data.value.find(d => d.date == strDate)[vis.yColumn];
                        }
                        return data.key + ' : ' + axis_value;
                    });

            })
            .on('mouseout', function(d){
                vis.tooltip.style("opacity",0)
                vis.tooltipLocator.style("opacity",0)
            });

        
    }
    addLegend() {
        const vis = this
    }
}
