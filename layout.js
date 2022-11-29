let propNames = ['speed','stamina','vision','gps','greed']

var geneId = -1
var tempGeneData = {}
var activeGeneImg = 0
const maxTokens = 30;

let gcols = {
    'orange':'rgb(223,135,97,1)',
    'blue':'rgb(64,170,216,1)',
    'green':'rgb(92,161,96,1)',
    'purple':'rgb(151,136,239,1)',
    'yellow':'rgb(208,168,41,1)',
    'pink':'rgb(231,132,161,1)',
    'grey':'rgb(154,154,154,1)',
}
var gcol_names = Object.keys(gcols)

// let tcols = ['rgba(223,135,97,0.4)','rgba(151,145,234,0.4)','rgba(57,176,93,0.4)','rgba(242,125,138,0.4)','rgba(99,158,222,0.4)']
// let hue_rots = [0,230,460,690,920]

function createNewGene(){

    if(Object.keys(tempGeneData).length == 5) return;

    geneId += 1;

    let mod = document.getElementById('modal-imgs');
    let col = gcol_names[geneId % gcol_names.length]
    mod.innerHTML += `<div 
                        id="gene-img-container-${geneId}" 
                        style="float:left;margin-left:20px"
                    >
                    <img 
                        id="gene-imgs-${geneId}" 
                        src="media/blobs/${col}.png" width="150px" 
                        onmousedown="selectGeneImg(${geneId})"></div>`
    tempGeneData[geneId] = 
        {
            props:{}, 
            gname:'Gene'+(geneId+1),
            init_pop:1,
            tokens_used: 0,
            active: true,
            col: col
        }
    
    console.log('Created new gene:',tempGeneData)
    createGeneStatsCol(geneId)
    selectGeneImg(geneId)

    popPie.data.labels.push(tempGeneData[geneId].gname)
    popPie.data.datasets[0].data.push(10)
    popPie.data.datasets[0].backgroundColor.push(changeOpacity(gcols[col],0.7))
    popPie.update()
    calculateInitPop()

    return geneId;
}

function calculateInitPop(){
    let s = 0
    for(let id in tempGeneData){
        s += tempGeneData[id].init_pop
    }

    let i=0;
    for(let id in tempGeneData){
        popPie.data.datasets[0].data[i] = Math.floor(tempGeneData[id].init_pop * 1000 / s)/10;
        i+=1
    }
    popPie.update()
}

function selectGeneImg(n){
    activeGeneImg = n;
    // console.log('new active gene:',n)
    for(let id in tempGeneData){
        if(!tempGeneData[id].active) continue;
        document.getElementById('gene-imgs-'+id).width = (id==n) ? 140 : 110
        document.getElementById('gene-stats-'+id).style.display = (id==n) ? 'block' : 'none'
        document.getElementById('gene-info-'+id).style.display = (id==n) ? 'block' : 'none'
    }
}

function createGeneStatsCol(n){
    let d = document.getElementById('modal-stats-div')
    function _createInps(f,fname){
        let s = `
        
                <div class="row">
                    <div class="col s4" style="cursor:pointer;" onclick="setMutation(${n},'${f}','${fname}')">
                    <div style="float:left;" class="prop-icon"><img class="icon-img" src="media/icons/${f}.png" width="25"></div>
                    <div style="float:left;" id="prop-name-${f}-${n}"><b>${fname}</b></div>
                    </div>
                    <div class="col s7">
                        <div class="input-circles input-circles-${n}" style="color:${gcols[tempGeneData[n].col]};">
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
    for(let i=0;i<gcol_names.length;i++){
        let col = gcol_names[i]
        colstr += `
            <div id="${n}-color-choice-${i}" class="square" style="background-color:${changeOpacity(gcols[col],1)}" onclick="setGeneColor(${n},'${col}')"></div>
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
                Shelf Life:&nbsp;&nbsp;<b id="shelf-life-${n}"></b>&nbsp;timex<br>
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
        setGenePropScore(n,f,6)
    }

    setGeneColor(n,tempGeneData[n].col)
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
    for(let i=0;i<gcol_names.length;i++){
        let temp = gcol_names[i]
        document.getElementById(`${n}-color-choice-${i}`).style.width = (temp==c) ? '40px' : '30px'
        document.getElementById(`${n}-color-choice-${i}`).style.height = (temp==c) ? '40px' : '30px'
    }
    document.getElementById(`gene-imgs-${n}`).src = `media/blobs/${c}.png`;
    popPie.data.datasets[0].backgroundColor[n] = changeOpacity(gcols[c],0.7)
    popPie.update()
    for(let f of propNames){
        setGenePropScore(n,f,tempGeneData[n].props[f].value)
    }
}

function setMutation(n,f,fname,mut=null){
    let v;
    if(mut == null)
        v = !tempGeneData[n].props[f].mutation
    else
        v = mut;
    tempGeneData[n].props[f].mutation = v

    // console.log(f,v)

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
        // console.log(ff,tempGeneData[n].props[ff])
        usedTokens += tempGeneData[n].props[ff].value
    }
    // tempGeneData[n].tokens_used = usedTokens;
    // console.log(v,maxTokens,usedTokens)
    v = Math.min(v, maxTokens-usedTokens);
    if(f in tempGeneData[n].props){
        if(tempGeneData[n].props[f].value == 1 && v == 1) v=0;
        tempGeneData[n].props[f].value = v;
    }
    else
        tempGeneData[n].props[f] = {value: v, mutation: false}

    let col = gcols[tempGeneData[n].col];
    for(let i=0;i<10;i++){
        document.getElementById(`${f}-stat-inp-${n}-${i}`).style.color = (i<v) ? changeOpacity(col,0.9) : changeOpacity(col,0.4)
    }
    document.getElementById(`${f}-stat-val-${n}`).innerHTML = v
    let res = (maxTokens - usedTokens - v)
    document.getElementById(`tokens-left-${n}`).innerHTML = res

    if(f == 'stamina'){
        document.getElementById(`shelf-life-${n}`).innerHTML = new Creature(null,new Vec(0,0),'',{stamina:{value:v,mutation_chance:0}},W.dim).init_ttl;
    }
}

function deleteGene(n){

    document.getElementById('gene-stats-'+n).remove()
    document.getElementById('gene-info-'+n).remove()
    document.getElementById('gene-img-container-'+n).remove()

    setInitPop(n,0)

    tempGeneData[n] = undefined;
    delete tempGeneData[n];

    if(activeGeneImg == n){
        if(Object.keys(tempGeneData).length)
            selectGeneImg(Object.keys(tempGeneData)[0])
    }
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
    let data = Object.keys(genes).map(gId => {
        let props = {}
        let g = tempGeneData[gId];
        for(let f in g.props){
            props[f] = {
                value: parseFloat(g.props[f].value),
                mutation_chance: (g.props[f].mutation) ? parseFloat(features[f].def_mut) : 0
            }
        }
        // console.log(props)
        return {
            name: g.gname,
            inUse: true,
            color: changeOpacity(gcols[g.col],0.6),
            img: `media/blob_draw/${g.col}.png`,
            colorName: g.col,
            props: props,
            pop: parseInt(g.init_pop)
        }
    })
    let gene_data = {}
    for(let g of data){
        gene_data[g.name] = g;
    }

    // console.log(gene_data)

    W.setGeneData(gene_data)
}

function showDominant(pop_stats){
    // propwise stats
    // pop_stats = {'5-5-5-5-5': 42, ...}
    // console.log(pop_stats, typeof pop_stats)
    // console.log('showing dominant')

    let fittest = Object.keys(pop_stats)
    fittest.sort((a,b) => (pop_stats[b] - pop_stats[a]))
    fittest = fittest.map(p => [p,pop_stats[p]])

    let tot = 0;
    for(let f of fittest) tot += f[1]
    // alert(JSON.stringify(fittest))
    // console.log(Object.keys(pop_stats))

    let rank = 0;
    while(rank < 3){
        rank += 1
        let fx = document.getElementById(`fittest-${rank}`);
        let i = rank-1;

        if(i >= fittest.length){
            fx.innerHTML = ''
            fx.style.height = document.getElementById('fittest-1').style.height
            return;
        }
        // alert(fittest[i])
        let p = fittest[i][0].split('-')
        let color = p[0];

        p = p.slice(1).map(x=>parseInt(x))
        let prop_vals = {};
        for(let j=0;j<propNames.length;j++){
            prop_vals[propNames[j]] = p[j]
        }

        let ht = 60
        let martop = 13
        let marbot =  0
        fx.innerHTML = `
        <div class="fittest-blobs">
            <div class="row cent">
                <img src="media/blobs/${color}.png" height="${ht}" style="margin-top: ${martop}px; margin-bottom: ${marbot}px">
            </div>
            <br>
            <div class="row">
                <div class="fit-blob-props">
                    <div class="prop-category-icons">
                        <div class="category-icons">
                            <div class="cat-icon-img"><img class="icon-img" src="media/icons/speed.png" width="20"></div>
                            <div class="cat-icon-value">${prop_vals['speed']}-${prop_vals['speed']+1}</div>
                        </div>
                        <br>
                        <div class="category-icons">
                            <div class="cat-icon-img"><img class="icon-img" src="media/icons/stamina.png" width="20"></div>
                            <div class="cat-icon-value">${prop_vals['stamina']}-${prop_vals['stamina']+1}</div>
                        </div>
                    </div>
                    <div class="prop-category-icons">
                        <div class="category-icons">
                            <div class="cat-icon-img"><img class="icon-img" src="media/icons/vision.png" width="20"></div>
                            <div class="cat-icon-value">${prop_vals['vision']}-${prop_vals['vision']+1}</div>
                        </div>
                        <br>
                        <div class="category-icons">
                            <div class="cat-icon-img"><img class="icon-img" src="media/icons/gps.png" width="20"></div>
                            <div class="cat-icon-value">${prop_vals['gps']}-${prop_vals['gps']+1}</div>
                        </div>
                    </div>
                    <div class="prop-category-icons">
                        <div class="category-icons">
                            <div class="cat-icon-img"><img class="icon-img" src="media/icons/greed.png" width="20"></div>
                            <div class="cat-icon-value">${prop_vals['greed']}-${prop_vals['greed']+1}</div>
                        </div>
                    </div>
                </div>
            </div>
            <br>
            <div class="row cent fittest-pop">
                ${Math.round(fittest[i][1] * 100 / tot) / 1}% (${fittest[i][1]})
            </div>
        </div>
    
    `



    }

    
}

function showGeneData(genes){

    for(let id in tempGeneData)
        deleteGene(id);

    console.log(tempGeneData)

    popPie.data.labels = []
    popPie.data.datasets[0].data = []

    let n=0;
    for(let g in genes){
        let gId = createNewGene()
        let n = gId;
        changeGeneName(n,genes[g].name);
        setInitPop(n,genes[g].pop);
        setGeneColor(n,genes[g].colorName);
        for(let f in genes[g].props){
            let prop = genes[g].props[f];
            let mut = (prop.mutation_chance > 0);
            // alert(`${f} mutating? ${mut}`)
            setMutation(n,f,(f!='gps')?(caps(f)):(capsAll(f)),mut)
            setGenePropScore(n,f,prop.value)
        }
        selectGeneImg(n)
        n++;
    }


    let dom = document.getElementById('mid-bar-genes');
    dom.innerHTML = ''
    console.log(genes)
    for(let g in genes){
        console.log(g)
        dom.innerHTML += `
            <div class="bar-btn cent">
                <img class="bar-img cent" src="${genes[g].img}">
            </div>
        `
    }
}


// Mid-bar buttons
document.getElementById('play-day-btn').addEventListener('click',e => {
    W.startDemo({sim_length:1, wait_duration: 20});
})
document.getElementById('pause-btn').addEventListener('click',e => {
    W.pauseSim();
    W.pauseDemo();
})
document.getElementById('sim-days-1-btn').addEventListener('click',e => {
    W.startSim({sim_length:1, wait_duration:1});
})
document.getElementById('sim-days-20-btn').addEventListener('click',e => {
    W.startSim({sim_length:20, wait_duration:1});
})
document.getElementById('sim-days-100-btn').addEventListener('click',e => {
    W.startSim({sim_length:100, wait_duration:1});
})
document.getElementById('sim-days-500-btn').addEventListener('click',e => {
    W.startSim({sim_length:500, wait_duration:1});
})
document.getElementById('trends-btn').addEventListener('click',e => {
    updateTrends()
    trend_modal.open()
})
document.getElementById('restart-btn').addEventListener('click',e => {
    W.loadGeneData(JSON.stringify(W.genes))
})
document.getElementById('edit-genes-btn').addEventListener('click',e => {
    gene_modal.open();
})
document.getElementById('save-genes-btn').addEventListener('click',e => {
    W.saveGeneData()
})
document.getElementById('load-genes-btn').addEventListener('click',e => {
    W.loadGeneData()
})
document.getElementById('testing-toggle-btn').addEventListener('click',e => {
    TESTING = !TESTING;
    W.loadGeneData();
    if(TESTING) document.getElementById('testing-toggle-btn').classList.add('selected-icon')
    else document.getElementById('testing-toggle-btn').classList.remove('selected-icon')
})
document.getElementById('clear-world-btn').addEventListener('click',e => {
    W.resetPainter(true)
})


function selectTerrainIcon(id){
    for(let dom of document.getElementsByClassName('terrain-img')){
        if(id == dom.id){
            dom.children[0].classList.add('selected-bar-img');
            W.painter.selectTerrain(dom.children[0].src)
        }
        else{
            dom.children[0].classList.remove('selected-bar-img')
        }
    }
}

document.getElementById('draw-world-btn').addEventListener('click',e => {
    if(W.running) return;
    document.getElementById('draw-world-btn').classList.add('selected-icon')
    document.getElementById('fill-world-btn').classList.remove('selected-icon')
    document.getElementById('terrain-img-icons').style.display = 'none'
    W.setDraw(true)
    W.setFill(false)
})
document.getElementById('fill-world-btn').addEventListener('click',e => {
    if(W.running) return;
    document.getElementById('fill-world-btn').classList.add('selected-icon')
    document.getElementById('draw-world-btn').classList.remove('selected-icon')
    document.getElementById('terrain-img-icons').style.display = 'block'
    W.setDraw(false)
    W.setFill(true)
})

document.getElementById('done-edit-world-btn').addEventListener('click', e => {
    if(W.running) return;
    document.getElementById('draw-world-btn').classList.remove('selected-icon')
    document.getElementById('fill-world-btn').classList.remove('selected-icon')
    document.getElementById('terrain-img-icons').style.display = 'none'
    W.setDraw(false)
    W.setFill(false)
})


// showDominant()

window.addEventListener('resize', e => {
    resizeDOMs();
})


const resizeDOMs = () => {

    let wid = window.innerWidth;
    let ht = window.innerHeight;

    // middle options bar
    let midBar = document.getElementById('mid-options-bar');
    let midBarW = 60;
    midBar.style.width = `${midBarW}px`;
    midBar.style.height = `${ht}px`

    // top options bar
    let topBar = document.getElementById('top-options-bar');
    let topBarH = midBarW;
    topBar.style.width = '100%';
    topBar.style.height = `${topBarH}px`;

    // world canvas
    let worldW = ht - topBarH - 4
    W.resize(worldW);

    // left info bar
    let leftBar = document.getElementById('left-info-bar');
    leftBar.style.width = `${(wid - worldW - midBarW)}px`;
    leftBar.style.height = `${ht}px`

    // pop-line bar
    let popline = document.getElementById('pop-line-container');
    popline.style.height = `${window.innerHeight * 0.115}px`
    popline.style.width = '100%'
}
resizeDOMs();


