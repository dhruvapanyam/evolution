

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
                        font:{size:6}
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            pointRadius: 0.2,
            borderWidth: 0.5,
            fill: true,
            plugins:{legend:{display:false}}
        }
    }
)

popLine.update()


var propBars = {}
function createPropBars(){
    let dom = document.getElementById('prop-bars-container');
    for(let f of propNames){
        console.log(f)
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
                    datasets: [{label:f, data: [], borderWidth: 1}]
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    animation: false,
                    fill: true,
                    scales:{
                        y:{
                            beginAtZero: true,
                            suggestedMax: 30
                        }
                    }
                }
            }
        )
        propBars[f].update()
    }
}

createPropBars()