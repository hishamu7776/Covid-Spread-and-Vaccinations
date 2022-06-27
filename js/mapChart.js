/*
*   Choropleth Map
*   Hisham Unniyankal
*   S5049651
*   Universita di Genova
*   Data Visualization Project
*/
class MapChart {
    constructor(_parentElement) {
        this.parentElement = _parentElement
        this.initVis()
    }
    initVis() {
        const vis = this
        vis.MARGIN = { TOP: 0, RIGHT: 200, BOTTOM: 0, LEFT: 0 };
        vis.WIDTH = 1100 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 450 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM
        vis.headings = {
            case_per_date: 'Total Cases',
            case_per_million: 'Total Case (per million)',
            death_per_date: 'Total Deaths',
            death_per_million: 'Total Death (per million)'
        }

        vis.titles = {
            case: 'Total covid cases reported',
            case_million: 'Covid cases per million people',
            death: 'Total deaths reported due to covid',
            death_million: 'Deaths reported per million people'
        }


        vis.ranges = {
            case_per_date: [3000, 30000, 300000, 3000000, 10000000, 50000000, 100000000],
            case_per_million: [1000, 5000, 10000, 50000, 100000, 200000, 300000],
            death_per_date: [1000, 5000, 10000, 50000, 100000, 500000, 1100000],
            death_per_million: [10, 50, 100, 500, 1000, 5000, 10000]
        }

        vis.variables = {
            case: 'case_per_date',
            case_million: 'case_per_million',
            death: 'death_per_date',
            death_million: 'death_per_million'
        }
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
            .attr("fill", "#eee")
            .on("click", function (d) {
                vis.clicked(d)
                clearCountryFilters(d)
            })
        //Add g to svg
        vis.g = vis.svg.append('g').attr('class', 'map_svg');

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
        vis.t = d3.transition().duration(1000)
        // Legend
        vis.legend = d3.select(".map_legend_container")
            .append('svg')
            .attr('width', 200)
            .attr('height', 300)
            .append("g")
            .attr("id", "maplegend");

        vis.legend_heading = vis.legend
            .append("text")
            .attr("class", "legend_heading")
            .attr("x", 10)
            .attr("y", 20)
            .attr("fill", "#666")


        vis.legend_x = d3.scaleLinear()
            .domain([2.6, 75.1])
            .rangeRound([600, 860]);
            
        vis.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function() {
            d3.selectAll('.country')
            .attr('transform', d3.event.transform);
      });
      vis.svg.call(vis.zoom)
      vis.wrangleData()
    }

    wrangleData() {
        const vis = this

        vis.geoMap = mapData
        vis.variable = vis.variables[$("#select-data").val()]
        vis.mapValueData = {}
        var max_val = 0
        caseValueData.forEach(function (d) {
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
            .range(["#eff3ff","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"]);

        vis.mapplot = vis.g.selectAll(".country").data(vis.geoMap.features)

        vis.mapplot.exit().remove()
            .attr("d", vis.projection)
            .attr("class", "country")
            .attr("data-name", function (d) { return d.properties.name })
            .attr("fill", function (d) { d.total = vis.mapValueData[d.id] || 0;
                if (d.total == 0) {
                    return "#FFF"
                }
                return vis.colorScale(d.total);
            })
            .attr("stroke", "#333")
            .attr("stroke-width", "0.5")
            .attr("id", function (d) {
                return d.id
            })
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
                    .style("opacity", .9);
                vis.tooltip.html(
                    "<h3> Country : " + d.properties.name + "</h3>"
                    + "<p>" + vis.headings[vis.variable] + " : " + customTickFormat(d.total) + "</p>"
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
                clearCountryFilters()
                vis.filter_country_list = []
                for (const key in vis.mapValueData) {
                    if (key != d.id) {
                        vis.filter_country_list.push(key)
                    }
                }
                filterByCountry(vis.filter_country_list)
            });
        

        vis.mapplot.enter().append("path")
            .merge(vis.mapplot)
            .attr("d", vis.projection)
            .attr("class", "country")
            .attr("data-name", function (d) {
                return d.properties.name
            })
            .attr("fill", function (d) {
                d.total = vis.mapValueData[d.id] || 0;
                if (d.total == 0) {
                    return "#FFF"
                }
                return vis.colorScale(d.total);
            })
            .attr("stroke", "#333")
            .attr("stroke-width", "0.5")
            .attr("id", function (d) {
                return d.id
            })
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
                    .style("opacity", .9);
                vis.tooltip.html(
                    "<h3> Country : " + d.properties.name + "</h3>"
                    + "<p>" + vis.headings[vis.variable] + " : " + customTickFormat(d.total) + "</p>"
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
                vis.clicked(d)
                clearCountryFilters()
                vis.filter_country_list = []
                for (const key in vis.mapValueData) {
                    if (key != d.id) {
                        vis.filter_country_list.push(key)
                    }
                }
                filterByCountry(vis.filter_country_list)
            });

        vis.addLegend()
    }

    addLegend() {
        const vis = this

        const ls_w = 25;
        const ls_h = 25;
        //Rectangular
        vis.legend_box = vis.legend.selectAll("rect")
            .data(vis.colorScale.range().map(function (d) {
                d = vis.colorScale.invertExtent(d);
                if (d[0] == null) d[0] = vis.legend_x.domain()[0];
                if (d[1] == null) d[1] = vis.legend_x.domain()[1];
                return d;
            }))

        vis.legend_box.exit().remove()
            .attr("y", function (d, i) { return 200 - (i * ls_h); })
            .attr("width", ls_w)
            .attr("height", ls_h)
            .attr("cursor", "pointer")
            .style("fill", function (d) { return vis.colorScale(d[0]); })
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
            }).on('click', function (d) {
                clearCountryFilters()
                vis.filter_country_list = []
                caseMapRect = d[1].toString()
                for (const key in vis.mapValueData) {
                    if (!(vis.mapValueData[key] >= d[0] && vis.mapValueData[key] <= d[1])) {
                        vis.filter_country_list.push(key)
                    }
                }

                filterByCountry(vis.filter_country_list)
            });

        vis.legend_box.enter().append("rect")
            .merge(vis.legend_box)
            .attr("x", 10)
            .attr("y", function (d, i) { return 200 - (i * ls_h); })
            .attr("width", ls_w)
            .attr("height", ls_h)
            .attr("cursor", "pointer")
            .style("fill", function (d) { return vis.colorScale(d[0]); })
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
            }).on('click', function (d) {
                clearCountryFilters()
                vis.filter_country_list = []
                caseMapRect = d[1].toString()
                for (const key in vis.mapValueData) {
                    if (!(vis.mapValueData[key] >= d[0] && vis.mapValueData[key] <= d[1])) {
                        vis.filter_country_list.push(key)
                    }
                }

                filterByCountry(vis.filter_country_list)
            });


        //text
        vis.legend_text = vis.legend.selectAll(".legend_text")
            .data(vis.colorScale.range().map(function (d, i) {
                d = vis.colorScale.invertExtent(d);
                if (i == 0) {
                    return '< ' + customTickFormat(d[1])
                }
                else if (i == 6) {
                    return '> ' + customTickFormat(d[0])
                }
                return customTickFormat(d[0]) + ' - ' + customTickFormat(d[1]);
            }))

        vis.legend_text.exit().remove()
            .attr("x", 40)
            .attr("y", function (d, i) {
                return 215 - (i * ls_h);
            })
            .attr("font-size", ".9em")
            .text(function (d, i) {
                return d
            });

        vis.legend_text.enter().append("text")
            .merge(vis.legend_text)
            .attr("class", "legend_text")
            .attr("x", 40)
            .attr("y", function (d, i) { return 215 - (i * ls_h); })
            .attr("font-size", ".9em")
            .text(function (d, i) {
                return d;
            });

        vis.legend_heading.text(vis.headings[vis.variable]);
    }
    clicked(d){
        const vis = this

        var x, y, k;

  if (d && centered !== d) {
    var centroid = vis.projection.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = vis.WIDTH / 2;
    y = vis.HEIGHT / 2;
    k = 1;
    centered = null;
  }

  vis.g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  vis.g.transition(vis.t)
      .attr("transform", "translate(" + vis.WIDTH / 2 + "," + vis.HEIGHT / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
    }
 
}

