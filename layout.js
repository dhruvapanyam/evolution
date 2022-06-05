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
                                <label style="padding-top: 25px;">Value: </label>
                            </div>
                            <div class="col s8">
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
                            <div class="col s4 offset-s1">
                                <label style="padding-top: 25px;">Mutation: </label>
                            </div>
                            <div class="col s6">
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