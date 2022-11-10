const canvas = document.getElementById('paint-canvas')
var size = {x:1100,y:400}
canvas.style.width = size.x+'px'
canvas.style.height = size.y+'px'
const ctx = canvas.getContext('2d')

ctx.fillRect(0,0,size.x,size.y)

class paintCanvas{
    constructor(canvas,ctx){
        this.canvas = canvas
        this.ctx = ctx;
        this.ctx.strokeStyle = 'white'
        this.ctx.lineWidth = 0.5

        this.mouseXY = {x:0,y:0}
        this.mousedown = false

        document.addEventListener('mousedown', e=>{this.mousedown = true})
        document.addEventListener('mouseup', e=>{this.mousedown = false})
        document.addEventListener('mousemove', this.handleMouseMove)



        this.drawing = false

    }

    handleMouseMove = (e) => {
        var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
    
      let crd =  {
        x: (e.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (e.clientY - rect.top) * scaleY     // been adjusted to be relative to element
      }

        if(this.mousedown){
            this.ctx.beginPath()
            this.ctx.lineWidth = 0.2
            this.ctx.moveTo(this.mouseXY.x,this.mouseXY.y)
            this.ctx.lineTo(crd.x,crd.y)
            
            this.ctx.closePath()
            this.ctx.stroke()
        }
        this.mouseXY.x = crd.x
        this.mouseXY.y = crd.y
    }

    draw = () => {this.drawing = true}

    findRegions = () => {
        var img = this.ctx.getImageData(0,0,size.x,size.y)
        let Q = []
        var visited = new Set()
        for(let i=0;i<size.y;i++){
            for(let j=0;j<size.x;j++){
                if(visited.has(i*size.y+j)){
                    continue
                }
                if(img.data[4*(i*size.y+j)]+img.data[4*(i*size.y+j)+1]+img.data[4*(i*size.y+j)+2] > 0) continue


                // start new bfs cycle
                let rndCol = [Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)]
                console.log(rndCol)
                console.log('starting new component')
                Q.push([i,j])
                visited.add(i*size.y+j)
                let counter=0
                while (Q.length > 0){
                    let node = Q.shift()
                    counter++
                    // console.log(node)
                    img.data[4*(node[0]*size.y+node[1])] = rndCol[0]
                    img.data[4*(node[0]*size.y+node[1])+1] = rndCol[1]
                    img.data[4*(node[0]*size.y+node[1])+2] = rndCol[2]
                    if(counter==1) console.log(rndCol)

                    for(let l=0;l<2;l+=1){
                        for(let m=0;m<2;m+=1){
                            let p = node[0]+m
                            let q = node[1]+l
                            
                            if(p<0||q<0||p>size.y||q>size.x) continue
                            if(visited.has(p*size.y+q)) continue
                            // console.log(img.data[4*(p*size.y+q)]+img.data[4*(p*size.y+q)+1]+img.data[4*(p*size.y+q)+2])
                            if(img.data[4*(p*size.y+q)]+img.data[4*(p*size.y+q)+1]+img.data[4*(p*size.y+q)+2] > 0) {
                                // console.log('bound')
                                continue
                            }

                            Q.push([p,q])
                            visited.add(p*size.y+q)
                        }
                    }

                }
        console.log(counter)

                // return;
            }
        }
        this.ctx.putImageData(img,0,0)
    }

    checkVal = () => {
        let img = this.ctx.getImageData(0,0,size.x,size.y);
        for(let i=0;i<size.y;i+=1){
            for(let j=0;j<size.x;j+=1){
                let p=i
                let q=j
                let v = (img.data[4*(p*size.y+q)]+img.data[4*(p*size.y+q)+1]+img.data[4*(p*size.y+q)+2])
                if(v) console.log(v)
            }
        }
    }


}

var Paint = new paintCanvas(canvas,ctx)