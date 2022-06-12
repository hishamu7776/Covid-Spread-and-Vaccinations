class MapChart {
    constructor(_parentElement) {
        this.parentElement = _parentElement
        this.initVis()
    }
    initVis() {
        const vis = this
        vis.MARGIN = { TOP: 0, RIGHT: 0, BOTTOM: 0, LEFT: 0 };
        vis.WIDTH = 960 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 500 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM
        vis.headings = { case_per_date: 'Total Cases', case_per_million: 'Total Case (per million)' }
        vis.ranges = { case_per_date: [3000, 30000, 300000, 3000000, 10000000, 50000000, 100000000], case_per_million: [1000, 5000, 10000, 50000, 100000, 200000, 300000] }

        //Create SVG
        vis.svg = d3.select(vis.parentElement)
            .append('svg')
            .attr('width', vis.WIDTH)
            .attr('height', vis.HEIGHT)


        // Add clickable background
        vis.rect = vis.svg.append("rect")
            .attr("class", "map_background")
            .attr("width", vis.WIDTH)
            .attr("height", vis.HEIGHT)
            .attr("fill", "#fff")
            .on("click", function (d) {
                clearFilters(d)
            })


        //Create tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //Adding color scale for map
        vis.colorScale = d3.scaleThreshold();

        //Initialize projection
        vis.projection = d3.geoPath()
            .projection(
                d3.geoRobinson()
                    .translate([vis.WIDTH / 2, vis.HEIGHT / 2])
                    .scale(130)
            )

        // Legend
        vis.legend = vis.svg.append("g")
            .attr("id", "maplegend");

        vis.legend_heading = vis.legend
            .append("text")
            .attr("class", "legend_heading")
            .attr("x", 15)
            .attr("y", 280)

        vis.legend_x = d3.scaleLinear()
            .domain([2.6, 75.1])
            .rangeRound([600, 860]);

        vis.wrangleData()
    }

    wrangleData() {
        const vis = this

        vis.geoMap = mapData
        vis.variable = $("#select-data").val()
        vis.mapValueData = {}
        var max_val = 0
        mapValueData.forEach(function (d) {
            if (vis.mapValueData[d.iso_code] == undefined) {
                vis.mapValueData[d.iso_code] = d[vis.variable]
            } else {
                vis.mapValueData[d.iso_code] = vis.mapValueData[d.iso_code] + d[vis.variable]
            }
            if (vis.mapValueData[d.iso_code] > max_val) {
                max_val = vis.mapValueData[d.iso_code]
            }
        })
        vis.updateVis()
    }

    updateVis() {
        const vis = this

        vis.colorScale.domain(vis.ranges[vis.variable])
            .range(d3.schemeReds[7]);
        //Add g to svg
        vis.g = vis.svg.append('g')
            .attr('class', 'map_svg');
        vis.g.selectAll("path").remove()
        vis.mapEvents = vis.g.selectAll("path")
            .data(vis.geoMap.features)
            .enter()
            .append("path")
            .attr("d", vis.projection)
            .attr("class", "country")
            .attr("data-name", function (d) {
                return d.properties.name
            })
            .attr("fill", function (d) {
                d.total = vis.mapValueData[d.id] || 0;
                if (d.total == 0) {
                    return "#ddd"
                }
                return vis.colorScale(d.total);
            })
            .attr("stroke", "#333")
            .attr("stroke-width", "0.5")
            .attr("id", function (d) {
                return d.id
            })
        vis.mapEvents
            .on("mouseover", function (d) {
                d3.selectAll(".country")
                    .transition()
                    .duration(100)
                    .style("stroke-width", "0.5");

                d3.select(this)
                    .transition()
                    .duration(100)
                    .style("opacity", 1)
                    .style("stroke-width", "2");

                vis.tooltip.transition()
                    .duration(150)
                    .style("opacity", 1);
                vis.tooltip.html(
                    "<h3> Country : " + d.properties.name + "</h3>"
                    + "<p>" + vis.headings[vis.variable] + " : " + d.total + "</p>"
                )
                vis.tooltip.style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY - 20) + "px")
            })
            .on("mouseleave", function (d) {
                d3.selectAll(".country")
                    .transition()
                    .duration(100)
                    .style("opacity", 1)
                    .style("stroke-width", "0.5");
                vis.tooltip.transition().duration(200)
                    .style("opacity", 0);
            })
            .on("click", function (d) {

                for (const key in vis.mapValueData) {
                    if (key != d.id) {
                        filter_country_list.push(key)
                    }
                }
                filterByCountry([d.id])
            });
        vis.addLegend()
    }

    addLegend() {
        const vis = this

        const ls_w = 25;
        const ls_h = 25;

        d3.selectAll(".legend_entry").remove();
        vis.legend_entry = vis.legend.selectAll("#maplegend")
            .data(vis.colorScale.range().map(function (d) {
                d = vis.colorScale.invertExtent(d);
                if (d[0] == null) d[0] = vis.legend_x.domain()[0];
                if (d[1] == null) d[1] = vis.legend_x.domain()[1];
                return d;
            }))
            .enter().append("g")
            .attr("class", "legend_entry");

        vis.rect = vis.legend_entry.append("rect")
            .attr("x", 20)
            .attr("y", function (d, i) {
                return vis.HEIGHT - (i * ls_h) - 2 * ls_h;
            })
            .attr("id", function (d) {
                return d[1].toString()
            })
            .attr("width", ls_w)
            .attr("height", ls_h)
            .attr("opacity", .8)
            .attr("cursor", "pointer")
            .style("fill", function (d) {
                return vis.colorScale(d[0]);
            })
            .style("opacity", function (d) {
                if (caseMapRect == d[1].toString()) {
                    return 1;
                } else {
                    return .6;
                }
            })
            .style("stroke", function (d) {
                if (caseMapRect == d[1].toString()) {
                    return "#000";
                } else {
                    return "#FFF";
                }
            })
            .style("stroke-width", function (d) {
                if (caseMapRect == d[1].toString()) {
                    return 1;
                } else {
                    return .5;
                }
            })
            .on('click', function (d) {
                caseMapRect = d[1].toString()
                for (const key in vis.mapValueData) {
                    if (!(vis.mapValueData[key] >= d[0] && vis.mapValueData[key] <= d[1])) {
                        filter_country_list.push(key)
                    }
                }
                filterByCountry()
            });


        vis.text = vis.legend_entry.append("text")
            .attr("x", 50)
            .attr("y", function (d, i) {
                return vis.HEIGHT - (i * ls_h) - ls_h - 6;
            })
            .attr("font-size", ".9em")
            .text(function (d, i) {
                if (i === 0) return "< " + d[1] / 1000 + " k";
                if (d[1] < d[0]) return d[0] / 1000 + " k +";
                return d[0] / 1000 + " k - " + d[1] / 1000 + " k";
            });


        vis.legend_heading.text(vis.headings[vis.variable]);
    }
}



