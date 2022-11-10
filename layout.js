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

var gene_list = new Set()
// var genes = {}

var active_gene = null;


function addNewGene(gname,props=null){
    active_gene = gname


    gene_list.add(gname)
    W.genes[gname] = {
        name: gname,
        inUse: true,
        color: `rgba(${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},${Math.floor(Math.random()*256)},0.6)`,
        props:{}
    }

    if(props == null){
        
        for(let f in features){
            W.genes[gname].props[f] = {
                value: features[f].def_val,
                mutation_chance: features[f].def_mut
            }
        }

    }
    else{
        for(let f in features){
            W.genes[gname].props[f] = {
                value: parseFloat(props[f].value),
                mutation_chance: parseFloat(props[f].mutation_chance)
            }
        }
    }

    let p = `
    <ul id="${gname}-props" class="collection gene-props" style="display:none">
    `
    
    for(let f in features){
        p = p + `
            <li class="collection-item" style="padding-left: 0; background-color:${changeOpacity(W.genes[gname].color,0.2)}">
                <div class="row" style="margin: 0;"> 
                    <div class="col s3" style="display: inline-block; ">
                        <div class="row">
                            <div class="col s3" style="cursor:pointer; display: inline-block;" >
                                <i style="cursor:pointer;" class="material-icons" onclick="editGeneProps('${gname}','${f}',${features[f].def_val},${features[f].def_mut})">loop</i>
                            </div>
                            <div class="col s9">
                                &nbsp;&nbsp;${f.toUpperCase()}:
                            </div>
                        </div>

                    </div>
                    <div class="col s9" >
                        <div class="row">
                            <div class="col s2 offset-s1">
                                <label style="padding-top: 25px;">Value: &nbsp;</label>
                            </div>
                            <div class="col s6 offset-s1">
                                <form action="#">
                                    <p class="range-field">
                                    <input id="${gname}-${f}-val-inp" oninput="editGeneProps('${gname}','${f}',this.value,null)" type="range" min="${features[f].min}" max="${features[f].max}" step="${features[f].mut_inc}" value="${W.genes[gname].props[f].value}" />
                                    </p>
                                </form>
                            </div>
                            <div class="col s1">
                                <div id="${gname}-${f}-val-val" style="margin-top: 5px;">${W.genes[gname].props[f].value}</div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col s2 offset-s1">
                                <label style="padding-top: 25px;">Mutation: </label>
                            </div>
                            <div class="col s6 offset-s1">
                                <form action="#">
                                    <p class="range-field">
                                        <input id="${gname}-${f}-mut-inp" oninput="editGeneProps('${gname}','${f}',null,this.value)" type="range" min="0" max="1" step="0.05" value="${W.genes[gname].props[f].mutation_chance}" />
                                    </p>
                                </form>
                            </div>
                            <div class="col s1">
                                <div id="${gname}-${f}-mut-val" style="margin-top: 5px;">${W.genes[gname].props[f].mutation_chance}</div>
                            </div>

                    </div>
                    <div class="col s1"></div>
                </div>
            </li>
        `
    }

    p = p + `</ul>`
    document.getElementById('gene-props-sidebar').innerHTML += p;
    
    loadPresetContent()

    document.getElementById('new-gene-inp').value = ''

    sumbar.data.datasets.push({
        gene: gname,
        label: gname,
        data: Object.keys(W.genes[gname].props).map(p=>W.genes[gname].props[p].value / features[p].max),
        backgroundColor: W.genes[gname].color
    })

    sumbar.update()


}



function removeGene(gname){
    gene_list.delete(gname)
    delete W.genes[gname]
    // delete propsDOM[[gname]]
    document.getElementById(`${gname}-props`).remove()

    active_gene = Object.keys(W.genes)[0]

    loadPresetContent()

    sumbar.data.datasets = sumbar.data.datasets.filter(d=>d.gene!=gname)
    sumbar.update()

}

function setGeneProps(g,props){
    for(let f in props){
        let v = parseFloat(props[f].value)
        let m = parseFloat(props[f].mutation_chance)
        // console.log(`setting ${g}-${f} to ${props[f].value}`)

        document.getElementById(`${g}-${f}-val-inp`).value = v
        document.getElementById(`${g}-${f}-mut-inp`).value = m
        editGeneProps(g,f,v,m)
    }

}


function editGeneProps(g,f,v,m){
    // console.log('editing',g,f,v,m)
    if(v!=null) {
        W.genes[g].props[f].value = v
        document.getElementById(`${g}-${f}-val-val`).innerHTML = v;
        for(let d of sumbar.data.datasets){
            if(d.gene != g) continue
            let j=-1;
            for(let x in features){
                j++
                if(x!=f) continue
                d.data[j] = v / features[x].max
            }
        }
    }
    if(m!=null) {
        W.genes[g].props[f].mutation_chance = m
        document.getElementById(`${g}-${f}-mut-val`).innerHTML = m;
    }

    
    sumbar.update()

}


function loadPresetContent(){
    var glist = document.getElementById('gene-list-sidebar')
    glist.innerHTML = `<li class="collection-header">List of Genes:</li>`
    for(let g of gene_list){
        glist.innerHTML += `<li class="collection-item"  style="cursor:context-menu; padding-left: 10px; padding-right: 4px; background-color:${changeOpacity(W.genes[g].color,0.4)}" onclick="activateGene('${g}')">
                <div class="row" style="margin:0">
                    <div class="col s10" style="margin:0;padding:0;height:100%">${g}</div>
                    <div class="col s2">
                        <a href="#!" class="secondary-content" onclick="removeGene('${g}')"><i class="material-icons">delete</i></a>
                    </div>
                </div>
            </li>`        
    }

    for(let dom of document.getElementsByClassName('gene-props')){
        dom.style.display = 'none'
        if(dom.id.split('-')[0] == active_gene)
            dom.style.display = 'block'
    }

}

function activateGene(g){
    if(W.genes[g] == null) return;
    active_gene = g
    loadPresetContent()
}





function loadPreset(preset_str){
    for(let g in W.genes)
        removeGene(g)
    let data = JSON.parse(preset_str)
    for(let g in data){
        addNewGene(g,data[g].props)
        // setGeneProps(g,data[g].props)
    }
}





const test_preset = '{"simple":{"name":"simple","inUse":true,"color":"rgba(205,130,173,0.6)","props":{"pop":{"value":1,"mutation_chance":0},"speed":{"value":4,"mutation_chance":0.1},"vision":{"value":"80","mutation_chance":0.3},"gps":{"value":"0.7","mutation_chance":0.05},"greed":{"value":0.5,"mutation_chance":0.05}}}}'

document.getElementById('load-preset').onclick = () => {
    document.getElementById('load-preset-file').click()
}

document.getElementById('save-preset').onclick = () => {
    download(JSON.stringify(W.genes), 'test.txt','text/plain')
}


// loadPreset(test_preset)


function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
    //   displayContents(contents);
    loadPreset(contents);
    };
    reader.readAsText(file);
}
  
  
document.getElementById('load-preset-file')
.addEventListener('change', readSingleFile, false);

loadPreset(test_preset)












let propNames = ['speed','stamina','vision','gps','greed']

var geneId = 0
var tempGeneData = []
var activeGeneImg = 0
const maxTokens = 30;

let tcols = ['rgba(223,135,97,0.4)','rgba(151,145,234,0.4)','rgba(57,176,93,0.4)','rgba(242,125,138,0.4)','rgba(99,158,222,0.4)']

function createNewGene(){
    if(tempGeneData.length==5) return;
    let mod = document.getElementById('modal-imgs');
    mod.innerHTML += `<div id="gene-img-container-${tempGeneData.length}" style="float:left;margin-left:20px"><img id="gene-imgs-${tempGeneData.length}" src="media/spot.png" width="150px" style="
    filter: hue-rotate(${230*tempGeneData.length}deg);" onmousedown="selectGeneImg(${tempGeneData.length})"></div>`
    tempGeneData.push(
        {
            props:{}, 
            gname:'Gene'+(tempGeneData.length+1),
            init_pop:1,
            tokens_used: 0
        }
    )
    let n = tempGeneData.length-1;
    tempGeneData[n].col = n;
    createGeneStatsCol(n)
    selectGeneImg(n)

    popPie.data.labels.push(tempGeneData[n].gname)
    popPie.data.datasets[0].data.push(10)
    popPie.data.datasets[0].backgroundColor.push(changeOpacity(tcols[n],0.7))
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
                        <div class="input-circles input-circles-${n}" style="color:${tcols[n]};">
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
            <div id="${n}-color-choice-${i}" class="square" style="background-color:${changeOpacity(tcols[i],1)}" onclick="setGeneColor(${n},${i})"></div>
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
    popPie.data.datasets[0].backgroundColor[n] = changeOpacity(tcols[c],0.7)
    popPie.update()
    document.getElementById('gene-imgs-'+n).style.filter = `hue-rotate(${230*c}deg)`
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
        document.getElementById(`${f}-stat-inp-${n}-${i}`).style.color = (i<v) ? changeOpacity(tcols[tempGeneData[n].col],0.9) : tcols[tempGeneData[n].col]
    }
    document.getElementById(`${f}-stat-val-${n}`).innerHTML = v
    let res = (maxTokens - usedTokens - v)
    document.getElementById(`tokens-left-${n}`).innerHTML = res
}

function deleteGene(n){
    // tempGeneData.splice(n,1);
    // document.getElementById('gene-stats-'+n).remove()
    // document.getElementById('gene-info-'+n).remove()
    // document.getElementById('gene-img-container-'+n).remove()

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