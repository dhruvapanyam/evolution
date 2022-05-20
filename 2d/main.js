world = document.getElementById('world')
size = {h:500,w:500}
world.width = size.w
world.height = size.h
// world.style.backgroundColor = 'red'




const chart = document.getElementById('chart')
const myChart = new Chart(chart, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '#Population',
            data: [],
            borderColor: 'black',
            fill: true
        },{
            label: '#Births',
            data: [],
            borderColor: 'blue',
            fill: true
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});





var slideFood = document.getElementById('slideFood')
var slideSpeed = document.getElementById('slideSpeed')
var slidePop = document.getElementById('slidePop')
var slideTTL = document.getElementById('slideTTL')
var slideFOV = document.getElementById('slideFOV')
var slideBirth = document.getElementById('slideBirth')



ctx = world.getContext('2d')
// console.log(world)
ctx.lineWidth = 4

class Vec{
    constructor(x,y){
        this.x = x
        this.y = y
    }

    copy = () => {
        return new Vec(this.x,this.y)
    }

    neg = () => {
        return new Vec(-this.x,-this.y)
    }

    add = (b) => {
        this.x += b.x
        this.y += b.y
    }

    sub = (b) => {
        this.add(b.neg())
    }

    addC = (b) => {
        return new Vec(this.x+b.x,this.y+b.y)
    }

    subC = (b) => {
        return this.addC(b.neg())
    }

    distTo = (b) => {
        return Math.sqrt((this.x-b.x)**2 + (this.y-b.y)**2)
    }

    scale = (f) => {
        this.x*=f
        this.y*=f
    }

    bordered = (dim) => {
        // dim = {w:[0,300],h:[0,200]}
        if(this.x<dim.w[0]) this.x = dim.w[0]
        else if(this.x>dim.w[1]) this.x = dim.w[1]
        if(this.y<dim.h[0]) this.y = dim.h[0]
        else if(this.y>dim.h[1]) this.y = dim.h[1]
    }

    equals = (b) => {
        if(b == undefined) return false;
        return (this.x==b.x && this.y==b.y)
    }

    angle = () => {
        return Math.atan2(this.y,this.x)
    }
}

a = new Vec(3,4)
b = new Vec(8,5)

function randVec(l=1,ang=Math.random()*Math.PI*2){
    return new Vec(l*Math.cos(ang),l*Math.sin(ang))
}

class Creature{
    constructor(id,speed,ttl,pos,dim){
        // params include SPEED, TTL, SENSE, ...
        this.id = id
        this.speed = speed
        this.init_ttl = ttl
        this.ttl = ttl
        this.food = 0
        this.pos = pos
        this.ang = new Vec((dim.w[0]+dim.w[1])/2, (dim.h[0]+dim.h[1])/2).subC(this.pos).angle()
    }

    reset = (dim) => {
        this.food = 0
        this.ttl = this.init_ttl
        this.ang = new Vec((dim.w[0]+dim.w[1])/2, (dim.h[0]+dim.h[1])/2).subC(this.pos).angle()
        
    }

    alive = () => {
        return(this.ttl > 0)
    }

    move = (dim) => {
        if(!this.alive()) return;
        // console.log('moving:',this.id)
        this.ang += (Math.random()*2-1)*slideFOV.value
        this.pos.add(randVec(this.speed,this.ang))
        this.pos.bordered(dim)
    }

    killSlowly = () => {
        this.ttl -= 1
    }

    safe = (dim) => {
        // console.log(dim)
        return (this.food>0 && (this.pos.x==dim.w[0]||this.pos.x==dim.w[1]||this.pos.y==dim.h[0]||this.pos.y==dim.h[1]))       
    }
}



class Ecosystem{
    constructor(c,size,params){
        // params include population, num_food, init_speed, init_ttl, ...
        this.params = params

        this.c = c // canvas
        this.size = size
        this.dim = {w:[0,this.size.w], h:[0,this.size.h]}

        this.resetWorld()
    }

    randInitPos = () => {
        let size = this.size
        let initpos = Math.random()*2*(size.w+size.h)
        let pos;
        if(initpos<size.w)
            pos = new Vec(Math.random()*size.w,0)
        else if(initpos < size.w+size.h)
            pos = new Vec(size.w, Math.random()*size.h)
        else if(initpos < size.w*2+size.h)
            pos = new Vec(Math.random()*size.w,size.h)
        else
            pos = new Vec(0,Math.random()*size.h)

        return pos;
    }

    resetWorld = () => {

        this.params.speed = slideSpeed.value
        this.params.food = slideFood.value
        this.params.pop = slidePop.value
        this.params.ttl = slideTTL.value

        this.life = new Set()
        this.food = new Set()
        this.maxID = 1

        for(let i=0;i<this.params.pop;i++){
            this.addCreature()
        }

        this.state = 'stopped'
        this.drawWorld()

        this.day = 0

        myChart.data.datasets[0].data = []
        myChart.data.datasets[1].data = []
        myChart.data.labels = []
        myChart.update()
    }

    addCreature = () => {
        let pos = this.randInitPos()
        // console.log('current ID:',this.maxID)
        this.life.add(new Creature(this.maxID++,this.params.speed,this.params.ttl,pos,this.dim))
        this.drawWorld()
    }

    

    growFood = () => {
        this.food = new Set()
        for(let i=0;i<this.params.food;i++){
            this.food.add({
                pos:new Vec(Math.random()*this.size.w, Math.random()*this.size.h),
                consumed: false
            })
        }
    }

    drawWorld = () => {
        let c = this.c

        // Creatures

        for(let cr of Array.from(this.life)){
            // console.log(cr.pos.x,cr.pos.y)
            // let col = Math.round(cr.ttl*255/cr.init_ttl)
            let col = cr.food>0 ? (cr.food>1 ? 'blue' : 'green') : 'black'
            c.fillStyle = col
            // c.fillStyle = 'rgb('+String(0)+','+String(col)+','+String(0)+')'
            c.beginPath()
            c.arc(cr.pos.x,cr.pos.y,6,0,Math.PI*2)
            c.fill()
        }

        // Food

        for(let f of Array.from(this.food)){
            if(f.consumed) continue
            c.fillStyle = 'red'
            c.beginPath()
            c.arc(f.pos.x,f.pos.y,2,0,Math.PI*2)
            c.fill()
        }
        

    }

    setupRun = () => {
        // kill all unsafe 
        // reproduce if poss
        let births=0;
        for(let cr of this.life){
            if(cr.safe(this.dim)) {
                if(cr.food > 1) births++
                cr.reset(this.dim)
            }
            else this.life.delete(cr)
        }
        let successful_births = 0;
        for(let i=0;i<births;i++){
            successful_births += Math.random()<slideBirth.value ? 1 : 0
        }
        console.log('Num births:',successful_births)
        myChart.data.datasets[1].data.push(successful_births)
        for(let i=0;i<successful_births;i++) this.addCreature()
        
    }

    startRun = () => {
        // if(this.state == 'stopped') return;
        if(this.state == 'paused') this.setupRun()
        this.day += 1
        this.state = 'running'
        this.growFood()
        this.timeLeft = Math.max(...Array.from(this.life).map(cr => cr.ttl))

        myChart.data.labels.push('Day '+String(this.day))
        myChart.data.datasets[0].data.push(Array.from(this.life).length)
        myChart.update()
    }

    update = () => {
        if(this.state != 'running') return;
        // console.log('updating...')

        for(let cr of Array.from(this.life)){
            if(cr.safe(this.dim)) continue
            
            // if(cr.id!=1) continue
            // console.log('moving ID:',cr.id)
            cr.move(this.dim)
            cr.killSlowly()
        }

        for(let f of this.food){
            // if(f.consumed) continue
            for(let cr of Array.from(this.life)){
                if(cr.food>1) continue
                if(f.pos.distTo(cr.pos) < 8){
                    cr.food+=1
                    f.consumed = true
                    this.food.delete(f)
                }
            }
        }

        this.timeLeft--
        if(this.timeLeft == 0){
            // this.setupRun()
            let alive=0;
            for(let cr of Array.from(this.life)){
                if(cr.safe(this.dim)) alive++
            }
            console.log('num alive:',alive)
            this.state = 'paused'



            setTimeout(()=>{this.startRun()},10)
        }

    }

}

E = new Ecosystem(ctx,size,{
    pop: 100,
    food: 200,
    speed: 8,
    ttl: 200
})

E.resetWorld()


document.getElementById('resetWorld').onclick = ()=>{E.resetWorld()}
// document.getElementById('setupSim').onclick = ()=>{E.setupRun()}
document.getElementById('startSim').onclick = ()=>{E.startRun()}
document.getElementById('resetParams').onclick = ()=>{
    document.getElementById('slideFood').value = 200
    document.getElementById('slideSpeed').value = 8
    document.getElementById('slidePop').value = 100
    document.getElementById('slideTTL').value = 200
    document.getElementById('slideFOV').value = 0.5
    document.getElementById('slideBirth').value = 0.7
}























setInterval(()=>{
    E.update()
},1)


function animate(){
    {
    ctx.fillStyle = 'rgba(230,230,230,0.7)'
    ctx.fillRect(0,0,size.w,size.h)
    ctx.beginPath()
    ctx.moveTo(0,0)
    ctx.lineTo(size.w,0)
    ctx.lineTo(size.w,size.h)
    ctx.lineTo(0,size.h)
    ctx.lineTo(0,0)
    ctx.closePath()
    ctx.stroke()
    }
    E.drawWorld()
    // E.update()
    document.getElementById('timeLeft').innerHTML = E.timeLeft
    document.getElementById('currentPop').innerHTML = Array.from(E.life).length
    document.getElementById('inpFood').innerHTML = document.getElementById('slideFood').value
    document.getElementById('inpSpeed').innerHTML = document.getElementById('slideSpeed').value
    document.getElementById('inpPop').innerHTML = document.getElementById('slidePop').value
    document.getElementById('inpTTL').innerHTML = document.getElementById('slideTTL').value
    document.getElementById('inpFOV').innerHTML = document.getElementById('slideFOV').value
    document.getElementById('inpBirth').innerHTML = document.getElementById('slideBirth').value
    requestAnimationFrame(animate)
}

animate()
