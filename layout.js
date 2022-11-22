let propNames = ['speed','stamina','vision','gps','greed']

var geneId = 0
var tempGeneData = []
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
    if(tempGeneData.filter(g=>g.active).length==5) return;
    let mod = document.getElementById('modal-imgs');
    let col = gcol_names[tempGeneData.length % gcol_names.length]
    mod.innerHTML += `<div 
                        id="gene-img-container-${tempGeneData.length}" 
                        style="float:left;margin-left:20px"
                    >
                    <img 
                        id="gene-imgs-${tempGeneData.length}" 
                        src="media/blobs/${col}.png" width="150px" 
                        onmousedown="selectGeneImg(${tempGeneData.length})"></div>`
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
    tempGeneData[n].col = col;
    createGeneStatsCol(n)
    selectGeneImg(n)

    popPie.data.labels.push(tempGeneData[n].gname)
    popPie.data.datasets[0].data.push(10)
    popPie.data.datasets[0].backgroundColor.push(changeOpacity(gcols[col],0.7))
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
        setGenePropScore(n,f,5)
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
        document.getElementById(`shelf-life-${n}`).innerHTML = 100 + (10 * v)
    }
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
    W.setGeneData(null, genes.filter(g => g.active).map(g => {
        let props = {}
        for(let f in g.props){
            props[f] = {
                value: parseFloat(g.props[f].value),
                mutation_chance: (g.props[f].mutation) ? parseFloat(features[f].def_mut) : 0
            }
        }
        // console.log(props)
        return {
            gname: g.gname,
            col: gcols[g.col],
            img: `media/blob_draw/${g.col}.png`,
            colorName: g.col,
            props: props,
            pop: parseInt(g.init_pop)
        }
    }))
}

function showDominant(pop_stats){
    // propwise stats
    // pop_stats = {'5-5-5-5-5': 42, ...}
    // console.log(pop_stats, typeof pop_stats)

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
        let martop = 20
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

// showDominant()

window.addEventListener('resize', e => {
    resizeDOMs();
})


const resizeDOMs = () => {
    W.resize(window.innerHeight);

    // left info bar
    let leftBar = document.getElementById('left-info-bar');
    leftBar.style.width = `${window.innerWidth - window.innerHeight}px`;
    leftBar.style.height = `${window.innerHeight}px`

    // pop-line bar
    let popline = document.getElementById('pop-line-container');
    popline.style.height = `${window.innerHeight * 0.14}px`
    popline.style.width = '100%'
}
resizeDOMs();


