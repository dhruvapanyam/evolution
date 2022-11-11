var topsec = document.getElementById('top-section-div')
var botsec = document.getElementById('bottom-section')
// var sidesec = document.getElementById('side-section')
let topsec_ht = 0.7
topsec.style.height = String(window.innerHeight * topsec_ht)+'px'
// botsec.style.marginTop = String(window.innerHeight * 0.4)+'px'
botsec.style.height = String(window.innerHeight * 0.25)+'px'

window.addEventListener('resize',e=>{
    topsec.style.height = String(window.innerHeight * topsec_ht)+'px'
    botsec.style.height = String(window.innerHeight * 0.25)+'px'
    // world.width = window.innerHeight * world_ht
    // world.height = world.width
})


const sumChart = document.getElementById('summary-chart').getContext('2d')
// sumChart.fillRect(0,0,document.getElementById('summary-chart').width,document.getElementById('summary-chart').height)

const sumbar = new Chart(sumChart, {
    type:'bar',
    data: {
        labels: [],
        datasets:[]
    },
    options: {
        plugins: {
            title: {
                display: true,
                text: 'Preset Init Summary'
            }
        },
        yAxes: [{
            ticks: {
              min: 0,
              max: 1,
        
              // forces step size to be 5 units
              stepSize: 0.1 // <----- This prop sets the stepSize
            }
          }]
    }
})

sumbar.data.labels = Object.keys(features)
sumbar.update()




let propNames = ['speed','stamina','vision','gps','greed']

var geneId = 0
var tempGeneData = []
var activeGeneImg = 0
const maxTokens = 30;

let tcols = ['rgba(223,135,97,0.4)','rgba(151,145,234,0.4)','rgba(57,176,93,0.4)','rgba(242,125,138,0.4)','rgba(99,158,222,0.4)']
let hue_rots = [0,230,460,690,920]

function createNewGene(){
    if(tempGeneData.filter(g=>g.active).length==5) return;
    let mod = document.getElementById('modal-imgs');
    mod.innerHTML += `<div id="gene-img-container-${tempGeneData.length}" style="float:left;margin-left:20px"><img id="gene-imgs-${tempGeneData.length}" src="media/spot.png" width="150px" style="
    filter: hue-rotate(${hue_rots[tempGeneData.length % 5]}deg);" onmousedown="selectGeneImg(${tempGeneData.length})"></div>`
    tempGeneData.push(
        {
            props:{}, 
            gname:'Gene'+(tempGeneData.length+1),
            init_pop:1,
            tokens_used: 0,
            active: true
        }
    )
    let n = tempGeneData.length-1;
    tempGeneData[n].col = n;
    createGeneStatsCol(n)
    selectGeneImg(n)

    popPie.data.labels.push(tempGeneData[n].gname)
    popPie.data.datasets[0].data.push(10)
    popPie.data.datasets[0].backgroundColor.push(changeOpacity(tcols[n%5],0.7))
    popPie.update()
    calculateInitPop()
}

function calculateInitPop(){
    let s = 0
    for(let i=0;i<tempGeneData.length;i++){
        s += tempGeneData[i].init_pop
    }

    for(let i=0;i<tempGeneData.length;i++){
        popPie.data.datasets[0].data[i] = Math.floor(tempGeneData[i].init_pop * 1000 / s)/10;
    }
    popPie.update()
}

function selectGeneImg(n){
    activeGeneImg = n;
    // console.log('new active gene:',n)
    for(let i=0;i<tempGeneData.length;i++){
        if(!tempGeneData[i].active) continue;
        document.getElementById('gene-imgs-'+i).width = (i==n) ? 140 : 110
        document.getElementById('gene-stats-'+i).style.display = (i==n) ? 'block' : 'none'
        document.getElementById('gene-info-'+i).style.display = (i==n) ? 'block' : 'none'
    }
}

function createGeneStatsCol(n){
    let d = document.getElementById('modal-stats-div')
    function _createInps(f,fname){
        let s = `
        
                <div class="row">
                    <div class="col s3" style="cursor:pointer;" id="prop-name-${f}-${n}" onclick="setMutation(${n},'${f}','${fname}')"><b>${fname}</b></div>
                    <div class="col s8">
                        <div class="input-circles input-circles-${n}" style="color:${tcols[n%5]};">
                            <i id="${f}-stat-inp-${n}-0" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',1)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-1" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',2)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-2" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',3)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-3" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',4)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-4" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',5)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-5" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',6)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-6" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',7)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-7" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',8)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-8" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',9)">fiber_manual_record</i>
                            <i id="${f}-stat-inp-${n}-9" class="material-icons input-circle" onmousedown="setGenePropScore(${n},'${f}',10)">fiber_manual_record</i>
                        </div>
                    </div>
                    <div class="col s1"><div id="${f}-stat-val-${n}">6</div></div>
                </div>
        `
        return s;

    }
    d.innerHTML += `
    
    <div id="gene-stats-${n}" style="display:none;">
                                    <div class="col s4 stats-col" style="border-right: 1px solid;">
                                        <div class="row" style="display: flex; justify-content: center;"><div>Locomotion</div></div>
                                        <div class="stats-col-inner">
                                            `+_createInps('speed','Speed')
                                            +_createInps('stamina','Stamina')
                                            +`
                                            
                                        </div>
                                    </div>
                                    <div class="col s4 stats-col" style="border-right: 1px solid;">
                                        <div class="row" style="display: flex; justify-content: center;"><div>Brain Power</div></div>
                                        <div class="stats-col-inner">
                                        `+_createInps('vision','Vision')
                                        +_createInps('gps','GPS')
                                        +`
                                        </div>
                                    </div>
                                    <div class="col s4 stats-col">
                                        <div class="row" style="display: flex; justify-content: center;"><div>Social skills</div></div>
                                        <div class="stats-col-inner">
                                            
                                        `+_createInps('greed','Greed')
                                        +`
                                        </div>
                                    </div>
                                </div>
    `
    

    let r = document.getElementById('gene-info-div');
    let colstr = ``
    for(let i=0;i<5;i++){
        colstr += `
            <div id="${n}-color-choice-${i}" class="square" style="background-color:${changeOpacity(tcols[i%5],1)}" onclick="setGeneColor(${n},${i})"></div>
        `
    }
    r.innerHTML += `
    <div id="gene-info-${n}">
        <div class="col s4" style="padding-left: 4%;">
            <div class="cent"><input oninput="changeGeneName(${n},this.value)" type="text" placeholder="Gene Name..."></div>
            <div class="cent">
                `+colstr+`
            </div>
        </div>
        <div class="col s4 cent">
            <div class="">
                Tokens left:&nbsp;&nbsp;<b id="tokens-left-${n}">30</b><br>
                Shelf Life:&nbsp;&nbsp;<b id="shelf-life-${n}">100</b>&nbsp;mins<br>
                Initial Ratio:&nbsp;&nbsp;<input oninput="setInitPop(${n},this.value)" style="width:40px" type="number" min=0 max=10 value=1>
            </div>
        </div>
        <div class="col s4 cent">
            <i class="material-icons tooltipped" data-html="true" data-position="left" 
            data-tooltip="
                info<br>
                > Stamina is not linearly calculated<br>
                > Unused tokens will be used to extend TTL<br>
                > Have fun
            " 
            style="font-size: 30px; color: lightgrey; cursor: pointer;">info</i>
            <i onclick="deleteGene(${n})" class="material-icons" style="font-size: 30px; color: grey; cursor: pointer;">delete</i>
        </div>
    </div>
    `


    for(let f of propNames){
        setGenePropScore(n,f,1)
    }

    setGeneColor(n,n)
}

function changeGeneName(n,v){
    tempGeneData[n].gname = v;
    popPie.data.labels[n] = v;
    popPie.update();
}

function setInitPop(n,v){
    tempGeneData[n].init_pop = parseInt(v);
    calculateInitPop()
}

function setGeneColor(n,c){
    tempGeneData[n].col = c;
    // console.log('setting',n,c)
    for(let i=0;i<5;i++){
        document.getElementById(`${n}-color-choice-${i}`).style.width = (i==c) ? '50px' : '40px'
        document.getElementById(`${n}-color-choice-${i}`).style.height = (i==c) ? '50px' : '40px'
    }
    popPie.data.datasets[0].backgroundColor[n] = changeOpacity(tcols[c%5],0.7)
    popPie.update()
    document.getElementById('gene-imgs-'+n).style.filter = `hue-rotate(${hue_rots[c%5]}deg)`
    for(let f of propNames){
        setGenePropScore(n,f,tempGeneData[n].props[f].value)
    }
}

function setMutation(n,f,fname){
    let v = !tempGeneData[n].props[f].mutation
    tempGeneData[n].props[f].mutation = v

    let d = document.getElementById(`prop-name-${f}-${n}`)
    d.style.color = v ? 'red' : 'black'
    if(v){
        d.innerHTML = fname.toUpperCase()
    }
    else{
        d.innerHTML = fname;
    }
}

function setGenePropScore(n,f,v){
    let usedTokens = 0
    for(let ff in tempGeneData[n].props){
        if(f==ff) continue
        console.log(ff,tempGeneData[n].props[ff])
        usedTokens += tempGeneData[n].props[ff].value
    }
    // tempGeneData[n].tokens_used = usedTokens;
    console.log(v,maxTokens,usedTokens)
    v = Math.min(v, maxTokens-usedTokens);
    if(f in tempGeneData[n].props)
        tempGeneData[n].props[f].value = v;
    else
        tempGeneData[n].props[f] = {value: v, mutation: false}

    for(let i=0;i<10;i++){
        document.getElementById(`${f}-stat-inp-${n}-${i}`).style.color = (i<v) ? changeOpacity(tcols[tempGeneData[n].col%5],0.9) : tcols[tempGeneData[n].col%5]
    }
    document.getElementById(`${f}-stat-val-${n}`).innerHTML = v
    let res = (maxTokens - usedTokens - v)
    document.getElementById(`tokens-left-${n}`).innerHTML = res
}

function deleteGene(n){
    tempGeneData[n].active = false;
    document.getElementById('gene-stats-'+n).remove()
    document.getElementById('gene-info-'+n).remove()
    document.getElementById('gene-img-container-'+n).remove()

    setInitPop(n,0)

    if(activeGeneImg == n){
        for(let i=0;i<tempGeneData.length;i++){
            if(tempGeneData[i].active){
                selectGeneImg(i)
                break;
            }
        }
    }
    // tempGeneData.splice(n,1);
    
    // if(activeGeneImg == n){
    //     // console.log('yes')
    //     selectGeneImg(tempGeneData.length-1)
    // }
}

const pop_pie = document.getElementById('gene-pop-pie')
pop_pie.style.width = '50px'
const popPie = new Chart(
    pop_pie,
    {
        type: 'doughnut',
        data: {
            labels: [],
            datasets:[{
                label:'Gene Population',
                data:[],
                backgroundColor:[],
                hoverOffset: 4
            }]
        },
        options: {
            plugins: {
                legend: {
                display: false
                },
                title: {
                    display: true,
                    text: 'Population Distribution (in %)\n'
                }
            }
        }
    }
);


function formatWorldGenes(genes){
    W.setGeneData(sumbar, genes.filter(g => g.active).map(g => {
        let props = {
            'pop': {
                value: g.init_pop,
                mutation_chance: 0
            }
        }
        for(let f in g.props){
            props[f] = {
                value: parseFloat(g.props[f].value) * features[f].max / 10,
                mutation_chance: (g.props[f].mutation) ? parseFloat(features[f].def_mut) : 0
            }
        }
        console.log(props)
        return {
            gname: g.gname,
            col: tcols[g.col % 5],
            props: props
        }
    }))
}

