

const popLine = new Chart(
    document.getElementById('pop-line').getContext('2d'),
    {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks:{
                        font:{size:10}
                    }
                },
                x:{
                    ticks:{
                        font:{size:6},
                        minRotation: 50,
                        maxRotation: 50,
                        sampleSize: 1
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            borderWidth: 0.5,
            fill: true,
            plugins:{
                legend:{display:false},
                decimation:{enabled:true}
            },
            elements:{
                point:{radius:0}
            }
        }
    }
)

popLine.update()


var propBars = {}
function createPropBars(){
    let dom = document.getElementById('prop-bars-container');
    for(let f of propNames){
        // console.log(f)
        dom.innerHTML += 
            `
                <div class="col l12 xl6 bord prop-bar">
                    <canvas id="prop-bar-${f}" width="100" height="20"></canvas>
                </div>
            `
    }

    for(let f of propNames){
        let ctx = document.getElementById(`prop-bar-${f}`).getContext('2d');
        propBars[f] = new Chart(
            ctx,
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label:(f!='gps') ? caps(f) : capsAll(f),
                        data: [], 
                        borderWidth: 1,

                        parsing: false,
                        normalized: true
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    animation: false,
                    fill: true,
                    plugins:{
                        legend:{
                            labels:{
                                font:{size:10},
                                boxWidth: 10,
                                boxHeight: 10
                            }
                        }
                    },
                    scales:{
                        y:{
                            beginAtZero: true,
                            suggestedMax: 20,
                            ticks:{
                                font:{size:9}
                            }
                        },
                        x:{
                            ticks:{
                                font:{size: 8}
                            }
                        }
                    }
                }
            }
        )
        propBars[f].update()
    }
}

createPropBars()

var trendCharts = {}
var allTrends;
function createTrendCharts(){
    let dom = document.getElementById('prop-trends-container');
    let chartPrompts = propNames.concat(...['age'])
    for(let f of chartPrompts){
        // console.log(f)
        dom.innerHTML += 
            `
                <div class="col l12 xl4 trend-graph">
                    <canvas id="trend-graph-${f}" width="140" height="40"></canvas>
                </div>
            `
    }
    for(let f of chartPrompts){
        let ctx = document.getElementById(`trend-graph-${f}`).getContext('2d');
        trendCharts[f] = {
            cur_mean: {},
            chart: new Chart(
                ctx,
                {
                    type: 'line',
                    data:{
                        labels:[],
                        datasets:[]
                    },
                    options:{
                        scales:{
                            y:{
                                suggestedMin:4,
                                suggestedMax:7,
                                ticks:{
                                    // steps:4,
                                    stepSize:0.1,
                                    // maxTicksLimit: 4
                                }
                            }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        borderWidth: 0.6,
                        plugins:{
                            legend:{
                                labels:{
                                    font:{size:10},
                                    boxWidth: 10,
                                    boxHeight: 10
                                }
                            },
                            subtitle: {
                                display: true,
                                text: (f!='gps') ? caps(f) : capsAll(f),
                            },
                            decimation:{enabled:true},
                            annotation: {
                                annotations: {}
                              }
                        },
                        elements:{
                            point:{radius:0.1}
                        }
                    }
                }
            )
        }
    }

    allTrends = new Chart(
        document.getElementById('all-trends-graph').getContext('2d'),
        {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                maintainAspectRatio: false,
                animation: false,
                borderWidth: 1,
                // fill: true,
                plugins:{
                    // legend:{display:false},
                    decimation:{enabled:true}
                },
                elements:{
                    point:{radius:1}
                }
            }
        }
    )
}

createTrendCharts()
function updateTrends(){
    for(let f in trendCharts) {
        
        // if(trendCharts[f].chart.data.datasets[i].hidden) continue;
        let arr = trendCharts[f].chart.data.datasets[0].data
        let startIndex = Math.max(Math.floor(2*arr.length/3), Math.max(0,arr.length-100))

        let meanArr = arr.filter(x=>!isNaN(x)).slice(startIndex)
        let mean = meanArr.reduce((acc,cur)=>acc+cur, 0) / (arr.length-startIndex)

        trendCharts[f].chart.options.plugins.annotation.annotations['overall'].yMin = mean
        trendCharts[f].chart.options.plugins.annotation.annotations['overall'].yMax = mean
    
        trendCharts[f].chart.update();
    }
    allTrends.update();
}