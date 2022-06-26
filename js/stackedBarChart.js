class StackedBarChart {
    constructor(_parentElement) {
        this.parentElement = _parentElement
        this.initVis()
    }
    initVis() {
        const vis = this
        //Setting Layout
        vis.MARGIN = { LEFT: 40, RIGHT: 20, TOP: 20, BOTTOM: 30 }
        vis.WIDTH = 600 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT
        vis.HEIGHT = 900 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM
        vis.variableMap = {
            'total_vaccinated_per_million': 'per_million',
            'total_vaccinated': 'full_data'
        }

        vis.columns = {
            'per_million': ['partially_vaccinated_per_million', 'fully_vaccinated_per_million', 'booster_per_million', 'complete_per_million'],
            'full_data': ['first_dose', 'last_dose', 'booster_dose', 'complete_vaccinations']
        }
        vis.keys = ['first_dose', 'last_dose', 'booster_dose']
        vis.y = d3.scaleBand()
            .rangeRound([0, vis.HEIGHT])
            .paddingInner(0.05)
            .align(0.1);
        vis.x = d3.scaleLinear()
            .rangeRound([0, vis.WIDTH]);
        vis.color = d3.scaleOrdinal().range(d3.schemeCategory10);

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
        vis.wrangleData()
    }
    wrangleData() {
        const vis = this
        vis.variable = 'per_million'
        vis.vaccineData = d3.nest()
            .key(d => d.location)
            .rollup(function (d) {
                var new_row = {}
                new_row['first_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][0]])
                new_row['second_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][1]])
                new_row['booster_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][2]])
                new_row['total_dose'] = d3.sum(d, data => data[vis.columns[vis.variable][3]])
                return new_row;
            })
            .entries(barData)
            .map(function (data) {
                var d = {}
                d.location = data.key
                d.first_dose = data.value.first_dose
                d.second_dose = data.value.second_dose
                d.booster_dose = data.value.booster_dose
                d.total_dose = data.value.total_dose
                return d
            })

        vis.vaccineData.sort(function (a, b) { return b.total_dose - a.total_dose; });

        vis.updateVis()
    }
    updateVis() {
        const vis = this
        vis.stack = d3.stack().keys(vis.keys)(vis.vaccineData)
        vis.y.domain(this.vaccineData.map(function (d) { return d.location; }));
        vis.x.domain([0, d3.max(vis.vaccineData, function (d) { return d.total_dose; })]).nice();
        vis.yAxis.scale(vis.y)
        vis.xAxis.scale(vis.x)

        vis.svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        vis.stackedBar

    }
}