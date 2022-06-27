class BarChart {
    constructor(_parentElement, _variable, _title, _color) {
        this.parentElement = _parentElement
        this.variable = _variable
        this.title = _title
        this.barColor = _color
        this.initVis()
    }
    initVis() {
        const vis = this
        vis.MARGIN = { LEFT: 60, RIGHT: 50, TOP: 50, BOTTOM: 80 }
        vis.WIDTH = 400 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 250 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM
        vis.variableMap = {
            'total_vaccinated_per_million': '_per_million',
            'total_vaccinated': ''
        }
        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)

        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)

        vis.linePath = vis.g.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke-width", "3px")

        vis.x = d3.scaleBand()
            .range([0, vis.WIDTH])
            .padding(0.2)

        vis.y = d3.scaleLinear().range([vis.HEIGHT, 0])

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1)
        }
        vis.yAxisCall = d3.axisLeft()
            .ticks(4)
            .tickFormat(customTickFormat);

        vis.xAxisCall = d3.axisBottom()
            .tickFormat(d => "" + capitalizeFirstLetter(d))

        vis.xAxis = vis.g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`)

        vis.yAxis = vis.g.append("g")
            .attr("class", "y axis")

        vis.g.append("text")
            .attr("class", "title")
            .attr("y", -15)
            .attr("x", -50)
            .attr("font-size", "12px")
            .attr("text-anchor", "start")
            .text(vis.title)

        vis.t = d3.transition().duration(200)

        //Create tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        vis.wrangleData()
    }
    wrangleData() {
        const vis = this
        vis.new_variable = vis.variable + vis.variableMap[$("#select-vaccine-data").val()]
        vis.sorting = $("#sort-vaccine").val()
        vis.group = parseInt($("#top-selector").val())
        vis.vaccineData = d3.nest()
            .key(d => d.iso_code)
            .rollup(function (d) {
                var new_row = {}
                new_row[vis.new_variable] = d3.sum(d, data => data[vis.new_variable])
                return new_row;
            })
            .entries(barData)
            .map(function (data) {
                var d = {}
                d.iso_code = data.key
                d.dose = data.value[vis.new_variable]
                return d
            })
        if (vis.sorting == 'maxmin') { vis.vaccineData.sort(function (a, b) { return b.dose - a.dose; }); }
        else { vis.vaccineData.sort(function (a, b) { return a.dose - b.dose; }); }

        vis.vaccineData = vis.vaccineData.filter(function (d, i) {
            if (i < vis.group && i > vis.group - 21) {
                return d
            }
        })

        vis.updateVis()
    }
    updateVis() {
        const vis = this

        // update scales
        vis.y.domain([0, d3.max(vis.vaccineData, d => Number(d.dose))])
        vis.x.domain(vis.vaccineData.map(function (d) { return d.iso_code; }));

        // update axes
        vis.xAxisCall.scale(vis.x)
        vis.xAxis.transition(vis.t)
            .call(vis.xAxisCall)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-1em")
            .attr("dy", "-0.5em")
            .attr("transform", "rotate(-90)");

        vis.yAxisCall.scale(vis.y)
        vis.yAxis.transition(vis.t).call(vis.yAxisCall)

        vis.rect = vis.g.selectAll("rect").data(vis.vaccineData)

        vis.rect.exit().remove()
            .attr("x", function (d) {
                return vis.x(d.iso_code);
            })
            .attr("y", function (d) {
                return vis.y(Number(d.dose));
            })
            .attr("width", vis.x.bandwidth())
            .attr("height", function (d) {
                return vis.HEIGHT - vis.y(Number(d.dose));
            })
            .style("fill", vis.barColor)

        vis.rect.enter().append("rect")
            .merge(vis.rect)
            .transition(vis.t)
            .attr("x", function (d) {
                return vis.x(d.iso_code);
            })
            .attr("y", function (d) {
                return vis.y(d.dose);
            })
            .attr("width", vis.x.bandwidth())
            .attr("height", function (d) {
                return vis.HEIGHT - vis.y(d.dose);
            })
            .style("fill", vis.barColor);

        vis.g.selectAll("rect").on("mouseover", function (d) {
            vis.tooltip.transition().duration(100).style("opacity", .9);
            vis.tooltip.html(
                "<h3> Country - " + iso_map[d.iso_code] + "</h3>"
                + "<p> Dose : " + customTickFormat(d.dose) + "</p>"
            )
            vis.tooltip.style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 20) + "px")
                .on("mouseout", function (d) {
                    vis.tooltip.transition().duration(100)
                        .style("opacity", 0);
                });
        }).on("mouseout", function (d) {
            vis.tooltip.transition().duration(100)
                .style("opacity", 0);
        });
    }
}
