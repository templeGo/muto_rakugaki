var thiefs = [];
var polices = [];
var souls = [];

var worldRecord = 80;
var BGC = "#01000B";

var maxThiefsSize = 150;
var maxPolicesSize = 10;

var adjust = 1;

function setup(){
  if(windowWidth < windowHeight){
    
    adjust = 0.6;
  }
  var myCanvas = createCanvas(windowWidth, windowHeight, WEBGL);
  myCanvas.parent("#canvas");
  background(color(BGC));
  for(var i = 0; i < 20; i++){
    thiefs.push(new Thief(random(width), random(height)));
  }
  for(var i = 0; i < 2; i++){
    polices.push(new Police(random(width), random(height)));
  }
}

function draw(){
  background(color(BGC));

  if(thiefs.length < maxThiefsSize && mouseIsPressed){
    thiefs.push(new Thief(mouseX, mouseY));
  }
  
  drawThiefs();

  drawPolices();

  drawDisappearingSouls();
  
  drawFrame(30 * adjust);
}

function drawThiefs(){
  for(var i = 0; i < thiefs.length; i++){
    var target = thiefs[i].randomWalk();
    for(var j = 0; j < polices.length; j++){
      target.add(thiefs[i].predictTarget(polices[j]));
    }
    thiefs[i].flock(thiefs);
    thiefs[i].seek(target);
    thiefs[i].update();
    thiefs[i].keepAwayFromWall(random(30 * adjust, 35 * adjust));
    thiefs[i].bounceOffwall();
    thiefs[i].display();

    if(thiefs[i].isDead){
      souls.push(new Soul(thiefs[i].location.x, thiefs[i].location.y));
      thiefs.splice(i, 1);
    }
  }
}

function drawPolices(){
  for(var i = 0; i < polices.length; i++){
    var target = polices[i].randomWalk();
    for(var j = 0; j < thiefs.length; j++){
      var thiefLoc = thiefs[j].location.copy();
      var distance = thiefLoc.sub(polices[i].location).mag();
      if(distance < worldRecord){
        worldRecord = distance;
        target = thiefs[j].location.copy();
      }
    }
    target.add(polices[i].avoidMouse(createVector(mouseX, mouseY)));
    polices[i].separate(polices);
    polices[i].seek(target);
    polices[i].update();
    polices[i].keepAwayFromWall(20 * adjust);
    polices[i].bounceOffwall();
    polices[i].display();

    worldRecord = polices[i].visibility;
  }
}

function drawDisappearingSouls(){
  for(var i = 0; i < souls.length; i++){
    souls[i].update();
    souls[i].display();
  }
}

function drawFrame(offset){
  push();
  translate(0, 0);
  noFill();
  var c = color("#FFFFFF");
  c.setAlpha(70);
  stroke(c);
  rectMode(CENTER);
  rect(0, 0, windowWidth-offset*2, windowHeight-offset*2);
  pop();
}

function keyPressed(){
  if(polices.length < maxPolicesSize && (keyIsPressed == true) && (key == 'p')){
    polices.push(new Police(random(width), random(height)));
  }
  if(polices.length > 1 && (keyIsPressed == true) && (key == 'o')){
    polices.splice(0, 1);
  }
}

class Vehicle{
  constructor(x, y){
    var location;
    var velocity;
    var acceleration;
    var r;
    var c;
    var maxspeed;
    var maxforce;
    var visibility;
    var boost;

    this.acceleration = createVector(random(-1, 1), random(-1, 1));
    this.velocity = createVector(0, 0);
    this.location = createVector(x, y);
    this.r = 2.5;
    this.maxspeed = 2;
    this.maxforce = 0.1;
    this.boost = 1.5;
  }

  update(){
    // applyforceのsteerに制限をかけているため、十分な大きさのvelocityが得られない。毎回基本サイズに調整が必要。
    this.velocity.normalize().mult(this.boost);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.location.add(this.velocity);
    this.acceleration.mult(0);
  }

  applyForce(force){
    this.acceleration.add(force);
  }

  seek(target){
    var desired = target.copy().sub(this.location);
    desired.normalize();
    desired.mult(this.maxspeed);
    var steer = desired.copy().sub(this.velocity);
    steer.limit(this.maxforce);
    this.applyForce(steer);
  }

  randomWalk(){
    var currentVelocity = createVector(this.velocity.x, this.velocity.y);
    var predictLocation = p5.Vector.add(this.location, currentVelocity);

    // randomWalkする
    var randomVector = p5.Vector.random2D();
    var target = predictLocation.add(randomVector);
    // PVector target = predictLocation;

    return target;
  }

  display() {
    var theta = this.velocity.heading() + PI/2;
    fill(color(this.c));
    noStroke();
    push();
    translate(this.location.x - windowWidth*0.5, this.location.y - windowHeight*0.5);
    rotate(theta);
    beginShape();
    vertex(0, -this.r*2);
    vertex(-this.r, this.r*2);
    vertex(0, this.r*3);
    vertex(this.r, this.r*2);
    endShape(CLOSE);
    pop();
  }

  gothroughwall(){
    if(this.location.x > windowWidth){
      this.location.x = 0;
    }else if(this.location.x < 0){
      this.location.x = width;
    }

    if(this.location.y > windowHeight){
      this.location.y = 0;
    }else if(this.location.y < 0){
      this.location.y = displayHeihgt;
    }
  }

  bounceOffwall(){
    var offset = 1;
    if(this.location.x >= windowWidth - offset){
      this.location.x = windowWidth - offset;
    }else if(this.location.x <= offset){
      this.location.x = offset;
    }

    if(this.location.y >= windowHeight - offset){
      this.location.y = windowHeight - offset;
    }else if(this.location.y < offset){
      this.location.y = offset;
    }
  }


  keepAwayFromWall(offset){
    var desired = createVector(0, 0);
    if(this.location.x > windowWidth - offset){
      desired = createVector(-this.maxspeed, this.velocity.y);
    }else if(this.location.x < offset){
      desired = createVector(this.maxspeed, this.velocity.y);
    }

    if(this.location.y > windowHeight - offset){
      desired = createVector(this.velocity.x, -this.maxspeed);
    }else if(this.location.y < offset){
      desired = createVector(this.velocity.x, this.maxspeed);
    }

    var steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce*2);
    this.applyForce(steer);
  }
}


class Police extends Vehicle{
  constructor(x, y){
    super(x, y);
    this.maxforce = 0.1;
    this.maxspeed = 4;
    this.visibility = 150;
    this.boost = 2;
    this.c = "#FFFFFF";
  }

  update(){
      super.update();
  }

  applyForce(force){
      super.applyForce(force);
  }

  seek(target){
      super.seek(target);
  }

  randomWalk(){
      return super.randomWalk();
  }

  avoidMouse(mouse){
    var target = createVector(0, 0);

    // police->mouseのベクトル
    var diff = p5.Vector.sub(mouse, this.location);
    // mouseとの距離
    var d = diff.mag();
    
    if(d < 20){
        target.add(diff.mult(-this.maxspeed)).mult(2);
    }
    
    return target;
}

  separate(polices){
      var desiredseparation = this.r*10;
      var sum = createVector(0, 0);
      var count = 0;
      for(var i = 0; i < polices.length; i++){
        var d = p5.Vector.dist(this.location, polices[i].location);
        if((d > 0) && (d < desiredseparation)){
          var diff = p5.Vector.sub(this.location, polices[i].location);
          diff.normalize();
          diff.div(d);
          sum.add(diff);
          count++;
        }
      }

      if(count > 0){
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      var steer = p5.Vector.sub(sum, this.velocity); 
      steer.limit(this.maxforce); 
      this.applyForce(steer);
      }
  }

  display(){
      super.display();
  }

  gothroughwall(){
      super.gothroughwall();
  }

  bounceOffwall(){
      super.bounceOffwall();
  }

  keepAwayFromWall(offset){
      super.keepAwayFromWall(offset);
  }
}

class Thief extends Vehicle{
  constructor(x, y){
    super(x, y);
    this.maxforce = 0.22;
    this.visibility = 230;
    this.c = "#034DFF";
    this.isDead = false;
  }

  update(){
      super.update();
  }

  applyForce(force){
      super.applyForce(force);
  }

  seek(target){
      super.seek(target);
  }

  randomWalk(){
      return super.randomWalk();
  }

  predictTarget(vehicle){
      var target = createVector(0, 0);

      // thief->policeのベクトル
      var diff = p5.Vector.sub(vehicle.location, this.location);
      // policeとの距離
      var d = diff.mag();

      // 検死
      this.Autopsy(d);
      
      if(d < this.visibility){
          // 近づくほどspeedを増やす
          var m = map(d,0,this.visibility,this.maxspeed,0);
          target.add(diff.mult(-m));
      }
      
      return target;
  }

  Autopsy(d){
      var deadLine = 4;
      if(d < deadLine){
          this.isDead = true;
      }
  }

  flock(thiefs) {
      this.separate(thiefs);
      this.align(thiefs); 
      // separateの効果が薄れるためcohesionコメントアウト
      // cohesion(thiefs);
  }

  separate(thiefs){
      var desiredseparation = this.r*10;
      var sum = createVector(0, 0);
      var count = 0;

      for(var i = 0; i < thiefs.length; i++){
        var d = p5.Vector.dist(this.location, thiefs[i].location);
        if((d > 0) && (d < desiredseparation)){
          var diff = p5.Vector.sub(this.location, thiefs[i].location);
          diff.normalize();
          diff.div(d);
          sum.add(diff);
          count++;
        }
      }

      if(count > 0){
          sum.div(count);
          sum.normalize();
          sum.mult(this.maxspeed);
          var steer = p5.Vector.sub(sum, this.velocity); 
          steer.limit(this.maxforce);
          this.applyForce(steer);
      }
  }

  align(thiefs){
      var neighbordist = this.r*20;
      var sum = createVector(0, 0);
      var count = 0;
      for(var i = 0; i < thiefs.length; i++){
          var d = p5.Vector.dist(this.location, thiefs[i].location);
          if ((d > 0) && (d < neighbordist)) {
              sum.add(thiefs[i].velocity);
              count++;
          }
      }
      if (count > 0) {
          sum.div(parseFloat(count));
          sum.normalize();
          sum.mult(this.maxspeed);
          var steer = sum.copy().sub(this.velocity);
          steer.limit(this.maxforce);
          this.applyForce(steer);
      }
  }

  cohesion(thiefs){
      var neighbordist = this.r*10;
      var sum = createVector(0, 0);
      var count = 0;
      for(var i = 0; i < thiefs.length; i++) {
          var d = this.location.copy().dist(thiefs[i].location);;
          if ((d > 0) && (d < neighbordist)) {
              sum.add(thiefs[i].location);
              count++;
          }
      }
      if (count > 0) {
          sum.div(count);
          this.seek(sum);
      }
  }

  display(){
      super.display();
  }

  gothroughwall(){
      super.gothroughwall();
  }

  bounceOffwall(){
      super.bounceOffwall();
  }

  keepAwayFromWall(offset){
      super.keepAwayFromWall(offset);
  }

  IsDead(){
      this.isDead = true;
  }
}


class Soul{
  constructor(x, y){
    this.location = createVector(x, y);
    this.size = 0;
    this.life = 255;
    this.isDead = false;
  }

  update(){
    this.size += 1;
    this.life -= 5;
    if(this.life < 0){
      this.isDead = true;
    }
  }

  display(){
    push();
    translate(this.location.x - windowWidth*0.5, this.location.y - windowHeight*0.5);
    noFill();
    var c = color("#7CB8FF");
    c.setAlpha(this.life);
    stroke(c);
    ellipse(0, 0, this.size, this.size);
    pop();
  }
}



