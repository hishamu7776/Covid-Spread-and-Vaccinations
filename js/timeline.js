/*
*    timeline.js
*    Mastering Data Visualization with D3.js
*    Project 4 - FreedomCorp Dashboard
*/

class Timeline {
    constructor(_parentElement) {
        this.parentElement = _parentElement

        this.initVis()
    }

    initVis() {
        const vis = this

        vis.MARGIN = { LEFT: 20, RIGHT: 20, TOP: 20, BOTTOM: 20 }
        vis.WIDTH = 1100 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 200 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM

        // scales
        vis.x = d3.scaleTime().range([0, vis.WIDTH])
        vis.y = d3.scaleLinear().range([vis.HEIGHT, 0])




        vis.svg = d3.select(vis.parentElement).append("svg")
            .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
            .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM)

        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`)

        vis.variables = {
            case: 'total_cases',
            case_million: 'total_cases_million',
            death: 'total_deaths',
            death_million: 'total_death_million'
        }

        // x-axis
        vis.xAxisCall = d3.axisBottom()
            .ticks(5)
        vis.xAxis = vis.g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0, ${vis.HEIGHT})`)

        vis.areaPath = vis.g.append("path")
        // area path generator
        vis.area = d3.area()
            .x(d => vis.x(xParseTime(d.date)))
            .y0(function(d){
                //console.log(d.date,vis.HEIGHT,vis.y(d.sum))
                return vis.HEIGHT
            })
            .y1(function (d) { return vis.y(d.sum) })

        // initialize brush component
        vis.brush = d3.brushX()
            .handleSize(10)
            .extent([[0, 0], [vis.WIDTH, vis.HEIGHT]])
            .on("brush end", brushed)

        // append brush component
        vis.brushComponent = vis.g.append("g")
            .attr("class", "brush")
            .call(vis.brush)

        vis.wrangleData()
    }

    wrangleData() {
        const vis = this

        vis.variable = vis.variables[$("#select-data").val()]

        const dayNest = d3.nest()
            .key(d => d.date)
            .entries(timelineValueData)

        vis.dataFiltered = dayNest
            .map(day => {
                return {
                    date: day.key,
                    sum: d3.sum(day.values, function(d){ return d[vis.variable] })
                }
            })
        vis.dataFiltered = vis.dataFiltered.sort(function (a, b) { return xParseTime(a.date) - xParseTime(b.date); });
        vis.updateVis()
    }

    updateVis() {
        const vis = this
        
        vis.t = d3.transition().duration(750)
        // update scales
        vis.x.domain(d3.extent(vis.dataFiltered, d => xParseTime(d.date)))
        vis.y.domain([0, d3.max(vis.dataFiltered, d => d.sum)])

        // update axes
        vis.xAxisCall.scale(vis.x)

        vis.xAxis.transition(vis.t).call(vis.xAxisCall)

        vis.areaPath
            .datum(vis.dataFiltered)
            .attr("class", "timeline_area")
            .attr("d", vis.area)
            .style("stroke", "#e15759")
            .style("stroke-width", "2px")
            .style("fill", "#f28e2c")

    }
}

