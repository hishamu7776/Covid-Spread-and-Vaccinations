class PackLayout {
    constructor(_parentElement) {
        this.parentElement = _parentElement
        this.initVis()
    }
    initVis() {
        const vis = this
        vis.variableMap = {
            'total_vaccinated_per_million': 'total_vaccinations_per_million',
            'total_vaccinated': 'total_vaccinations'
        }
        vis.heading = {
            'total_vaccinations_per_million': 'Total Vaccinations Per Million',
            'total_vaccinations': 'Total Vaccinations'
        }
        //Setting Layout
        vis.MARGIN = { LEFT: 10, RIGHT: 10, TOP: 10, BOTTOM: 10 }
        vis.WIDTH = 500 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 500 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM
        vis.x = d3.scaleTime().range([0, vis.WIDTH])
        vis.y = d3.scaleLinear().range([0, vis.HEIGHT])
        //For transition
        vis.t = d3.transition().duration(500)

        //Create tooltip
        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //Create SVG
        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)
            .append("g")
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)

        //Color Scale
        vis.color = d3.scaleOrdinal()
            .domain([-1, 3])            
            .range(["#ff9da7","#9c755f","#bab0ab"])

        //Create pack
        vis.pack = d3.pack().size([vis.WIDTH, vis.HEIGHT]).padding(2);


        vis.wrangleData()
    }
    wrangleData() {
        const vis = this
        vis.variable = vis.variableMap[$("#select-vaccine-data").val()]
        vis.vaccineData = {}
        vis.vaccineData['name'] = 'world'
        vis.vaccineData['children'] = d3.nest()
            .key(d => d.continent)
            .key(d => d.location)
            .rollup(function (d) {
                return d3.sum(d, function (d) {
                    return d[vis.variable]
                })
            })
            .entries(packData)
            .map(function (group) {
                var new_group = group.values.map(function (d) {
                    return {
                        name: d.key,
                        value: d.value
                    }
                })
                return {
                    name: group.key,
                    children: new_group
                }
            })
        vis.updateVis()
    }
    updateVis() {
        const vis = this
        vis.root = d3.hierarchy(vis.vaccineData)
            .sum(d => d.value)
            .sort(function (a, b) { return b.value - a.value; });

        vis.focus = vis.root

        vis.nodes = vis.pack(vis.root).descendants()

        vis.view;


        vis.circles = vis.svg.append("g").selectAll("circle")
            .data(vis.nodes)
            .join("circle")
            .style("fill", function (d) { return vis.color(d.depth); })
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; })



        vis.events = vis.circles.on("mouseover", function (d) {
            vis.tooltip.transition().duration(200).style("opacity", .7);
            if (d.children == undefined) {
                vis.tooltip.html(
                    "<h3>" + vis.heading[vis.variable] + "</h3>"
                    + "<p> Country : " + d.data.name + "</p>"
                    + "<p> Continent : " + d.parent.data.name + "</p>"
                    + "<p>" + "Value : " + customTickFormat(d.value) + "</p>"
                )
            } else if (d.parent == null) {
                vis.tooltip.html(
                    "<h3>" + vis.heading[vis.variable] + "</h3>"
                    + "<p>" + "Value : " + customTickFormat(d.value) + "</p>"
                )
            } else {
                vis.tooltip.html(
                    "<h3>" + vis.heading[vis.variable] + "</h3>"
                    + "<p> Continent : " + d.data.name + "</p>"
                    + "<p>" + "Value : " + customTickFormat(d.value) + "</p>"
                )
            }
            vis.tooltip.style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 20) + "px")
        })
            .on("mouseout", function (d) {
                vis.tooltip.transition(vis.t)
                    .duration(200)
                    .style("opacity", 0);
            })
            .on("click", function (d) { if (vis.focus !== d) vis.zoom(d), d3.event.stopPropagation(); })
            .transition().duration(400)
            .attr('r', function (d) { return d.r; })
        
        vis.svg.on("click", function (d, i) {
            vis.zoom(d)
        });

    }
    zoom(d) {
        const vis = this

        var k = vis.WIDTH / d.r / 2;
        vis.x.domain([d.x - d.r, d.x + d.r]);
        vis.y.domain([d.y - d.r, d.y + d.r]);

        var transition = vis.svg.transition()
            .duration(d3.event.altKey ? 7500 : 750);

        transition.selectAll("circle")
            .attr("cx", function (d) {
                return vis.x(d.x);
            })
            .attr("cy", function (d) {
                return vis.y(d.y);
            })
            .attr("r", function (d) {
                return k * d.r;
            });

        vis.focus = d;
        d3.event.stopPropagation();
    }
}