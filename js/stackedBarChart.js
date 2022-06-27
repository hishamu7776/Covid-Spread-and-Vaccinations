class StackedBarChart {
    constructor(_parentElement) {
        this.parentElement = _parentElement
        this.initVis()
    }
    initVis() {
        const vis = this
        //Setting Layout
        vis.MARGIN = { LEFT: 80, RIGHT: 70, TOP: 60, BOTTOM: 30 }
        vis.WIDTH = 550 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 600 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM

        vis.variableMap = {
            'total_vaccinated_per_million': 'per_million',
            'total_vaccinated': 'full_data'
        }

        vis.columns = {
            'per_million': ['first_dose_per_million', 'last_dose_per_million', 'booster_dose_per_million'],
            'full_data': ['first_dose', 'last_dose', 'booster_dose']
        }
        vis.keys = ['a', 'b', 'c']
        //Create SVG
        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)
        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)


        vis.y = d3.scaleBand()
            .rangeRound([0, vis.HEIGHT])
            .paddingInner(0.05)
            .align(0.1);
        vis.x = d3.scaleLinear()
            .rangeRound([0, vis.WIDTH]);
        vis.color = d3.scaleOrdinal().range(["#377eb8","#4daf4a","#984ea3"]);

        // axis generators
        vis.xAxisCall = d3.axisBottom().ticks(6).tickFormat(customTickFormat);
        vis.yAxisCall = d3.axisLeft()

        // axis groups
        vis.xAxis = vis.g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`)

        vis.yAxis = vis.g.append("g")
            .attr("class", "y axis")

        //for transition
        vis.t = d3.transition().duration(500)

        //Create tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        vis.addLegend()
        vis.wrangleData()
    }
    wrangleData() {
        const vis = this
        vis.variable = vis.variableMap[$("#select-vaccine-data").val()]
        vis.sorting = $("#sort-vaccine").val()
        vis.group = parseInt($("#top-selector").val())
        vis.vaccineData = d3.nest()
            .key(d => d.location)
            .rollup(function (d) {
                var new_row = {}
                new_row['first_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][0]])
                new_row['second_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][1]])
                new_row['booster_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][2]])
                return new_row;
            })
            .entries(barData)
            .map(function (data) {
                var d = {}
                d.location = data.key
                d.a = data.value.first_dose
                d.b = data.value.second_dose
                d.c = data.value.booster_dose
                d.total_dose = data.value.first_dose + data.value.second_dose + data.value.booster_dose
                return d
            })
        if (vis.sorting == 'maxmin') { vis.vaccineData.sort(function (a, b) { return b.total_dose - a.total_dose; }); }
        else { vis.vaccineData.sort(function (a, b) { return a.total_dose - b.total_dose; }); }

        vis.vaccineData = vis.vaccineData.filter(function (d, i) {
            if (i < vis.group && i > vis.group - 21) {
                return d
            }
        })
        vis.updateVis()
    }
    updateVis() {
        const vis = this

        vis.stackData = d3.stack().keys(vis.keys)(vis.vaccineData)

        vis.y.domain(this.vaccineData.map(function (d) { return d.location; }));
        vis.x.domain([0, d3.max(vis.vaccineData, function (d) { return d.total_dose; })]).nice();


        // update axes
        vis.xAxisCall.scale(vis.x)
        vis.xAxis.transition(vis.t).call(vis.xAxisCall)

        vis.yAxisCall.scale(vis.y)
        vis.yAxis.transition(vis.t).call(vis.yAxisCall)

        vis.group = vis.g.selectAll("g.vaccine").data(vis.stackData)
        vis.group.exit().remove()
        vis.group.enter().append("g")
            .classed("vaccine", true)
            .style("fill", function (d) { return vis.color(d.key); });

        vis.rect = vis.g.selectAll("g.vaccine").selectAll("rect").data(function (d) { return d; })
        
        vis.rect.exit().remove()
            .attr("y", function (d) { return vis.y(d.data.location); })
            .attr("x", function (d) { return vis.x(d[0]); })
            .attr("width", function (d) { return vis.x(d[1]) - vis.x(d[0]); })
            .attr("height", vis.y.bandwidth());

        vis.rect.enter().append("rect")
            .merge(vis.rect)
            .transition(vis.t)
            .attr("y", function (d) { return vis.y(d.data.location); })
            .attr("x", function (d) { return vis.x(d[0]); })
            .attr("width", function (d) { return vis.x(d[1]) - vis.x(d[0]); })
            .attr("height", vis.y.bandwidth());

        vis.text = vis.g.selectAll("g.vaccine").selectAll("text").data(vis.vaccineData)
        vis.text.exit().remove()
            .attr("y", function (d) { return vis.y(d.location) + 15; })
            .attr("x", function (d) { return vis.x(d.total_dose) + 5; })
            .text(d => customTickFormat(d.total_dose))

        vis.text.enter().append("text").merge(vis.text)
            .transition(vis.t)
            .attr("y", function (d) { return vis.y(d.location) + 15; })
            .attr("x", function (d) { return vis.x(d.total_dose) + 5; })
            .text(d => customTickFormat(d.total_dose))

        vis.g.selectAll("g.vaccine").selectAll("rect").on("mouseover", function (d) {
            vis.tooltip.transition().duration(200).style("opacity", .9);
            vis.tooltip.html(
                "<h3> Country - " + d.location + "</h3>"
                + "<p> First Dose : " + customTickFormat(d.data.a) + "</p>"
                + "<p> Second Dose : " + customTickFormat(d.data.b) + "</p>"
                + "<p> Booster Dose : " + customTickFormat(d.data.c) + "</p>"
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
        // Draw legend
        vis.legend = vis.g.selectAll(".legend")
            .data(['a', 'b', 'c'])
            .enter().append("g")
            .attr("class", "legend")



        // draw legend colored rectangles
        vis.legend.append("rect")
            .attr("x", function(d,i){
                return i*130
            })
            .attr("y",-40)
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", function(d){ return vis.color(d)});

        // draw legend text
        vis.legend.append("text")
            .attr("x", function(d,i){
                return +22+(i*130)
            })
            .attr("y", -30)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(function (d, i) {
                switch (i) {
                    case 0: return "First Dose";
                    case 1: return "Second Dose";
                    case 2: return "Booster Dose";
                }
            });
    }

}
